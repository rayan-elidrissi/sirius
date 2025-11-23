import { IWalrusService } from '../../domain/services/IWalrusService';
import { ISuiChainService } from '../../domain/services/ISuiChainService';
import { ILocalRepoIndexRepository } from '../../domain/repositories/ILocalRepoIndexRepository';
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
    private readonly localRepoIndexRepository: ILocalRepoIndexRepository
  ) {}

  async execute(request: PrepareCommitRequest): Promise<PrepareCommitResult> {
    const { repoObjectId, authorAddress, note } = request;

    // 1. Get staged entries
    const stagedEntries = await this.localRepoIndexRepository.getStagedEntries(repoObjectId);
    if (stagedEntries.length === 0) {
      throw new Error('No staged entries to commit');
    }

    // 2. Build manifest JSON
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

    // 3. Upload manifest to Walrus
    const manifestBuffer = Buffer.from(manifestJson, 'utf-8');
    const manifestUpload = await this.walrusService.uploadBuffer(manifestBuffer);
    const manifestBlobId = manifestUpload.blobId;
    console.log(`[Commit] Manifest uploaded: ${manifestBlobId}`);

    // 4. Calculate Merkle root
    // For MVP: simple hash of manifest JSON (can be enhanced later)
    const manifestHash = createHash('sha256').update(manifestJson).digest('hex');
    const merkleRoot = manifestHash;
    console.log(`[Commit] Merkle root: ${merkleRoot}`);

    // 5. Get current head from Sui
    const currentHead = await this.suiChainService.getHeadCommitId(repoObjectId);
    const parentCommitId = currentHead || null;
    console.log(`[Commit] Parent commit: ${parentCommitId || 'none (first commit)'}`);

    // 6. Prepare transaction for frontend signing
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

