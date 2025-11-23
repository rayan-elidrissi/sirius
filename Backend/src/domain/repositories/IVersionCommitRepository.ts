import {
  VersionCommit,
  CreateVersionCommitInput,
  VersionCommitWithEntries,
} from '../entities/VersionCommit';

/**
 * Repository interface for VersionCommit persistence
 */
export interface IVersionCommitRepository {
  /**
   * Create a new version commit
   */
  create(input: CreateVersionCommitInput): Promise<VersionCommit>;

  /**
   * Find version commit by ID
   */
  findById(id: string): Promise<VersionCommit | null>;

  /**
   * Find version commit by ID with manifest entries
   */
  findByIdWithEntries(id: string): Promise<VersionCommitWithEntries | null>;

  /**
   * Find all version commits for a dataset (ordered by creation time)
   */
  findByDatasetId(datasetId: string): Promise<VersionCommit[]>;

  /**
   * Find all version commits for a dataset with entries
   */
  findByDatasetIdWithEntries(datasetId: string): Promise<VersionCommitWithEntries[]>;

  /**
   * Find the latest version commit for a dataset
   */
  findLatestByDatasetId(datasetId: string): Promise<VersionCommit | null>;

  /**
   * Find version commit by version root
   */
  findByVersionRoot(versionRoot: string): Promise<VersionCommit | null>;
}

