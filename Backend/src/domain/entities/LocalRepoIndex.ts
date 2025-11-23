/**
 * Local cache entities (not source of truth)
 * Source of truth is on Sui Move smart contracts
 */

export interface LocalRepoIndex {
  id: string;
  repoObjectId: string; // Sui object ID
  ownerAddress: string;
  sealedRmkBlobId: string;
  headCommitId: string | null;
  meta: any | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LocalManifestEntry {
  id: string;
  repoObjectId: string;
  filename: string;
  path: string | null;
  cipherSuite: string;
  ciphertextBlobId: string;
  sealedKeyBlobId: string;
  cipherHash: string;
  nonce: string | null;
  size: number;
  mimeType: string | null;
  metadata: any | null;
  createdAt: Date;
}

export interface LocalCommitCache {
  id: string;
  repoObjectId: string;
  commitObjectId: string; // Sui object ID
  parentCommitId: string | null;
  manifestBlobId: string;
  merkleRoot: string;
  author: string;
  timestampMs: number;
  cachedAt: Date;
}

