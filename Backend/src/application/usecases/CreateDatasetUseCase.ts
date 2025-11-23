import { IDatasetRepository } from '../../domain/repositories/IDatasetRepository';
import { Dataset } from '../../domain/entities/Dataset';

export interface CreateDatasetRequest {
  name: string;
  description?: string;
  ownerAddress: string; // Required: Sui wallet address
}

/**
 * Use case: Create a new dataset
 */
export class CreateDatasetUseCase {
  constructor(private readonly datasetRepository: IDatasetRepository) {}

  async execute(request: CreateDatasetRequest): Promise<Dataset> {
    if (!request.ownerAddress) {
      throw new Error('ownerAddress is required');
    }

    // Check if dataset with same name already exists for this owner
    const existing = await this.datasetRepository.findByName(request.name);
    if (existing && existing.ownerAddress === request.ownerAddress) {
      throw new Error(`Dataset with name "${request.name}" already exists for this wallet`);
    }

    return await this.datasetRepository.create({
      name: request.name,
      description: request.description,
      ownerAddress: request.ownerAddress,
    });
  }
}

