import { IManifestEntryRepository } from '../../domain/repositories/IManifestEntryRepository';
import { ManifestEntry, CreateManifestEntryInput } from '../../domain/entities/ManifestEntry';
import { prisma } from '../database/PrismaClient';

/**
 * Prisma implementation of IManifestEntryRepository
 */
export class ManifestEntryRepository implements IManifestEntryRepository {
  async create(input: CreateManifestEntryInput): Promise<ManifestEntry> {
    const entry = await prisma.manifestEntry.create({
      data: {
        datasetId: input.datasetId,
        blobId: input.blobId,
        path: input.path || null,
        metadata: JSON.stringify(input.metadata),
      },
    });

    return this.mapToEntity(entry);
  }

  async createMany(inputs: CreateManifestEntryInput[]): Promise<ManifestEntry[]> {
    const entries = await prisma.$transaction(
      inputs.map((input) =>
        prisma.manifestEntry.create({
          data: {
            datasetId: input.datasetId,
            blobId: input.blobId,
            path: input.path || null,
            metadata: JSON.stringify(input.metadata),
          },
        })
      )
    );

    return entries.map((e: {
      id: string;
      datasetId: string;
      blobId: string;
      path: string | null;
      metadata: string;
      createdAt: Date;
    }) => this.mapToEntity(e));
  }

  async findById(id: string): Promise<ManifestEntry | null> {
    const entry = await prisma.manifestEntry.findUnique({
      where: { id },
    });

    return entry ? this.mapToEntity(entry) : null;
  }

  async findByDatasetId(datasetId: string): Promise<ManifestEntry[]> {
    const entries = await prisma.manifestEntry.findMany({
      where: { datasetId },
      orderBy: { createdAt: 'desc' }, // Most recent first
    });

    return entries.map((e: {
      id: string;
      datasetId: string;
      blobId: string;
      path: string | null;
      metadata: string;
      createdAt: Date;
    }) => this.mapToEntity(e));
  }

  async findUncommittedByDatasetId(datasetId: string): Promise<ManifestEntry[]> {
    // Find entries that are not in any version commit
    const entries = await prisma.manifestEntry.findMany({
      where: {
        datasetId,
        versionCommits: {
          none: {},
        },
      },
      orderBy: { createdAt: 'desc' }, // Most recent first
    });

    // Filter out demo blob IDs (wblb + 40 hex chars = 44 chars total)
    // Demo blobs have format: wblb + 40 hex characters
    // Real Walrus blobs on testnet use base64 format (not starting with wblb)
    const filteredEntries = entries.filter((entry: {
      id: string;
      datasetId: string;
      blobId: string;
      path: string | null;
      metadata: string;
      createdAt: Date;
    }) => {
      // Exclude demo blob IDs: wblb followed by exactly 40 hex characters
      const isDemoBlob = entry.blobId.startsWith('wblb') && 
                         entry.blobId.length === 44 && 
                         /^wblb[a-f0-9]{40}$/i.test(entry.blobId);
      return !isDemoBlob;
    });

    return filteredEntries.map((e: {
      id: string;
      datasetId: string;
      blobId: string;
      path: string | null;
      metadata: string;
      createdAt: Date;
    }) => this.mapToEntity(e));
  }

  async findByIds(ids: string[]): Promise<ManifestEntry[]> {
    const entries = await prisma.manifestEntry.findMany({
      where: {
        id: { in: ids },
      },
      orderBy: { id: 'asc' },
    });

    return entries.map((e: {
      id: string;
      datasetId: string;
      blobId: string;
      path: string | null;
      metadata: string;
      createdAt: Date;
    }) => this.mapToEntity(e));
  }

  private mapToEntity(data: {
    id: string;
    datasetId: string;
    blobId: string;
    path: string | null;
    metadata: string;
    createdAt: Date;
  }): ManifestEntry {
    return {
      id: data.id,
      datasetId: data.datasetId,
      blobId: data.blobId,
      path: data.path,
      metadata: JSON.parse(data.metadata) as Record<string, unknown>,
      createdAt: data.createdAt,
    };
  }
}

