import { IDatasetRepository } from '../../domain/repositories/IDatasetRepository';
import { IManifestEntryRepository } from '../../domain/repositories/IManifestEntryRepository';
import { IVersionCommitRepository } from '../../domain/repositories/IVersionCommitRepository';
import { ICryptoService } from '../../domain/services/ICryptoService';
import { IMerkleService } from '../../domain/services/IMerkleService';
import { IKeystoreService } from '../../domain/services/IKeystoreService';
import { VersionCommit } from '../../domain/entities/VersionCommit';

export interface CommitVersionRequest {
  datasetId: string;
  author?: string;
  includeAllEntries?: boolean; // If true, include all entries; if false, only uncommitted
}

/**
 * Use case: Commit a new version of a dataset
 */
export class CommitVersionUseCase {
  constructor(
    private readonly datasetRepository: IDatasetRepository,
    private readonly manifestEntryRepository: IManifestEntryRepository,
    private readonly versionCommitRepository: IVersionCommitRepository,
    private readonly cryptoService: ICryptoService,
    private readonly merkleService: IMerkleService,
    private readonly keystoreService: IKeystoreService
  ) {}

  async execute(request: CommitVersionRequest): Promise<VersionCommit> {
    // Verify dataset exists
    const dataset = await this.datasetRepository.findById(request.datasetId);
    if (!dataset) {
      throw new Error(`Dataset not found: ${request.datasetId}`);
    }

    // Load keystore
    const keystore = await this.keystoreService.load();
    if (!keystore) {
      throw new Error('Keystore not found. Please run generate-key first.');
    }

    // Get manifest entries
    const entries = request.includeAllEntries
      ? await this.manifestEntryRepository.findByDatasetId(request.datasetId)
      : await this.manifestEntryRepository.findUncommittedByDatasetId(request.datasetId);

    if (entries.length === 0) {
      throw new Error('No manifest entries to commit');
    }

    // Compute Merkle root
    const versionRoot = this.merkleService.computeManifestRoot(entries);

    // Get parent root (latest version)
    const latestVersion = await this.versionCommitRepository.findLatestByDatasetId(
      request.datasetId
    );
    const parentRoot = latestVersion ? latestVersion.versionRoot : null;

    // Create data to sign
    const signatureData = this.createSignatureData({
      datasetId: request.datasetId,
      versionRoot,
      parentRoot,
      timestamp: new Date().toISOString(),
    });

    // Sign the commit
    const signature = this.cryptoService.sign(signatureData, keystore.privateKey);

    // Create version commit
    const commit = await this.versionCommitRepository.create({
      datasetId: request.datasetId,
      versionRoot,
      parentRoot,
      signature,
      publicKey: keystore.publicKey,
      author: request.author,
      manifestEntryIds: entries.map((e) => e.id),
    });

    return commit;
  }

  private createSignatureData(data: {
    datasetId: string;
    versionRoot: string;
    parentRoot: string | null;
    timestamp: string;
  }): string {
    return JSON.stringify({
      datasetId: data.datasetId,
      versionRoot: data.versionRoot,
      parentRoot: data.parentRoot,
      timestamp: data.timestamp,
    });
  }
}

