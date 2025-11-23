import { IWalrusService } from '../../domain/services/IWalrusService';
import { ISuiChainService } from '../../domain/services/ISuiChainService';
import { ILocalRepoIndexRepository } from '../../domain/repositories/ILocalRepoIndexRepository';
import { ISealService } from '../../domain/services/ISealService';
import { IEncryptionService } from '../../domain/services/IEncryptionService';
import { ITeeService } from '../../domain/services/ITeeService';
import { createHash } from 'node:crypto';

export interface PrepareCommitRequest {
  repoObjectId: string;
  authorAddress: string;
  note?: string;
}

export interface PrepareCommitResult {
  transactionBytes: string; // Base64 encoded transaction bytes
  manifestBlobId: string;
  merkleRoot: string;
  parentCommitId: string | null;
}

export interface CommitResult {
  commitObjectId: string;
  manifestBlobId: string;
  merkleRoot: string;
  transactionHash: string;
  suiscanUrl: string; // Link to view transaction on Suiscan
  commitSuiscanUrl: string; // Link to view Commit object on Suiscan
}

/**
 * Use case: Commit staged files
 * 
 * Flow:
 * 1. Get staged entries from local cache
 * 2. Build manifest JSON
 * 3. Upload manifest to Walrus
 * 4. Calculate Merkle root
 * 5. Get current head from Sui
 * 6. Verify signature (author signed the root)
 * 7. Call Move push_commit() on Sui
 * 8. Update local cache
 */
export class CommitUseCase {
  constructor(
    private readonly walrusService: IWalrusService,
    private readonly suiChainService: ISuiChainService,
    private readonly localRepoIndexRepository: ILocalRepoIndexRepository,
    private readonly sealService: ISealService,
    private readonly encryptionService: IEncryptionService,
    private readonly teeService: ITeeService
  ) {}

  async execute(request: PrepareCommitRequest): Promise<PrepareCommitResult> {
    const { repoObjectId, authorAddress, note } = request;

    // 1. Get staged entries
    let stagedEntries = await this.localRepoIndexRepository.getStagedEntries(repoObjectId);
    if (stagedEntries.length === 0) {
      throw new Error('No staged entries to commit');
    }

    // 2. TEE Verification: Decrypt and verify each file
    console.log(`[Commit] Starting TEE verification for ${stagedEntries.length} files...`);
    const verifiedEntries: typeof stagedEntries = [];
    const illegalFiles: string[] = [];

    // Get repository info for policy
    const repoInfo = await this.suiChainService.getRepositoryInfo(repoObjectId);
    const policy = {
      repoId: repoObjectId,
      allowedAddresses: [repoInfo.owner, ...repoInfo.writers, ...repoInfo.readers],
    };

    for (const entry of stagedEntries) {
      try {
        // Only verify image files
        if (!entry.mimeType || !entry.mimeType.startsWith('image/')) {
          console.log(`[Commit] Skipping TEE verification for non-image: ${entry.filename}`);
          verifiedEntries.push(entry);
          continue;
        }

        // Check if TEE verification was already done (stored in metadata)
        const existingTeeResult = entry.metadata?.teeVerification;
        let teeResult: { weapon: boolean; decision: boolean; description: string };
        
        if (existingTeeResult && existingTeeResult.verifiedAt) {
          // Reuse existing TEE result (from verify-tee endpoint)
          console.log(`[Commit] ✅ Reusing existing TEE result for ${entry.filename} (verified at ${new Date(existingTeeResult.verifiedAt).toISOString()})`);
          teeResult = {
            weapon: existingTeeResult.weapon,
            decision: existingTeeResult.decision,
            description: existingTeeResult.description,
          };
        } else {
          // TEE verification not done yet - do it now
          console.log(`[Commit] Verifying file with TEE: ${entry.filename}`);

          // Download ciphertext
          const ciphertext = await this.walrusService.downloadBlob(entry.ciphertextBlobId);
          console.log(`[Commit] Downloaded ciphertext: ${entry.filename} (${ciphertext.length} bytes)`);

          // Download sealed FileKey
          const sealedKeyBlob = await this.walrusService.downloadBlob(entry.sealedKeyBlobId);
          console.log(`[Commit] Downloaded sealed key: ${entry.filename}`);

          // Unseal FileKey
          const unsealResult = await this.sealService.unsealKey(sealedKeyBlob, policy, authorAddress);
          const fileKey = unsealResult.key;
          console.log(`[Commit] Unsealed FileKey: ${entry.filename}`);

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
          console.log(`[Commit] Decrypted: ${entry.filename} (${decryptResult.plaintext.length} bytes)`);

          // Verify with TEE
          teeResult = await this.teeService.verifyFile(decryptResult.plaintext, entry.mimeType);
          console.log(`[Commit] TEE result for ${entry.filename}:`, {
            weapon: teeResult.weapon,
            decision: teeResult.decision,
            description: teeResult.description.substring(0, 100),
          });
        }

        // If illegal (decision: false), burn blobs and remove from staged
        if (!teeResult.decision) {
          console.log(`[Commit] ⚠️ File ${entry.filename} is ILLEGAL. Burning blobs...`);
          
          // Burn ciphertext blob
          try {
            await this.walrusService.burnBlob(entry.ciphertextBlobId);
            console.log(`[Commit] ✅ Burned ciphertext blob: ${entry.ciphertextBlobId}`);
          } catch (error: any) {
            console.error(`[Commit] Failed to burn ciphertext blob:`, error.message);
          }

          // Burn sealed key blob
          try {
            await this.walrusService.burnBlob(entry.sealedKeyBlobId);
            console.log(`[Commit] ✅ Burned sealed key blob: ${entry.sealedKeyBlobId}`);
          } catch (error: any) {
            console.error(`[Commit] Failed to burn sealed key blob:`, error.message);
          }

          // Remove from staged entries
          await this.localRepoIndexRepository.removeStagedEntry(entry.id);
          console.log(`[Commit] ✅ Removed illegal file from staged: ${entry.filename}`);
          
          illegalFiles.push(entry.filename);
          continue; // Skip adding to verifiedEntries
        }

        // File is legal - add to verified entries
        console.log(`[Commit] ✅ File ${entry.filename} is LEGAL (certified by Nautilus TEE)`);
        verifiedEntries.push(entry);
      } catch (error: any) {
        console.error(`[Commit] Error verifying file ${entry.filename}:`, error.message);
        // On error, default to safe (but log the error)
        console.warn(`[Commit] Defaulting to safe for ${entry.filename} due to verification error`);
        verifiedEntries.push(entry);
      }
    }

    // Update staged entries to only include verified (legal) files
    stagedEntries = verifiedEntries;

    if (illegalFiles.length > 0) {
      console.log(`[Commit] ⚠️ Removed ${illegalFiles.length} illegal file(s): ${illegalFiles.join(', ')}`);
    }

    if (stagedEntries.length === 0) {
      throw new Error('No legal files to commit after TEE verification');
    }

    console.log(`[Commit] ✅ TEE verification complete. ${stagedEntries.length} legal file(s) ready to commit.`);

    // 3. Build manifest JSON
    const manifest = {
      version: '1.0',
      entries: stagedEntries.map(entry => ({
        filename: entry.filename,
        path: entry.path,
        ciphertextBlobId: entry.ciphertextBlobId,
        sealedKeyBlobId: entry.sealedKeyBlobId,
        cipherHash: entry.cipherHash,
        cipherSuite: entry.cipherSuite,
        size: entry.size,
        mimeType: entry.mimeType,
      })),
      note,
      timestamp: Date.now(),
    };

    const manifestJson = JSON.stringify(manifest, null, 2);
    console.log(`[Commit] Manifest built: ${stagedEntries.length} entries`);

    // 4. Upload manifest to Walrus
    const manifestBuffer = Buffer.from(manifestJson, 'utf-8');
    const manifestUpload = await this.walrusService.uploadBuffer(manifestBuffer);
    const manifestBlobId = manifestUpload.blobId;
    console.log(`[Commit] Manifest uploaded: ${manifestBlobId}`);

    // 5. Calculate Merkle root
    // For MVP: simple hash of manifest JSON (can be enhanced later)
    const manifestHash = createHash('sha256').update(manifestJson).digest('hex');
    const merkleRoot = manifestHash;
    console.log(`[Commit] Merkle root: ${merkleRoot}`);

    // 6. Get current head from Sui
    const currentHead = await this.suiChainService.getHeadCommitId(repoObjectId);
    const parentCommitId = currentHead || null;
    console.log(`[Commit] Parent commit: ${parentCommitId || 'none (first commit)'}`);

    // 7. Prepare transaction for frontend signing
    console.log(`[Commit] Preparing push_commit transaction...`);
    const preparedTx = await this.suiChainService.preparePushCommit({
      repoObjectId,
      parentCommitId,
      manifestBlobId,
      merkleRoot,
      signerAddress: authorAddress,
    });

    // Return transaction bytes for frontend to sign
    return {
      transactionBytes: preparedTx.transactionBytes,
      manifestBlobId,
      merkleRoot,
      parentCommitId,
    };
  }

