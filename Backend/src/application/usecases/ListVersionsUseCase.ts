import { IDatasetRepository } from '../../domain/repositories/IDatasetRepository';
import { IVersionCommitRepository } from '../../domain/repositories/IVersionCommitRepository';
import { VersionCommit } from '../../domain/entities/VersionCommit';

export interface ListVersionsRequest {
  datasetId: string;
}

/**
 * Use case: List all version commits for a dataset
 */
export class ListVersionsUseCase {
  constructor(
    private readonly datasetRepository: IDatasetRepository,
    private readonly versionCommitRepository: IVersionCommitRepository
  ) {}

  async execute(request: ListVersionsRequest): Promise<VersionCommit[]> {
    // Verify dataset exists
    const dataset = await this.datasetRepository.findById(request.datasetId);
    if (!dataset) {
      throw new Error(`Dataset not found: ${request.datasetId}`);
    }

    return await this.versionCommitRepository.findByDatasetId(request.datasetId);
  }
}

