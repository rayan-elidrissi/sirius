/**
 * VersionCommit Entity
 * Represents a versioned snapshot of a dataset with Merkle root and signature
 */
export interface VersionCommit {
  id: string;
  datasetId: string;
  versionRoot: string; // Merkle root hash
  parentRoot: string | null; // Previous version's root
  signature: string; // Ed25519 signature (base64)
  publicKey: string; // Ed25519 public key (base64)
  author: string | null;
  note: string | null; // Version description/note
  createdAt: Date;
  manifestEntryIds: string[]; // IDs of manifest entries in this version
  
  // Blockchain anchoring
  suiTxHash: string | null;
  blockHeight: number | null;
  blockTimestamp: number | null;
  
  // IPFS backup
  ipfsCID: string | null;
  ipfsUrl: string | null;
  
  // Multi-signature
  isMultiSig: boolean;
  requiredSigs: number;
}

export interface CreateVersionCommitInput {
  datasetId: string;
  versionRoot: string;
  parentRoot: string | null;
  signature: string;
  publicKey: string;
  author?: string;
  note?: string;
  manifestEntryIds: string[];
  
  // Optional enhancements
  suiTxHash?: string;
  blockHeight?: number;
  blockTimestamp?: number;
  ipfsCID?: string;
  ipfsUrl?: string;
  isMultiSig?: boolean;
  requiredSigs?: number;
}

export interface VersionCommitWithEntries extends VersionCommit {
  manifestEntries: Array<{
    id: string;
    blobId: string;
    path: string | null;
    metadata: Record<string, unknown>;
  }>;
}

export interface VersionSignature {
  id: string;
  versionCommitId: string;
  publicKey: string;
  signature: string;
  signedAt: Date;
}
