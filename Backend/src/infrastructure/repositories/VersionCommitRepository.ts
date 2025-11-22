import { IVersionCommitRepository } from '../../domain/repositories/IVersionCommitRepository';
import {
  VersionCommit,
  CreateVersionCommitInput,
  VersionCommitWithEntries,
} from '../../domain/entities/VersionCommit';
import { prisma } from '../database/PrismaClient';

/**
 * Prisma implementation of IVersionCommitRepository
 */
export class VersionCommitRepository implements IVersionCommitRepository {
  async create(input: CreateVersionCommitInput): Promise<VersionCommit> {
    const commit = await prisma.versionCommit.create({
      data: {
        datasetId: input.datasetId,
        versionRoot: input.versionRoot,
        parentRoot: input.parentRoot,
        signature: input.signature,
        publicKey: input.publicKey,
        author: input.author || null,
        note: input.note || null,
        suiTxHash: input.suiTxHash || null,
        blockHeight: input.blockHeight || null,
        blockTimestamp: input.blockTimestamp || null,
        ipfsCID: input.ipfsCID || null,
        ipfsUrl: input.ipfsUrl || null,
        isMultiSig: input.isMultiSig || false,
        requiredSigs: input.requiredSigs || 1,
        manifestEntries: {
          create: input.manifestEntryIds.map((entryId) => ({
            manifestEntryId: entryId,
          })),
        },
      },
    });

    return this.mapToEntity(commit, input.manifestEntryIds);
  }

  async findById(id: string): Promise<VersionCommit | null> {
    const commit = await prisma.versionCommit.findUnique({
      where: { id },
      include: {
        manifestEntries: {
          select: {
            manifestEntryId: true,
          },
        },
      },
    });

    if (!commit) return null;

    const manifestEntryIds = commit.manifestEntries.map((e: { manifestEntryId: string }) => e.manifestEntryId);
    return this.mapToEntity(commit, manifestEntryIds);
  }

  async findByIdWithEntries(id: string): Promise<VersionCommitWithEntries | null> {
    const commit = await prisma.versionCommit.findUnique({
      where: { id },
      include: {
        manifestEntries: {
          include: {
            manifestEntry: true,
          },
        },
      },
    });

    if (!commit) return null;

    const manifestEntryIds = commit.manifestEntries.map((e: { manifestEntryId: string }) => e.manifestEntryId);
    const entries = commit.manifestEntries.map((e: {
      manifestEntry: {
        id: string;
        blobId: string;
        path: string | null;
        metadata: string;
      };
    }) => ({
      id: e.manifestEntry.id,
      blobId: e.manifestEntry.blobId,
      path: e.manifestEntry.path,
      metadata: JSON.parse(e.manifestEntry.metadata) as Record<string, unknown>,
    }));

    return {
      ...this.mapToEntity(commit, manifestEntryIds),
      manifestEntries: entries,
    };
  }

  async findByDatasetId(datasetId: string): Promise<VersionCommit[]> {
    const commits = await prisma.versionCommit.findMany({
      where: { datasetId },
      include: {
        manifestEntries: {
          select: {
            manifestEntryId: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return commits.map((c: {
      id: string;
      datasetId: string;
      versionRoot: string;
      parentRoot: string | null;
      signature: string;
      publicKey: string;
      author: string | null;
      note: string | null;
      createdAt: Date;
      suiTxHash: string | null;
      blockHeight: number | null;
      blockTimestamp: number | null;
      ipfsCID: string | null;
      ipfsUrl: string | null;
      isMultiSig: boolean;
      requiredSigs: number;
      manifestEntries: { manifestEntryId: string }[];
    }) => {
      const manifestEntryIds = c.manifestEntries.map((e: { manifestEntryId: string }) => e.manifestEntryId);
      return this.mapToEntity(c, manifestEntryIds);
    });
  }

  async findByDatasetIdWithEntries(datasetId: string): Promise<VersionCommitWithEntries[]> {
    const commits = await prisma.versionCommit.findMany({
      where: { datasetId },
      include: {
        manifestEntries: {
          include: {
            manifestEntry: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return commits.map((c: {
      id: string;
      datasetId: string;
      versionRoot: string;
      parentRoot: string | null;
      signature: string;
      publicKey: string;
      author: string | null;
      note: string | null;
      createdAt: Date;
      suiTxHash: string | null;
      blockHeight: number | null;
      blockTimestamp: number | null;
      ipfsCID: string | null;
      ipfsUrl: string | null;
      isMultiSig: boolean;
      requiredSigs: number;
      manifestEntries: {
        manifestEntryId: string;
        manifestEntry: {
          id: string;
          blobId: string;
          path: string | null;
          metadata: string;
        };
      }[];
    }) => {
      const manifestEntryIds = c.manifestEntries.map((e: { manifestEntryId: string }) => e.manifestEntryId);
      const entries = c.manifestEntries.map((e: {
        manifestEntry: {
          id: string;
          blobId: string;
          path: string | null;
          metadata: string;
        };
      }) => ({
        id: e.manifestEntry.id,
        blobId: e.manifestEntry.blobId,
        path: e.manifestEntry.path,
        metadata: JSON.parse(e.manifestEntry.metadata) as Record<string, unknown>,
      }));

      return {
        ...this.mapToEntity(c, manifestEntryIds),
        manifestEntries: entries,
      };
    });
  }

  async findLatestByDatasetId(datasetId: string): Promise<VersionCommit | null> {
    const commit = await prisma.versionCommit.findFirst({
      where: { datasetId },
      include: {
        manifestEntries: {
          select: {
            manifestEntryId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!commit) return null;

    const manifestEntryIds = commit.manifestEntries.map((e: { manifestEntryId: string }) => e.manifestEntryId);
    return this.mapToEntity(commit, manifestEntryIds);
  }

  async findByVersionRoot(versionRoot: string): Promise<VersionCommit | null> {
    const commit = await prisma.versionCommit.findFirst({
      where: { versionRoot },
      include: {
        manifestEntries: {
          select: {
            manifestEntryId: true,
          },
        },
      },
    });

    if (!commit) return null;

    const manifestEntryIds = commit.manifestEntries.map((e: { manifestEntryId: string }) => e.manifestEntryId);
    return this.mapToEntity(commit, manifestEntryIds);
  }

  private mapToEntity(
    data: {
      id: string;
      datasetId: string;
      versionRoot: string;
      parentRoot: string | null;
      signature: string;
      publicKey: string;
      author: string | null;
      note: string | null;
      createdAt: Date;
      suiTxHash: string | null;
      blockHeight: number | null;
      blockTimestamp: number | null;
      ipfsCID: string | null;
      ipfsUrl: string | null;
      isMultiSig: boolean;
      requiredSigs: number;
    },
    manifestEntryIds: string[]
  ): VersionCommit {
    return {
      id: data.id,
      datasetId: data.datasetId,
      versionRoot: data.versionRoot,
      parentRoot: data.parentRoot,
      signature: data.signature,
      publicKey: data.publicKey,
      author: data.author,
      note: data.note,
      createdAt: data.createdAt,
      manifestEntryIds,
      suiTxHash: data.suiTxHash,
      blockHeight: data.blockHeight,
      blockTimestamp: data.blockTimestamp,
      ipfsCID: data.ipfsCID,
      ipfsUrl: data.ipfsUrl,
      isMultiSig: data.isMultiSig,
      requiredSigs: data.requiredSigs,
    };
  }
}
