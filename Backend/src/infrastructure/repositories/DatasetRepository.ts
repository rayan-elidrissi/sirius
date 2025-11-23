import { IDatasetRepository } from '../../domain/repositories/IDatasetRepository';
import { Dataset, CreateDatasetInput } from '../../domain/entities/Dataset';
// Note: Old schema models (Dataset, ManifestEntry, VersionCommit) no longer exist
// These repositories are kept for backward compatibility but will not work with new schema
// TODO: Remove or migrate to new LocalRepoIndex model

/**
 * @deprecated This repository uses the old schema which no longer exists.
 * Use LocalRepoIndexRepository for Move-first architecture.
 */
export class DatasetRepository implements IDatasetRepository {
  async create(_input: CreateDatasetInput): Promise<Dataset> {
    throw new Error('Dataset model no longer exists in Move-first architecture. Use LocalRepoIndexRepository instead.');
  }

  async findById(_id: string): Promise<Dataset | null> {
    throw new Error('Dataset model no longer exists in Move-first architecture. Use LocalRepoIndexRepository instead.');
  }

  async findByName(_name: string): Promise<Dataset | null> {
    throw new Error('Dataset model no longer exists in Move-first architecture. Use LocalRepoIndexRepository instead.');
  }

  async findAll(): Promise<Dataset[]> {
    throw new Error('Dataset model no longer exists in Move-first architecture. Use LocalRepoIndexRepository instead.');
  }

  async findByOwner(_ownerAddress: string): Promise<Dataset[]> {
    throw new Error('Dataset model no longer exists in Move-first architecture. Use LocalRepoIndexRepository instead.');
  }

  async findByOwnerAddress(_ownerAddress: string): Promise<Dataset[]> {
    throw new Error('Dataset model no longer exists in Move-first architecture. Use LocalRepoIndexRepository instead.');
  }

  async delete(_id: string): Promise<void> {
    throw new Error('Dataset model no longer exists in Move-first architecture. Use LocalRepoIndexRepository instead.');
  }
}
