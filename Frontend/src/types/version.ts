/**
 * Version/Commit types for Sirius
 */

export interface Version {
  id: string;
  datasetId: string;
  versionRoot: string;
  parentRoot: string | null;
  signature: string;
  publicKey: string;
  author: string | null;
  note: string | null;
  createdAt: string;
  
  // Enhanced features
  suiTxHash: string | null;
  blockHeight: number | null;
  blockTimestamp: number | null;
  ipfsCID: string | null;
  ipfsUrl: string | null;
  
  // Multi-sig
  isMultiSig: boolean;
  requiredSigs: number;
  signatures: VersionSignature[];
  
  // Relations
  fileCount: number;
  totalSize: number;
}

export interface VersionSignature {
  id: string;
  publicKey: string;
  signature: string;
  signedAt: string;
}

export interface CreateVersionRequest {
  datasetId: string;
  note?: string;
  includeAllEntries?: boolean;
  enableBlockchainAnchor?: boolean;
  enableIPFSBackup?: boolean;
}

export interface VerificationResult {
  valid: boolean;
  versionId: string;
  checks: {
    merkleRootValid: boolean;
    signatureValid: boolean;
    parentLinkValid: boolean;
    blockchainConfirmed: boolean;
  };
  details: {
    merkleRoot: string;
    computedRoot: string;
    parentRoot: string | null;
    blockTimestamp: number | null;
    txHash: string | null;
  };
  errors: string[];
}

export interface ChainVerificationResult {
  datasetId: string;
  valid: boolean;
  versionCount: number;
  versions: Array<{
    versionId: string;
    versionRoot: string;
    valid: boolean;
    errors: string[];
  }>;
}

