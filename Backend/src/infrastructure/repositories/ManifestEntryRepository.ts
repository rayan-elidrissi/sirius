import { IManifestEntryRepository } from '../../domain/repositories/IManifestEntryRepository';
import { ManifestEntry, CreateManifestEntryInput } from '../../domain/entities/ManifestEntry';

/**
 * @deprecated This repository uses the old schema which no longer exists.
 * Use LocalRepoIndexRepository for Move-first architecture.
 */
export class ManifestEntryRepository implements IManifestEntryRepository {
  async create(_input: CreateManifestEntryInput): Promise<ManifestEntry> {
    throw new Error('ManifestEntry model no longer exists in Move-first architecture. Use LocalRepoIndexRepository instead.');
  }

  async createMany(_inputs: CreateManifestEntryInput[]): Promise<ManifestEntry[]> {
    throw new Error('ManifestEntry model no longer exists in Move-first architecture. Use LocalRepoIndexRepository instead.');
  }

  async findAll(): Promise<ManifestEntry[]> {
    throw new Error('ManifestEntry model no longer exists in Move-first architecture. Use LocalRepoIndexRepository instead.');
  }

  async findById(_id: string): Promise<ManifestEntry | null> {
    throw new Error('ManifestEntry model no longer exists in Move-first architecture. Use LocalRepoIndexRepository instead.');
  }

  async findByDatasetId(_datasetId: string): Promise<ManifestEntry[]> {
    throw new Error('ManifestEntry model no longer exists in Move-first architecture. Use LocalRepoIndexRepository instead.');
  }

  async findByBlobId(_blobId: string): Promise<ManifestEntry[]> {
    throw new Error('ManifestEntry model no longer exists in Move-first architecture. Use LocalRepoIndexRepository instead.');
  }

  async findUncommittedByDatasetId(_datasetId: string): Promise<ManifestEntry[]> {
    throw new Error('ManifestEntry model no longer exists in Move-first architecture. Use LocalRepoIndexRepository instead.');
  }

  async findByIds(_ids: string[]): Promise<ManifestEntry[]> {
    throw new Error('ManifestEntry model no longer exists in Move-first architecture. Use LocalRepoIndexRepository instead.');
  }

  async deleteByDatasetId(_datasetId: string): Promise<void> {
    throw new Error('ManifestEntry model no longer exists in Move-first architecture. Use LocalRepoIndexRepository instead.');
  }
}
