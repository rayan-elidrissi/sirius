import { LocalRepoIndex, LocalManifestEntry, LocalCommitCache } from '../entities/LocalRepoIndex';

export interface CreateLocalRepoIndexInput {
  repoObjectId: string;
  ownerAddress: string;
  sealedRmkBlobId: string;
  meta?: any;
}

export interface CreateStagedEntryInput {
  repoObjectId: string;
  filename: string;
  path?: string;
  cipherSuite: string;
  ciphertextBlobId: string;
  sealedKeyBlobId: string;
  cipherHash: string;
  nonce: string; // Hex-encoded nonce
  size: number;
  mimeType?: string;
  metadata?: any;
}

export interface CacheCommitInput {
  repoObjectId: string;
  commitObjectId: string;
  parentCommitId: string | null;
  manifestBlobId: string;
  merkleRoot: string;
  author: string;
  timestampMs: number;
}

export interface ILocalRepoIndexRepository {
  /**
   * Create or update local repo index (cache)
   */
  createOrUpdate(input: CreateLocalRepoIndexInput): Promise<LocalRepoIndex>;

  /**
   * Find repo by Sui object ID
   */
  findByRepoObjectId(repoObjectId: string): Promise<LocalRepoIndex | null>;

  /**
   * Find repos by owner address
   */
  findByOwnerAddress(ownerAddress: string): Promise<LocalRepoIndex[]>;

  /**
   * Create a staged manifest entry
   */
  createStagedEntry(input: CreateStagedEntryInput): Promise<LocalManifestEntry>;

  /**
   * Get all staged entries for a repo
   */
  getStagedEntries(repoObjectId: string): Promise<LocalManifestEntry[]>;

  /**
   * Clear staged entries (after commit)
   */
  clearStagedEntries(repoObjectId: string): Promise<void>;

  /**
   * Cache a commit
   */
  cacheCommit(input: CacheCommitInput): Promise<LocalCommitCache>;

  /**
   * Get cached commit
   */
  getCachedCommit(commitObjectId: string): Promise<LocalCommitCache | null>;

  /**
   * Update repo head (cache)
   */
  updateHead(repoObjectId: string, headCommitId: string): Promise<void>;
}

