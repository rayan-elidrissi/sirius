/**
 * Sui Chain Service Interface
 * Handles interactions with Sui Move smart contracts
 */

export interface CreateRepoParams {
  ownerAddress: string;
  sealedRmkBlobId: string; // Walrus blob ID
  initialWriters?: string[]; // Optional list of initial writer addresses (collaborators)
}

export interface CreateRepoResult {
  repoObjectId: string; // Sui object ID
  transactionHash: string;
}

export interface PushCommitParams {
  repoObjectId: string;
  parentCommitId: string | null; // null for first commit
  manifestBlobId: string; // Walrus blob ID
  merkleRoot: string; // Hex string
  signerAddress: string;
  signature: string; // Base64 signature
  publicKey: string; // Base64 public key
}

export interface PushCommitResult {
  commitObjectId: string; // Sui object ID
  transactionHash: string;
}

export interface GrantRoleParams {
  repoObjectId: string;
  address: string;
  role: 'reader' | 'writer';
}

export interface RepositoryInfo {
  owner: string;
  writers: string[];
  readers: string[];
  headCommitId: string | null;
  sealedRmkBlobId: string;
  createdAtMs: number;
  deleted?: boolean; // Soft delete flag
}

export interface CommitInfo {
  commitObjectId: string;
  repoId: string;
  parentCommitId: string | null;
  manifestBlobId: string;
  merkleRoot: string;
  author: string;
  timestampMs: number;
}

export interface PrepareTransactionResult {
  transactionBytes: string; // Base64 encoded transaction bytes
  transactionDigest?: string; // For dry-run preview
}

export interface ExecuteTransactionParams {
  transactionBytes: string; // Base64 encoded signed transaction bytes
  signature: string; // Base64 signature
  publicKey: string; // Base64 public key
  signerAddress: string;
}

export interface ISuiChainService {
  /**
   * Prepare a transaction to create a repository
   * Returns transaction bytes for frontend signing
   */
  prepareCreateRepo(params: CreateRepoParams): Promise<PrepareTransactionResult>;

  /**
   * Execute a signed create_repo transaction
   */
  executeCreateRepo(params: ExecuteTransactionParams): Promise<CreateRepoResult>;

  /**
   * Create a new repository on Sui (legacy - will be deprecated)
   * Calls Move create_repo()
   */
  createRepo(params: CreateRepoParams): Promise<CreateRepoResult>;

  /**
   * Prepare a transaction to delete a repository (soft delete)
   * Returns transaction bytes for frontend signing
   */
  prepareDeleteRepo(params: { repoObjectId: string; signerAddress: string }): Promise<PrepareTransactionResult>;

  /**
   * Execute a signed delete_repo transaction
   */
  executeDeleteRepo(params: ExecuteTransactionParams & { repoObjectId: string }): Promise<{ transactionHash: string }>;

  /**
   * Prepare a transaction to push a commit
   * Returns transaction bytes for frontend signing
   */
  preparePushCommit(params: Omit<PushCommitParams, 'signature' | 'publicKey'>): Promise<PrepareTransactionResult>;

  /**
   * Execute a signed push_commit transaction
   */
  executePushCommit(params: ExecuteTransactionParams & { repoObjectId: string; parentCommitId: string | null; manifestBlobId: string; merkleRoot: string }): Promise<PushCommitResult>;

  /**
   * Push a commit to a repository (legacy - will be deprecated)
   * Calls Move push_commit()
   * Verifies signature before calling
   */
  pushCommit(params: PushCommitParams): Promise<PushCommitResult>;

  /**
   * Grant read access to an address
   * Calls Move grant_reader()
   */
  grantReader(params: GrantRoleParams): Promise<void>;

  /**
   * Grant write access to an address
   * Calls Move grant_writer()
   */
  grantWriter(params: GrantRoleParams): Promise<void>;

  /**
   * Get repository info from Sui
   * Calls Move view functions
   */
  getRepositoryInfo(repoObjectId: string): Promise<RepositoryInfo>;

  /**
   * Get commit info from Sui
   */
  getCommitInfo(commitObjectId: string): Promise<CommitInfo>;

  /**
   * Get current head commit ID
   * Calls Move get_head()
   */
  getHeadCommitId(repoObjectId: string): Promise<string | null>;

  /**
   * Check if address is reader
   * Calls Move is_reader()
   */
  isReader(repoObjectId: string, address: string): Promise<boolean>;

  /**
   * Check if address is writer
   * Calls Move is_writer()
   */
  isWriter(repoObjectId: string, address: string): Promise<boolean>;
}

