import { Dataset, CreateDatasetInput } from '../entities/Dataset';

/**
 * Repository interface for Dataset persistence
 * Follows Repository pattern for clean separation
 */
export interface IDatasetRepository {
  /**
   * Create a new dataset
   */
  create(input: CreateDatasetInput): Promise<Dataset>;

  /**
   * Find a dataset by ID
   */
  findById(id: string): Promise<Dataset | null>;

  /**
   * Find a dataset by name
   */
  findByName(name: string): Promise<Dataset | null>;

  /**
   * List all datasets
   */
  findAll(): Promise<Dataset[]>;

  /**
   * Find all datasets owned by a specific address
   */
  findByOwnerAddress(ownerAddress: string): Promise<Dataset[]>;

  /**
   * Delete a dataset
   */
  delete(id: string): Promise<void>;
}

