import { IDatasetRepository } from '../../domain/repositories/IDatasetRepository';
import { Dataset } from '../../domain/entities/Dataset';

/**
 * Use case: List all datasets
 */
export class ListDatasetsUseCase {
  constructor(private readonly datasetRepository: IDatasetRepository) {}

  async execute(): Promise<Dataset[]> {
    return await this.datasetRepository.findAll();
  }
}

