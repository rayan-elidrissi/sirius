import { IWalrusService } from '../../domain/services/IWalrusService';
import { ISuiChainService } from '../../domain/services/ISuiChainService';
import { ISealService } from '../../domain/services/ISealService';
import { IEncryptionService } from '../../domain/services/IEncryptionService';

export interface CloneRequest {
  repoObjectId: string;
  callerAddress: string; // Must be reader, writer, or owner
  outputPath?: string; // Where to save files (optional)
}

export interface CloneResult {
  files: Array<{
    filename: string;
    path?: string;
    plaintext: Buffer;
    size: number;
    mimeType?: string;
  }>;
  commitInfo: {
    commitObjectId: string;
    manifestBlobId: string;
    merkleRoot: string;
    author: string;
    timestampMs: number;
  };
}

/**
 * Use case: Clone a repository
 * 
 * Flow:
 * 1. Verify caller is reader/writer/owner
 * 2. Get head commit from Sui
 * 3. Get commit info from Sui
 * 4. Download manifest from Walrus
 * 5. For each entry:
 *    - Download ciphertext from Walrus
 *    - Download sealed FileKey from Walrus
 *    - Unseal FileKey (if authorized)
 *    - Decrypt file
 * 6. Return plaintext files
 */
export class CloneUseCase {
  constructor(
    private readonly walrusService: IWalrusService,
    private readonly suiChainService: ISuiChainService,
    private readonly sealService: ISealService,
    private readonly encryptionService: IEncryptionService
  ) {}

  async execute(request: CloneRequest): Promise<CloneResult> {
    const { repoObjectId, callerAddress } = request;

    // 1. Verify caller is reader, writer, or owner
    const isReader = await this.suiChainService.isReader(repoObjectId, callerAddress);
    if (!isReader) {
      throw new Error(`Address ${callerAddress} is not authorized to read repository ${repoObjectId}`);
    }

    // 2. Get repository info
    const repoInfo = await this.suiChainService.getRepositoryInfo(repoObjectId);
    const policy = {
      repoId: repoObjectId,
      allowedAddresses: [repoInfo.owner, ...repoInfo.writers, ...repoInfo.readers],
    };

    // 3. Get head commit
    const headCommitId = await this.suiChainService.getHeadCommitId(repoObjectId);
    if (!headCommitId) {
      throw new Error('Repository has no commits');
    }

    // 4. Get commit info
    const commitInfo = await this.suiChainService.getCommitInfo(headCommitId);
    console.log(`[Clone] Cloning commit: ${commitInfo.commitObjectId}`);

    // 5. Download manifest from Walrus
    const manifestBuffer = await this.walrusService.downloadBlob(commitInfo.manifestBlobId);
    const manifest = JSON.parse(manifestBuffer.toString('utf-8'));
    console.log(`[Clone] Manifest downloaded: ${manifest.entries.length} entries`);

    // 6. Process each entry
    const files: CloneResult['files'] = [];

    for (const entry of manifest.entries) {
      try {
        // Download ciphertext
        const ciphertext = await this.walrusService.downloadBlob(entry.ciphertextBlobId);
        console.log(`[Clone] Downloaded ciphertext: ${entry.filename} (${ciphertext.length} bytes)`);

        // Download sealed FileKey
        const sealedKeyBlob = await this.walrusService.downloadBlob(entry.sealedKeyBlobId);
        console.log(`[Clone] Downloaded sealed key: ${entry.filename}`);

        // Unseal FileKey (verifies permission)
        const unsealResult = await this.sealService.unsealKey(sealedKeyBlob, policy, callerAddress);
        const fileKey = unsealResult.key;
        console.log(`[Clone] Unsealed FileKey: ${entry.filename}`);

        // Decrypt file
        // Note: We need nonce from somewhere - for now, assume it's stored with ciphertext
        // In production, nonce should be in manifest or derived
        const nonce = Buffer.alloc(24); // Placeholder - should be from manifest
        const decryptResult = this.encryptionService.decryptFile(
          ciphertext,
          nonce,
          fileKey,
          entry.cipherSuite
        );
        console.log(`[Clone] Decrypted: ${entry.filename} (${decryptResult.plaintext.length} bytes)`);

        files.push({
          filename: entry.filename,
          path: entry.path,
          plaintext: decryptResult.plaintext,
          size: entry.size,
          mimeType: entry.mimeType,
        });
      } catch (error: any) {
        console.error(`[Clone] Error processing ${entry.filename}:`, error.message);
        throw new Error(`Failed to decrypt ${entry.filename}: ${error.message}`);
      }
    }

    console.log(`[Clone] ✅ Cloned ${files.length} files`);

    return {
      files,
      commitInfo: {
        commitObjectId: commitInfo.commitObjectId,
        manifestBlobId: commitInfo.manifestBlobId,
        merkleRoot: commitInfo.merkleRoot,
        author: commitInfo.author,
        timestampMs: commitInfo.timestampMs,
      },
    };
  }
}

