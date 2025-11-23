/**
 * Dependency Injection Container
 * Central place for wiring up dependencies
 */
// Ensure dotenv is loaded before accessing process.env
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { DatasetRepository } from '../infrastructure/repositories/DatasetRepository';
import { ManifestEntryRepository } from '../infrastructure/repositories/ManifestEntryRepository';
import { VersionCommitRepository } from '../infrastructure/repositories/VersionCommitRepository';
import { LocalRepoIndexRepository } from '../infrastructure/repositories/LocalRepoIndexRepository';
import { CryptoService } from '../infrastructure/crypto/CryptoService';
import { MerkleService } from '../infrastructure/crypto/MerkleService';
import { FileKeystoreService } from '../infrastructure/keystore/FileKeystoreService';
import { SuiChainService } from '../infrastructure/blockchain/SuiChainService';
import { EncryptionService } from '../infrastructure/crypto/EncryptionService';
import { SealService } from '../infrastructure/seal/SealService';
import { WalrusService } from '../infrastructure/storage/WalrusService';

import { CreateDatasetUseCase } from './usecases/CreateDatasetUseCase';
import { AddManifestEntriesUseCase } from './usecases/AddManifestEntriesUseCase';
import { CommitVersionUseCase } from './usecases/CommitVersionUseCase';
import { ListVersionsUseCase } from './usecases/ListVersionsUseCase';
import { VerifyChainUseCase } from './usecases/VerifyChainUseCase';
import { GenerateKeyUseCase } from './usecases/GenerateKeyUseCase';
import { ListDatasetsUseCase } from './usecases/ListDatasetsUseCase';
import { CreateRepoUseCase } from './usecases/CreateRepoUseCase';
import { UploadFilesUseCase } from './usecases/UploadFilesUseCase';
import { CommitUseCase } from './usecases/CommitUseCase';
import { CloneUseCase } from './usecases/CloneUseCase';
import { PullUseCase } from './usecases/PullUseCase';

/**
 * Application Container - Singleton
 */
export class Container {
  private static instance: Container;
  private readonly prisma: PrismaClient;

  // Repositories (exposed for API routes)
  readonly datasetRepository = new DatasetRepository();
  readonly manifestEntryRepository = new ManifestEntryRepository();
  readonly versionCommitRepository = new VersionCommitRepository();
  readonly localRepoIndexRepository: LocalRepoIndexRepository;

  // Services (exposed for API routes)
  readonly cryptoService = new CryptoService();
  readonly merkleService = new MerkleService();
  readonly keystoreService = new FileKeystoreService();
  readonly suiChainService = new SuiChainService();
  readonly encryptionService = new EncryptionService();
  readonly sealService: SealService;
  readonly walrusService: WalrusService;

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

  // New Move-first use cases
  readonly createRepoUseCase: CreateRepoUseCase;
  readonly uploadFilesUseCase: UploadFilesUseCase;
  readonly commitUseCase: CommitUseCase;
  readonly cloneUseCase: CloneUseCase;
  readonly pullUseCase: PullUseCase;

  private constructor() {
    this.prisma = new PrismaClient();
    this.localRepoIndexRepository = new LocalRepoIndexRepository(this.prisma);
    const network = (process.env.WALRUS_NETWORK || 'testnet') as 'testnet' | 'mainnet' | 'devnet';
    this.walrusService = new WalrusService(network);
    
    // Initialize SealService with SuiChainService for on-chain policy checks
    this.sealService = new SealService(this.suiChainService);

    // Initialize Move-first use cases
    this.createRepoUseCase = new CreateRepoUseCase(
      this.walrusService,
      this.sealService,
      this.suiChainService,
      this.encryptionService
    );

    this.uploadFilesUseCase = new UploadFilesUseCase(
      this.walrusService,
      this.sealService,
      this.suiChainService,
      this.encryptionService,
      this.localRepoIndexRepository
    );

    this.commitUseCase = new CommitUseCase(
      this.walrusService,
      this.suiChainService,
      this.localRepoIndexRepository
    );

    this.cloneUseCase = new CloneUseCase(
      this.walrusService,
      this.suiChainService,
      this.sealService,
      this.encryptionService
    );

    this.pullUseCase = new PullUseCase(
      this.suiChainService
    );
  }

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }
}

