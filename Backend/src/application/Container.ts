/**
 * Dependency Injection Container
 * Central place for wiring up dependencies
 */
import { DatasetRepository } from '../infrastructure/repositories/DatasetRepository';
import { ManifestEntryRepository } from '../infrastructure/repositories/ManifestEntryRepository';
import { VersionCommitRepository } from '../infrastructure/repositories/VersionCommitRepository';
import { CryptoService } from '../infrastructure/crypto/CryptoService';
import { MerkleService } from '../infrastructure/crypto/MerkleService';
import { FileKeystoreService } from '../infrastructure/keystore/FileKeystoreService';

import { CreateDatasetUseCase } from './usecases/CreateDatasetUseCase';
import { AddManifestEntriesUseCase } from './usecases/AddManifestEntriesUseCase';
import { CommitVersionUseCase } from './usecases/CommitVersionUseCase';
import { ListVersionsUseCase } from './usecases/ListVersionsUseCase';
import { VerifyChainUseCase } from './usecases/VerifyChainUseCase';
import { GenerateKeyUseCase } from './usecases/GenerateKeyUseCase';
import { ListDatasetsUseCase } from './usecases/ListDatasetsUseCase';

/**
 * Application Container - Singleton
 */
export class Container {
  private static instance: Container;

  // Repositories (exposed for API routes)
  readonly datasetRepository = new DatasetRepository();
  readonly manifestEntryRepository = new ManifestEntryRepository();
  readonly versionCommitRepository = new VersionCommitRepository();

  // Services (exposed for API routes)
  readonly cryptoService = new CryptoService();
  readonly merkleService = new MerkleService();
  readonly keystoreService = new FileKeystoreService();

  // Use Cases
  readonly createDatasetUseCase = new CreateDatasetUseCase(this.datasetRepository);

  readonly addManifestEntriesUseCase = new AddManifestEntriesUseCase(
    this.datasetRepository,
    this.manifestEntryRepository
  );

  readonly commitVersionUseCase = new CommitVersionUseCase(
    this.datasetRepository,
    this.manifestEntryRepository,
    this.versionCommitRepository,
    this.cryptoService,
    this.merkleService,
    this.keystoreService
  );

  readonly listVersionsUseCase = new ListVersionsUseCase(
    this.datasetRepository,
    this.versionCommitRepository
  );

  readonly verifyChainUseCase = new VerifyChainUseCase(
    this.datasetRepository,
    this.manifestEntryRepository,
    this.versionCommitRepository,
    this.cryptoService,
    this.merkleService
  );

  readonly generateKeyUseCase = new GenerateKeyUseCase(this.cryptoService, this.keystoreService);

  readonly listDatasetsUseCase = new ListDatasetsUseCase(this.datasetRepository);

  private constructor() {}

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }
}

