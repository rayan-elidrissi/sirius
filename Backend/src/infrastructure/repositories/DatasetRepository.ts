import { IDatasetRepository } from '../../domain/repositories/IDatasetRepository';
import { Dataset, CreateDatasetInput } from '../../domain/entities/Dataset';
import { prisma } from '../database/PrismaClient';

/**
 * Prisma implementation of IDatasetRepository
 */
export class DatasetRepository implements IDatasetRepository {
  async create(input: CreateDatasetInput): Promise<Dataset> {
    const dataset = await prisma.dataset.create({
      data: {
        name: input.name,
        description: input.description || null,
      },
    });

    return this.mapToEntity(dataset);
  }

  async findById(id: string): Promise<Dataset | null> {
    const dataset = await prisma.dataset.findUnique({
      where: { id },
    });

    return dataset ? this.mapToEntity(dataset) : null;
  }

  async findByName(name: string): Promise<Dataset | null> {
    const dataset = await prisma.dataset.findFirst({
      where: { name },
    });

    return dataset ? this.mapToEntity(dataset) : null;
  }

  async findAll(): Promise<Dataset[]> {
    const datasets = await prisma.dataset.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return datasets.map((d: {
      id: string;
      name: string;
      description: string | null;
      createdAt: Date;
    }) => this.mapToEntity(d));
  }

  async delete(id: string): Promise<void> {
    await prisma.dataset.delete({
      where: { id },
    });
  }

  private mapToEntity(data: {
    id: string;
    name: string;
    description: string | null;
    createdAt: Date;
  }): Dataset {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      createdAt: data.createdAt,
    };
  }
}