  /**
   * Execute signed push_commit transaction
   * Called after frontend signs the transaction
   */
  async executeSignedTransaction(
    repoObjectId: string,
    parentCommitId: string | null,
    manifestBlobId: string,
    merkleRoot: string,
    transactionBytes: string,
    signature: string,
    publicKey: string,
    signerAddress: string
  ): Promise<CommitResult> {
    console.log(`[Commit] Executing signed push_commit transaction...`);

    // Execute the signed transaction
    const pushResult = await this.suiChainService.executePushCommit({
      repoObjectId,
      parentCommitId,
      manifestBlobId,
      merkleRoot,
      transactionBytes,
      signature,
      publicKey,
      signerAddress,
    });

    console.log(`[Commit] ✅ Commit created on Sui: ${pushResult.commitObjectId}`);

    // Generate Suiscan URLs
    const network = process.env.SUI_NETWORK || 'testnet';
    const networkPath = network === 'testnet' ? 'testnet' : network === 'mainnet' ? '' : 'devnet';
    const baseUrl = networkPath ? `https://suiscan.xyz/${networkPath}` : 'https://suiscan.xyz';
    const suiscanUrl = `${baseUrl}/tx/${pushResult.transactionHash}`;
    const commitSuiscanUrl = `${baseUrl}/object/${pushResult.commitObjectId}`;

    // Update local cache
    await this.localRepoIndexRepository.cacheCommit({
      repoObjectId,
      commitObjectId: pushResult.commitObjectId,
      parentCommitId,
      manifestBlobId,
      merkleRoot,
      author: signerAddress,
      timestampMs: Date.now(),
    });

    // Clear staged entries (they're now committed)
    await this.localRepoIndexRepository.clearStagedEntries(repoObjectId);

    return {
      commitObjectId: pushResult.commitObjectId,
      manifestBlobId,
      merkleRoot,
      transactionHash: pushResult.transactionHash,
      suiscanUrl,
      commitSuiscanUrl,
    };
  }
}

