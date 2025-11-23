import { ManifestEntry, CreateManifestEntryInput } from '../entities/ManifestEntry';

/**
 * Repository interface for ManifestEntry persistence
 */
export interface IManifestEntryRepository {
  /**
   * Create a new manifest entry
   */
  create(input: CreateManifestEntryInput): Promise<ManifestEntry>;

  /**
   * Create multiple manifest entries
   */
  createMany(inputs: CreateManifestEntryInput[]): Promise<ManifestEntry[]>;

  /**
   * Find manifest entry by ID
   */
  findById(id: string): Promise<ManifestEntry | null>;

  /**
   * Find all manifest entries for a dataset
   */
  findByDatasetId(datasetId: string): Promise<ManifestEntry[]>;

  /**
   * Find manifest entries not yet included in any version commit
   */
  findUncommittedByDatasetId(datasetId: string): Promise<ManifestEntry[]>;

  /**
   * Find manifest entries by their IDs
   */
  findByIds(ids: string[]): Promise<ManifestEntry[]>;
}

