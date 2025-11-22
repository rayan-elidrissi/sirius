import { IDatasetRepository } from '../../domain/repositories/IDatasetRepository';
import { Dataset } from '../../domain/entities/Dataset';

export interface CreateDatasetRequest {
  name: string;
  description?: string;
}

/**
 * Use case: Create a new dataset
 */
export class CreateDatasetUseCase {
  constructor(private readonly datasetRepository: IDatasetRepository) {}

  async execute(request: CreateDatasetRequest): Promise<Dataset> {
    // Check if dataset with same name already exists
    const existing = await this.datasetRepository.findByName(request.name);
    if (existing) {
      throw new Error(`Dataset with name "${request.name}" already exists`);
    }

    return await this.datasetRepository.create({
      name: request.name,
      description: request.description,
    });
  }
}

