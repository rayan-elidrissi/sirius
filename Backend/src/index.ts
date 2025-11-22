/**
 * Sirius Data Layer - Main Entry Point
 * Export public API for programmatic use
 */

// Domain
export * from './domain/entities/Dataset';
export * from './domain/entities/ManifestEntry';
export * from './domain/entities/VersionCommit';
export * from './domain/entities/Keystore';

// Services
export { CryptoService } from './infrastructure/crypto/CryptoService';
export { MerkleService } from './infrastructure/crypto/MerkleService';
export { FileKeystoreService } from './infrastructure/keystore/FileKeystoreService';

// Repositories
export { DatasetRepository } from './infrastructure/repositories/DatasetRepository';
export { ManifestEntryRepository } from './infrastructure/repositories/ManifestEntryRepository';
export { VersionCommitRepository } from './infrastructure/repositories/VersionCommitRepository';

// Use Cases
export { CreateDatasetUseCase } from './application/usecases/CreateDatasetUseCase';
export { AddManifestEntriesUseCase } from './application/usecases/AddManifestEntriesUseCase';
export { CommitVersionUseCase } from './application/usecases/CommitVersionUseCase';
export { ListVersionsUseCase } from './application/usecases/ListVersionsUseCase';
export { VerifyChainUseCase } from './application/usecases/VerifyChainUseCase';
export { GenerateKeyUseCase } from './application/usecases/GenerateKeyUseCase';
export { ListDatasetsUseCase } from './application/usecases/ListDatasetsUseCase';

// Container
export { Container } from './application/Container';

// Database
export { prisma, disconnectPrisma } from './infrastructure/database/PrismaClient';

