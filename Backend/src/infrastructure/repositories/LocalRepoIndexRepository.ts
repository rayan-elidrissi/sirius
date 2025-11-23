import { PrismaClient } from '@prisma/client';
import { ILocalRepoIndexRepository, CreateStagedEntryInput, CacheCommitInput, CreateLocalRepoIndexInput } from '../../domain/repositories/ILocalRepoIndexRepository';
import { LocalRepoIndex, LocalManifestEntry, LocalCommitCache } from '../../domain/entities/LocalRepoIndex';

/**
 * Prisma implementation of ILocalRepoIndexRepository
 * Handles local cache operations for repositories
 */
export class LocalRepoIndexRepository implements ILocalRepoIndexRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createOrUpdate(input: CreateLocalRepoIndexInput): Promise<LocalRepoIndex> {
    const metaStr = input.meta ? JSON.stringify(input.meta) : null;
    
    console.log(`[LocalRepoIndexRepository] createOrUpdate:`, {
      repoObjectId: input.repoObjectId,
      meta: input.meta,
      metaStr: metaStr,
      metaName: input.meta?.name,
    });
    
    const repo = await this.prisma.localRepoIndex.upsert({
      where: { repoObjectId: input.repoObjectId },
      update: {
        ownerAddress: input.ownerAddress,
        sealedRmkBlobId: input.sealedRmkBlobId,
        meta: metaStr,
      },
      create: {
        repoObjectId: input.repoObjectId,
        ownerAddress: input.ownerAddress,
        sealedRmkBlobId: input.sealedRmkBlobId,
        meta: metaStr,
      },
    });
    
    console.log(`[LocalRepoIndexRepository] ✅ Repository saved:`, {
      repoObjectId: repo.repoObjectId,
      savedMeta: repo.meta,
    });

