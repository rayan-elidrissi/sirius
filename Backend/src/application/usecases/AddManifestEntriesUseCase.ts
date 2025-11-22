import { IDatasetRepository } from '../../domain/repositories/IDatasetRepository';
import { IManifestEntryRepository } from '../../domain/repositories/IManifestEntryRepository';
import { ManifestEntry, ManifestMetadata } from '../../domain/entities/ManifestEntry';

export interface ManifestEntryInput {
  blobId: string;
  path?: string;
  metadata: ManifestMetadata;
}

export interface AddManifestEntriesRequest {
  datasetId: string;
  entries: ManifestEntryInput[];
}

/**
 * Use case: Add manifest entries to a dataset
 */
export class AddManifestEntriesUseCase {
  constructor(
    private readonly datasetRepository: IDatasetRepository,
    private readonly manifestEntryRepository: IManifestEntryRepository
  ) {}

  async execute(request: AddManifestEntriesRequest): Promise<ManifestEntry[]> {
    // Verify dataset exists
    const dataset = await this.datasetRepository.findById(request.datasetId);
    if (!dataset) {
      throw new Error(`Dataset not found: ${request.datasetId}`);
    }

    // Validate entries
    if (request.entries.length === 0) {
      throw new Error('At least one manifest entry is required');
    }

    // Create entries
    const inputs = request.entries.map((entry) => ({
      datasetId: request.datasetId,
      blobId: entry.blobId,
      path: entry.path,
      metadata: entry.metadata,
    }));

    return await this.manifestEntryRepository.createMany(inputs);
  }
}

