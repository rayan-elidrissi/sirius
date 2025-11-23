import { IDatasetRepository } from '../../domain/repositories/IDatasetRepository';
import { Dataset } from '../../domain/entities/Dataset';

export interface ListDatasetsRequest {
  ownerAddress: string; // Required: Filter by wallet address
}

/**
 * Use case: List all datasets for a specific wallet owner
 */
export class ListDatasetsUseCase {
  constructor(private readonly datasetRepository: IDatasetRepository) {}

  async execute(request: ListDatasetsRequest): Promise<Dataset[]> {
    if (!request.ownerAddress) {
      throw new Error('ownerAddress is required');
    }

    return await this.datasetRepository.findByOwnerAddress(request.ownerAddress);
  }
}