    return {
      id: repo.id,
      repoObjectId: repo.repoObjectId,
      ownerAddress: repo.ownerAddress,
      sealedRmkBlobId: repo.sealedRmkBlobId,
      headCommitId: repo.headCommitId || null,
      meta: repo.meta ? JSON.parse(repo.meta) : null,
      createdAt: repo.createdAt,
      updatedAt: repo.updatedAt,
    };
  }

  async findByRepoObjectId(repoObjectId: string): Promise<LocalRepoIndex | null> {
    const repo = await this.prisma.localRepoIndex.findUnique({
      where: { repoObjectId },
    });

    if (!repo) return null;

    return {
      id: repo.id,
      repoObjectId: repo.repoObjectId,
      ownerAddress: repo.ownerAddress,
      sealedRmkBlobId: repo.sealedRmkBlobId,
      headCommitId: repo.headCommitId || null,
      meta: repo.meta ? JSON.parse(repo.meta) : null,
      createdAt: repo.createdAt,
      updatedAt: repo.updatedAt,
    };
  }

  async findByOwnerAddress(ownerAddress: string): Promise<LocalRepoIndex[]> {
    const repos = await this.prisma.localRepoIndex.findMany({
      where: { ownerAddress },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`[LocalRepoIndexRepository] findByOwnerAddress: Found ${repos.length} repos for ${ownerAddress}`);

    return repos.map(repo => {
      // Safely parse meta JSON
      let meta = null;
      if (repo.meta) {
        try {
          meta = typeof repo.meta === 'string' ? JSON.parse(repo.meta) : repo.meta;
          console.log(`[LocalRepoIndexRepository] Parsed meta for repo ${repo.repoObjectId}:`, {
            meta,
            metaName: meta?.name,
            metaDescription: meta?.description,
          });
        } catch (e) {
          console.warn(`[LocalRepoIndexRepository] Failed to parse meta for repo ${repo.repoObjectId}:`, e);
          meta = {};
        }
      } else {
        console.warn(`[LocalRepoIndexRepository] No meta found for repo ${repo.repoObjectId}`);
      }
      
      return {
        id: repo.id,
        repoObjectId: repo.repoObjectId,
        ownerAddress: repo.ownerAddress,
        sealedRmkBlobId: repo.sealedRmkBlobId,
        headCommitId: repo.headCommitId || null,
        meta,
        createdAt: repo.createdAt, // Keep as Date object
        updatedAt: repo.updatedAt, // Keep as Date object
      };
    });
  }

  async updateHead(repoObjectId: string, headCommitId: string): Promise<void> {
    await this.prisma.localRepoIndex.update({
      where: { repoObjectId },
      data: { headCommitId },
    });
  }

  async createStagedEntry(input: CreateStagedEntryInput): Promise<LocalManifestEntry> {
    const metadataStr = input.metadata ? JSON.stringify(input.metadata) : null;
    
    const entry = await this.prisma.localManifestEntry.create({
      data: {
        repoObjectId: input.repoObjectId,
        filename: input.filename,
        path: input.path,
        cipherSuite: input.cipherSuite,
        ciphertextBlobId: input.ciphertextBlobId,
        sealedKeyBlobId: input.sealedKeyBlobId,
        cipherHash: input.cipherHash,
        nonce: input.nonce,
        size: input.size,
        mimeType: input.mimeType,
        metadata: metadataStr,
      },
    });

    return {
      id: entry.id,
      repoObjectId: entry.repoObjectId,
      filename: entry.filename,
      path: entry.path || null,
      cipherSuite: entry.cipherSuite,
      ciphertextBlobId: entry.ciphertextBlobId,
      sealedKeyBlobId: entry.sealedKeyBlobId,
      cipherHash: entry.cipherHash,
      nonce: entry.nonce || null,
      size: entry.size,
      mimeType: entry.mimeType || null,
      metadata: entry.metadata ? JSON.parse(entry.metadata) : null,
      createdAt: entry.createdAt,
    };
  }

  async getStagedEntries(repoObjectId: string): Promise<LocalManifestEntry[]> {
    const entries = await this.prisma.localManifestEntry.findMany({
      where: { repoObjectId },
      orderBy: { createdAt: 'asc' },
    });

    return entries.map(entry => ({
      id: entry.id,
      repoObjectId: entry.repoObjectId,
      filename: entry.filename,
      path: entry.path || null,
      cipherSuite: entry.cipherSuite,
      ciphertextBlobId: entry.ciphertextBlobId,
      sealedKeyBlobId: entry.sealedKeyBlobId,
      cipherHash: entry.cipherHash,
      nonce: entry.nonce || null,
      size: entry.size,
      mimeType: entry.mimeType || null,
      metadata: entry.metadata ? JSON.parse(entry.metadata) : null,
      createdAt: entry.createdAt,
    }));
  }

  async clearStagedEntries(repoObjectId: string): Promise<void> {
    await this.prisma.localManifestEntry.deleteMany({
      where: { repoObjectId },
    });
  }

  async removeStagedEntry(entryId: string): Promise<void> {
    await this.prisma.localManifestEntry.delete({
      where: { id: entryId },
    });
  }

  async updateStagedEntryMetadata(entryId: string, metadata: any): Promise<void> {
    await this.prisma.localManifestEntry.update({
      where: { id: entryId },
      data: {
        metadata: JSON.stringify(metadata),
      },
    });
  }

  async cacheCommit(input: CacheCommitInput): Promise<LocalCommitCache> {
    const commit = await this.prisma.localCommitCache.create({
      data: {
        repoObjectId: input.repoObjectId,
        commitObjectId: input.commitObjectId,
        parentCommitId: input.parentCommitId,
        manifestBlobId: input.manifestBlobId,
        merkleRoot: input.merkleRoot,
        author: input.author,
        timestampMs: BigInt(input.timestampMs), // Convert to BigInt for Prisma
      },
    });

    return {
      id: commit.id,
      repoObjectId: commit.repoObjectId,
      commitObjectId: commit.commitObjectId,
      parentCommitId: commit.parentCommitId,
      manifestBlobId: commit.manifestBlobId,
      merkleRoot: commit.merkleRoot,
      author: commit.author,
      timestampMs: Number(commit.timestampMs), // Convert BigInt back to number for interface
      cachedAt: commit.cachedAt,
    };
  }

  async getCachedCommit(commitObjectId: string): Promise<LocalCommitCache | null> {
    const commit = await this.prisma.localCommitCache.findUnique({
      where: { commitObjectId },
    });

    if (!commit) return null;

    return {
      id: commit.id,
      repoObjectId: commit.repoObjectId,
      commitObjectId: commit.commitObjectId,
      parentCommitId: commit.parentCommitId,
      manifestBlobId: commit.manifestBlobId,
      merkleRoot: commit.merkleRoot,
      author: commit.author,
      timestampMs: Number(commit.timestampMs), // Convert BigInt back to number for interface
      cachedAt: commit.cachedAt,
    };
  }

  async getCachedCommits(repoObjectId: string): Promise<LocalCommitCache[]> {
    const commits = await this.prisma.localCommitCache.findMany({
      where: { repoObjectId },
      orderBy: { timestampMs: 'asc' }, // Oldest first (V1 = first commit)
    });

    return commits.map(commit => ({
      id: commit.id,
      repoObjectId: commit.repoObjectId,
      commitObjectId: commit.commitObjectId,
      parentCommitId: commit.parentCommitId,
      manifestBlobId: commit.manifestBlobId,
      merkleRoot: commit.merkleRoot,
      author: commit.author,
      timestampMs: Number(commit.timestampMs), // Convert BigInt back to number for interface
      cachedAt: commit.cachedAt,
    }));
  }
}

