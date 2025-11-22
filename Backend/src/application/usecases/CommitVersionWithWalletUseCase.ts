import { IDatasetRepository } from '../../domain/repositories/IDatasetRepository';
import { IManifestEntryRepository } from '../../domain/repositories/IManifestEntryRepository';
import { IVersionCommitRepository } from '../../domain/repositories/IVersionCommitRepository';
import { IMerkleService } from '../../domain/services/IMerkleService';
import { SuiWalletService } from '../../infrastructure/wallet/SuiWalletService';
import { BlockchainAnchorService } from '../../infrastructure/blockchain/BlockchainAnchorService';
import { IPFSBackupService, VersionBackupData } from '../../infrastructure/ipfs/IPFSBackupService';
import { VersionCommit } from '../../domain/entities/VersionCommit';

export interface CommitVersionWithWalletRequest {
  datasetId: string;
  signature: string; // From Sui wallet
  publicKey: string; // From Sui wallet (base64)
  author: string; // Sui address
  note?: string;
  includeAllEntries?: boolean;
  enableBlockchainAnchor?: boolean;
  enableIPFSBackup?: boolean;
}

/**
 * Use case: Commit a new version using external Sui wallet
 * This is the enhanced version that uses Sui wallets instead of local keystore
 */
export class CommitVersionWithWalletUseCase {
  constructor(
    private readonly datasetRepository: IDatasetRepository,
    private readonly manifestEntryRepository: IManifestEntryRepository,
    private readonly versionCommitRepository: IVersionCommitRepository,
    private readonly merkleService: IMerkleService,
    private readonly walletService: SuiWalletService,
    private readonly blockchainService: BlockchainAnchorService,
    private readonly ipfsService: IPFSBackupService
  ) {}

  async execute(request: CommitVersionWithWalletRequest): Promise<VersionCommit> {
    // 1. Verify dataset exists
    const dataset = await this.datasetRepository.findById(request.datasetId);
    if (!dataset) {
      throw new Error(`Dataset not found: ${request.datasetId}`);
    }

    // 2. Get manifest entries
    const entries = request.includeAllEntries
      ? await this.manifestEntryRepository.findByDatasetId(request.datasetId)
      : await this.manifestEntryRepository.findUncommittedByDatasetId(request.datasetId);

    if (entries.length === 0) {
      throw new Error('No manifest entries to commit');
    }

    // 3. Compute Merkle root
    const versionRoot = this.merkleService.computeManifestRoot(entries);

    // 4. Get parent root
    const latestVersion = await this.versionCommitRepository.findLatestByDatasetId(
      request.datasetId
    );
    const parentRoot = latestVersion ? latestVersion.versionRoot : null;

    // 5. Verify signature from Sui wallet
    const commitMessage = this.walletService.createCommitMessage({
      datasetId: request.datasetId,
      versionRoot,
      parentRoot,
      timestamp: new Date().toISOString(),
    });

    const isValidSignature = this.walletService.verifySignature({
      message: commitMessage,
      signature: request.signature,
      publicKey: request.publicKey,
    });

    if (!isValidSignature) {
      throw new Error('Invalid signature from wallet');
    }

    // 6. Optional: Anchor on blockchain
    let suiTxHash: string | null = null;
    let blockHeight: number | null = null;
    let blockTimestamp: number | null = null;

    if (request.enableBlockchainAnchor && this.blockchainService.isEnabled()) {
      try {
        const anchorResult = await this.blockchainService.anchor({
          datasetId: request.datasetId,
          versionRoot,
          signature: request.signature,
          publicKey: request.publicKey,
        });

        suiTxHash = anchorResult.txHash;
        blockHeight = anchorResult.blockHeight;
        blockTimestamp = anchorResult.timestamp;

        console.log(`Version anchored on Sui: ${suiTxHash}`);
      } catch (error) {
        console.error('Blockchain anchoring failed:', error);
        // Continue without anchoring (non-critical)
      }
    }

    // 7. Create version commit
    const commit = await this.versionCommitRepository.create({
      datasetId: request.datasetId,
      versionRoot,
      parentRoot,
      signature: request.signature,
      publicKey: request.publicKey,
      author: request.author,
      note: request.note,
      manifestEntryIds: entries.map((e) => e.id),
      suiTxHash: suiTxHash || undefined,
      blockHeight: blockHeight || undefined,
      blockTimestamp: blockTimestamp || undefined,
      isMultiSig: false,
      requiredSigs: 1,
    });

    // 8. Optional: Backup to IPFS
    if (request.enableIPFSBackup && this.ipfsService.isEnabled()) {
      try {
        const backupData: VersionBackupData = {
          versionId: commit.id,
          datasetId: commit.datasetId,
          versionRoot: commit.versionRoot,
          parentRoot: commit.parentRoot,
          signature: commit.signature,
          publicKey: commit.publicKey,
          manifestEntries: entries.map((e) => ({
            blobId: e.blobId,
            path: e.path,
            metadata: e.metadata,
          })),
          createdAt: commit.createdAt.toISOString(),
        };

        const ipfsResult = await this.ipfsService.upload(backupData);

        // Update commit with IPFS info
        // Note: In production, this would be a separate update operation
        console.log(`Version backed up to IPFS: ${ipfsResult.cid}`);
      } catch (error) {
        console.error('IPFS backup failed:', error);
        // Continue without backup (non-critical)
      }
    }

    return commit;
  }

  /**
   * Prepare commit data for wallet to sign
   * Frontend calls this to get the message to sign
   */
  async prepareCommit(request: {
    datasetId: string;
    includeAllEntries?: boolean;
  }): Promise<{
    message: string;
    versionRoot: string;
    parentRoot: string | null;
    entryCount: number;
  }> {
    // Verify dataset exists
    const dataset = await this.datasetRepository.findById(request.datasetId);
    if (!dataset) {
      throw new Error(`Dataset not found: ${request.datasetId}`);
    }

    // Get entries
    const entries = request.includeAllEntries
      ? await this.manifestEntryRepository.findByDatasetId(request.datasetId)
      : await this.manifestEntryRepository.findUncommittedByDatasetId(request.datasetId);

    if (entries.length === 0) {
      throw new Error('No manifest entries to commit');
    }

    // Compute Merkle root
    const versionRoot = this.merkleService.computeManifestRoot(entries);

    // Get parent root
    const latestVersion = await this.versionCommitRepository.findLatestByDatasetId(
      request.datasetId
    );
    const parentRoot = latestVersion ? latestVersion.versionRoot : null;

    // Create message for signing
    const message = this.walletService.createCommitMessage({
      datasetId: request.datasetId,
      versionRoot,
      parentRoot,
      timestamp: new Date().toISOString(),
    });

    return {
      message,
      versionRoot,
      parentRoot,
      entryCount: entries.length,
    };
  }
}

