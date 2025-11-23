import { IVersionCommitRepository } from '../../domain/repositories/IVersionCommitRepository';
import { VersionCommit, CreateVersionCommitInput, VersionCommitWithEntries } from '../../domain/entities/VersionCommit';

/**
 * @deprecated This repository uses the old schema which no longer exists.
 * Use LocalRepoIndexRepository for Move-first architecture.
 */
export class VersionCommitRepository implements IVersionCommitRepository {
  async create(_input: CreateVersionCommitInput): Promise<VersionCommit> {
    throw new Error('VersionCommit model no longer exists in Move-first architecture. Use LocalRepoIndexRepository instead.');
  }

  async findById(_id: string): Promise<VersionCommit | null> {
    throw new Error('VersionCommit model no longer exists in Move-first architecture. Use LocalRepoIndexRepository instead.');
  }

  async findByVersionRoot(_versionRoot: string): Promise<VersionCommit | null> {
    throw new Error('VersionCommit model no longer exists in Move-first architecture. Use LocalRepoIndexRepository instead.');
  }

  async findByDatasetId(_datasetId: string): Promise<VersionCommit[]> {
    throw new Error('VersionCommit model no longer exists in Move-first architecture. Use LocalRepoIndexRepository instead.');
  }

  async findLatestByDatasetId(_datasetId: string): Promise<VersionCommit | null> {
    throw new Error('VersionCommit model no longer exists in Move-first architecture. Use LocalRepoIndexRepository instead.');
  }

  async findPreviousVersion(_versionRoot: string): Promise<VersionCommit | null> {
    throw new Error('VersionCommit model no longer exists in Move-first architecture. Use LocalRepoIndexRepository instead.');
  }

  async findByIdWithEntries(_id: string): Promise<VersionCommitWithEntries | null> {
    throw new Error('VersionCommit model no longer exists in Move-first architecture. Use LocalRepoIndexRepository instead.');
  }

  async findByDatasetIdWithEntries(_datasetId: string): Promise<VersionCommitWithEntries[]> {
    throw new Error('VersionCommit model no longer exists in Move-first architecture. Use LocalRepoIndexRepository instead.');
  }
}
