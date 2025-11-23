import { IWalrusService } from '../../domain/services/IWalrusService';
import { ISuiChainService } from '../../domain/services/ISuiChainService';
import { ILocalRepoIndexRepository } from '../../domain/repositories/ILocalRepoIndexRepository';
import { ISealService } from '../../domain/services/ISealService';
import { IEncryptionService } from '../../domain/services/IEncryptionService';
import { ITeeService } from '../../domain/services/ITeeService';

export interface VerifyFilesTeeRequest {
  repoObjectId: string;
  callerAddress: string;
}

export interface FileTeeVerificationResult {
  entryId: string;
  filename: string;
  mimeType: string | null;
  size: number;
  verified: boolean; // true if TEE verification passed
  decision: boolean; // true = legal, false = illegal
  weapon: boolean; // true if weapon detected
  description: string; // TEE description
  error?: string; // Error message if verification failed
}

export interface VerifyFilesTeeResult {
  files: FileTeeVerificationResult[];
  totalFiles: number;
  legalFiles: number;
  illegalFiles: number;
}

/**
 * Use case: Verify staged files with TEE (without burning)
 * Used to display verification status in UI before commit
 */
export class VerifyFilesTeeUseCase {
  constructor(
    private readonly walrusService: IWalrusService,
    private readonly suiChainService: ISuiChainService,
    private readonly localRepoIndexRepository: ILocalRepoIndexRepository,
    private readonly sealService: ISealService,
    private readonly encryptionService: IEncryptionService,
    private readonly teeService: ITeeService
  ) {}

  async execute(request: VerifyFilesTeeRequest): Promise<VerifyFilesTeeResult> {
    const { repoObjectId, callerAddress } = request;

    // Get staged entries
    const stagedEntries = await this.localRepoIndexRepository.getStagedEntries(repoObjectId);
    
    if (stagedEntries.length === 0) {
      return {
        files: [],
        totalFiles: 0,
        legalFiles: 0,
        illegalFiles: 0,
      };
    }

    // Get repository info for policy
    const repoInfo = await this.suiChainService.getRepositoryInfo(repoObjectId);
    const policy = {
      repoId: repoObjectId,
      allowedAddresses: [repoInfo.owner, ...repoInfo.writers, ...repoInfo.readers],
    };

    const results: FileTeeVerificationResult[] = [];
    let legalCount = 0;
    let illegalCount = 0;

    // Verify each file
    for (const entry of stagedEntries) {
      try {
        // Only verify image files
        if (!entry.mimeType || !entry.mimeType.startsWith('image/')) {
          // Non-image files are considered safe
          results.push({
            entryId: entry.id,
            filename: entry.filename,
            mimeType: entry.mimeType,
            size: entry.size,
            verified: true,
            decision: true,
            weapon: false,
            description: 'Non-image file - not verified by TEE',
          });
          legalCount++;
          continue;
        }

        console.log(`[VerifyTEE] Verifying file: ${entry.filename}`);

        // Download ciphertext
        const ciphertext = await this.walrusService.downloadBlob(entry.ciphertextBlobId);
        console.log(`[VerifyTEE] Downloaded ciphertext: ${entry.filename}`);

        // Download sealed FileKey
        const sealedKeyBlob = await this.walrusService.downloadBlob(entry.sealedKeyBlobId);
        console.log(`[VerifyTEE] Downloaded sealed key: ${entry.filename}`);

        // Unseal FileKey
        const unsealResult = await this.sealService.unsealKey(sealedKeyBlob, policy, callerAddress);
        const fileKey = unsealResult.key;
        console.log(`[VerifyTEE] Unsealed FileKey: ${entry.filename}`);

        // Decrypt file
        if (!entry.nonce) {
          throw new Error(`Missing nonce for file ${entry.filename}`);
        }
        const nonce = Buffer.from(entry.nonce, 'hex');
        const decryptResult = this.encryptionService.decryptFile(
          ciphertext,
          nonce,
          fileKey,
          entry.cipherSuite
        );
        console.log(`[VerifyTEE] Decrypted: ${entry.filename}`);

        // Verify with TEE
        const teeResult = await this.teeService.verifyFile(decryptResult.plaintext, entry.mimeType);
        console.log(`[VerifyTEE] TEE result for ${entry.filename}:`, {
          weapon: teeResult.weapon,
          decision: teeResult.decision,
        });

        // Store TEE result in entry metadata for reuse in commit
        const existingMetadata = entry.metadata || {};
        await this.localRepoIndexRepository.updateStagedEntryMetadata(entry.id, {
          ...existingMetadata,
          teeVerification: {
            weapon: teeResult.weapon,
            decision: teeResult.decision,
            description: teeResult.description,
            verifiedAt: Date.now(),
          },
        });

        results.push({
          entryId: entry.id,
          filename: entry.filename,
          mimeType: entry.mimeType,
          size: entry.size,
          verified: true,
          decision: teeResult.decision,
          weapon: teeResult.weapon,
          description: teeResult.description,
        });

        if (teeResult.decision) {
          legalCount++;
        } else {
          illegalCount++;
        }
      } catch (error: any) {
        console.error(`[VerifyTEE] Error verifying file ${entry.filename}:`, error.message);
        // On error, default to safe but mark as unverified
        results.push({
          entryId: entry.id,
          filename: entry.filename,
          mimeType: entry.mimeType,
          size: entry.size,
          verified: false,
          decision: true, // Default to safe on error
          weapon: false,
          description: `Verification error: ${error.message}`,
          error: error.message,
        });
        legalCount++; // Count as legal on error (conservative)
      }
    }

    return {
      files: results,
      totalFiles: stagedEntries.length,
      legalFiles: legalCount,
      illegalFiles: illegalCount,
    };
  }
}

