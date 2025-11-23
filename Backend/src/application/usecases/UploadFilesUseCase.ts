import { IWalrusService } from '../../domain/services/IWalrusService';
import { ISealService } from '../../domain/services/ISealService';
import { ISuiChainService } from '../../domain/services/ISuiChainService';
import { IEncryptionService } from '../../domain/services/IEncryptionService';
import { ILocalRepoIndexRepository } from '../../domain/repositories/ILocalRepoIndexRepository';

export interface UploadFileRequest {
  repoObjectId: string;
  file: {
    buffer: Buffer;
    filename: string;
    mimeType?: string;
    size: number;
  };
  callerAddress: string; // Must be writer or owner
}

export interface UploadFileResult {
  manifestEntryId: string;
  ciphertextBlobId: string;
  sealedKeyBlobId: string;
  cipherHash: string;
  cipherSuite: string;
}

/**
 * Use case: Upload and encrypt a file
 * 
 * Flow:
 * 1. Verify caller is writer/owner
 * 2. Generate FileKey
 * 3. Encrypt file with FileKey
 * 4. Seal FileKey with RMK policy
 * 5. Upload ciphertext to Walrus
 * 6. Upload sealed FileKey to Walrus
 * 7. Create LocalManifestEntry (staging, not committed)
 * 
 * Note: This does NOT commit on-chain. Files are staged locally.
 */
export class UploadFilesUseCase {
  constructor(
    private readonly walrusService: IWalrusService,
    private readonly sealService: ISealService,
    private readonly suiChainService: ISuiChainService,
    private readonly encryptionService: IEncryptionService,
    private readonly localRepoIndexRepository: ILocalRepoIndexRepository
  ) {}

  async execute(request: UploadFileRequest): Promise<UploadFileResult> {
    const { repoObjectId, file, callerAddress } = request;

    // 1. Verify caller is writer or owner
    const repoInfo = await this.suiChainService.getRepositoryInfo(repoObjectId);
    const isOwner = repoInfo.owner === callerAddress;
    const isWriter = await this.suiChainService.isWriter(repoObjectId, callerAddress);
    
    if (!isOwner && !isWriter) {
      throw new Error(`Address ${callerAddress} is not a writer or owner for repository ${repoObjectId}`);
    }

    // 2. Get repository info (for policy) - already fetched above
    const policy = {
      repoId: repoObjectId,
      allowedAddresses: [repoInfo.owner, ...repoInfo.writers, ...repoInfo.readers],
    };

    // 3. Generate FileKey
    const fileKey = this.encryptionService.generateFileKey();
    console.log(`[UploadFile] Generated FileKey for: ${file.filename}`);

    // 4. Encrypt file
    const encryptionResult = this.encryptionService.encryptFile(file.buffer, fileKey);
    console.log(`[UploadFile] Encrypted file: ${file.filename} (${encryptionResult.ciphertext.length} bytes)`);

    // 5. Seal FileKey
    const sealedKey = await this.sealService.sealKey(fileKey, policy);
    console.log(`[UploadFile] Sealed FileKey`);

    // 6. Upload ciphertext to Walrus
    const ciphertextUpload = await this.walrusService.uploadBuffer(encryptionResult.ciphertext);
    console.log(`[UploadFile] Ciphertext uploaded: ${ciphertextUpload.blobId}`);

    // 7. Upload sealed FileKey to Walrus
    const sealedKeyUpload = await this.walrusService.uploadBuffer(sealedKey.sealedBlob);
    console.log(`[UploadFile] Sealed key uploaded: ${sealedKeyUpload.blobId}`);

    // 8. Calculate hash of ciphertext (for verification)
    const crypto = await import('crypto');
    const cipherHash = crypto.createHash('sha256').update(encryptionResult.ciphertext).digest('hex');

    // 9. Create LocalManifestEntry (staging)
    // Note: Nonce must be stored (hex encoded) - update schema if needed
    const manifestEntry = await this.localRepoIndexRepository.createStagedEntry({
      repoObjectId,
      filename: file.filename,
      cipherSuite: encryptionResult.cipherSuite,
      ciphertextBlobId: ciphertextUpload.blobId,
      sealedKeyBlobId: sealedKeyUpload.blobId,
      cipherHash,
      nonce: encryptionResult.nonce.toString('hex'), // Store nonce
      size: file.size,
      mimeType: file.mimeType,
    });

    console.log(`[UploadFile] ✅ File staged: ${manifestEntry.id}`);

    return {
      manifestEntryId: manifestEntry.id,
      ciphertextBlobId: ciphertextUpload.blobId,
      sealedKeyBlobId: sealedKeyUpload.blobId,
      cipherHash,
      cipherSuite: encryptionResult.cipherSuite,
    };
  }
}

