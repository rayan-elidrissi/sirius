import { ISuiChainService, CreateRepoParams, CreateRepoResult, PushCommitParams, PushCommitResult, GrantRoleParams, RepositoryInfo, CommitInfo, PrepareTransactionResult, ExecuteTransactionParams } from '../../domain/services/ISuiChainService';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';

/**
 * Sui Chain Service Implementation
 * Handles interactions with Sui Move smart contracts
 */
export class SuiChainService implements ISuiChainService {
  private client: SuiClient;
  private packageId: string;
  private network: 'testnet' | 'mainnet' | 'devnet' | 'localnet';

  /**
   * Get Suiscan URL for a transaction or object
   */
  private getSuiscanUrl(type: 'tx' | 'object', id: string): string {
    const network = this.network === 'testnet' ? 'testnet' : this.network === 'mainnet' ? '' : 'devnet';
    const baseUrl = network ? `https://suiscan.xyz/${network}` : 'https://suiscan.xyz';
    return `${baseUrl}/${type}/${id}`;
  }

  constructor() {
    // Try to load .env explicitly if not already loaded
    if (!process.env.SUI_PACKAGE_ID) {
      try {
        const dotenv = require('dotenv');
        const path = require('path');
        dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
      } catch (e) {
        // dotenv already loaded or not available
      }
    }
    
    this.network = (process.env.SUI_NETWORK || 'testnet') as 'testnet' | 'mainnet' | 'devnet' | 'localnet';
    this.client = new SuiClient({ url: getFullnodeUrl(this.network) });
    this.packageId = process.env.SUI_PACKAGE_ID || '0x0';
    
    if (this.packageId === '0x0') {
      console.warn('[SuiChainService] WARNING: SUI_PACKAGE_ID not set in .env');
      console.warn('[SuiChainService] Current working directory:', process.cwd());
      console.warn('[SuiChainService] Please set SUI_PACKAGE_ID in Backend/.env (see .env.example)');
      console.warn('[SuiChainService] Available env vars:', Object.keys(process.env).filter(k => k.includes('SUI')));
    }
    
    console.log(`[SuiChainService] Initialized with package: ${this.packageId} on ${this.network}`);
  }

  /**
   * Prepare transaction to create a repository
   * Returns transaction bytes for frontend signing
   */
  async prepareCreateRepo(params: CreateRepoParams): Promise<PrepareTransactionResult> {
    try {
      console.log(`[SuiChainService] Preparing create_repo transaction for owner: ${params.ownerAddress}`);
      console.log(`[SuiChainService] Package ID: ${this.packageId}`);
      console.log(`[SuiChainService] Network: ${this.network}`);
      console.log(`[SuiChainService] Sealed RMK Blob ID: ${params.sealedRmkBlobId}`);
      
      // Validate package ID
      if (!this.packageId || this.packageId === '0x0') {
        throw new Error('SUI_PACKAGE_ID is not set or invalid. Please set SUI_PACKAGE_ID in Backend/.env');
      }
      
      // Validate owner address
      if (!params.ownerAddress || !params.ownerAddress.startsWith('0x')) {
        throw new Error(`Invalid owner address: ${params.ownerAddress}`);
      }
      
      // Validate sealed RMK blob ID
      if (!params.sealedRmkBlobId || params.sealedRmkBlobId.length === 0) {
        throw new Error(`Invalid sealed RMK blob ID: ${params.sealedRmkBlobId}`);
      }
      
      const tx = new Transaction();
      
      // Convert sealedRmkBlobId string to vector<u8>
      const blobIdBytes = Buffer.from(params.sealedRmkBlobId, 'utf-8');
      console.log(`[SuiChainService] Blob ID bytes length: ${blobIdBytes.length}`);
      
      // Call Move function: create_repo(owner, sealed_rmk_blob_id, initial_writers)
      const target = `${this.packageId}::repository::create_repo`;
      console.log(`[SuiChainService] Move call target: ${target}`);
      
      // Prepare initial writers (collaborators) - validate and filter
      const initialWriters = (params.initialWriters || []).filter(addr => 
        addr && addr.startsWith('0x') && addr.length >= 10
      );
      console.log(`[SuiChainService] Initial writers (collaborators): ${initialWriters.length}`);
      
      tx.moveCall({
        target,
        arguments: [
          tx.pure.address(params.ownerAddress),
          tx.pure.vector('u8', Array.from(blobIdBytes)),
          tx.pure.vector('address', initialWriters), // Pass collaborators as initial writers
        ],
      });
      
      // IMPORTANT: We need to validate the transaction, but we cannot serialize a built transaction
      // Solution: Build with temporary sender for validation, then create a custom serialization format
      // Create a copy for validation
      const validationTx = new Transaction();
      validationTx.moveCall({
        target,
        arguments: [
          validationTx.pure.address(params.ownerAddress),
          validationTx.pure.vector('u8', Array.from(blobIdBytes)),
          validationTx.pure.vector('address', initialWriters),
        ],
      });
      validationTx.setSender(params.ownerAddress);
      
      // Build for validation only
      console.log(`[SuiChainService] Building transaction for validation...`);
      try {
        await validationTx.build({ client: this.client });
        console.log(`[SuiChainService] ✅ Transaction validated successfully`);
      } catch (buildError: any) {
        console.error(`[SuiChainService] ❌ Failed to build transaction:`, buildError);
        throw new Error(`Failed to build transaction: ${buildError.message}`);
      }
      
      // Serialize transaction parameters in a custom format
      // toJSON() doesn't work for unbuilt transactions, so we create our own format
      console.log(`[SuiChainService] Serializing transaction parameters (wallet will rebuild during signing)...`);
      const txParams = {
        kind: 'moveCall',
        target: target,
        arguments: [
          {
            kind: 'address',
            value: params.ownerAddress,
          },
          {
            kind: 'vector<u8>',
            value: Array.from(blobIdBytes),
          },
          {
            kind: 'vector<address>',
            value: initialWriters,
          },
        ],
      };
      const txJsonString = JSON.stringify(txParams);
      const txBytesBase64 = Buffer.from(txJsonString, 'utf-8').toString('base64');
      
      console.log(`[SuiChainService] ✅ Transaction prepared (custom format): ${txJsonString.length} chars JSON, base64: ${txBytesBase64.length} chars`);
      console.log(`[SuiChainService] Transaction params:`, txParams);
      
      return {
        transactionBytes: txBytesBase64,
      };
    } catch (error: any) {
      console.error(`[SuiChainService] ❌ Error in prepareCreateRepo:`, error);
      console.error(`[SuiChainService] Error stack:`, error.stack);
      throw error;
    }
  }

  /**
   * Execute signed create_repo transaction
   */
  async executeCreateRepo(params: ExecuteTransactionParams): Promise<CreateRepoResult> {
    console.log(`[SuiChainService] Executing signed create_repo transaction`);
    console.log(`[SuiChainService] Signer address: ${params.signerAddress}`);
    console.log(`[SuiChainService] Transaction bytes length: ${params.transactionBytes.length}`);
    console.log(`[SuiChainService] Signature length: ${params.signature.length}`);
    
    // The frontend sends the signed transaction bytes (transaction + signature combined)
    // Deserialize the signed transaction bytes
    const signedTxBytes = Buffer.from(params.transactionBytes, 'base64');
    
    // Log transaction details for debugging
    console.log(`[SuiChainService] Signed transaction bytes size: ${signedTxBytes.length} bytes`);
    // Note: The sender should be embedded in the signed transaction bytes by the wallet
    // However, if the wallet doesn't set the sender, we need to handle it
    
    // Try to execute the signed transaction
    // The Sui SDK executeTransactionBlock expects either:
    // 1. Signed transaction bytes (Uint8Array) with sender embedded
    // 2. OR unsigned transaction + signature + sender
    // 
    // If the signed bytes don't have a sender, we might need to pass it explicitly
    // However, the SDK API doesn't support passing sender with signed bytes
    // So we need to ensure the wallet sets the sender during signing
    
    try {
      const result = await this.client.executeTransactionBlock({
        transactionBlock: signedTxBytes,
        signature: params.signature, // Pass signature as base64 string (API expects string | string[])
        options: {
          showEffects: true,
          showObjectChanges: true,
        },
      });
      
      // Extract created Repository object
      const createdObject = result.objectChanges?.find(
        (change: any) => change.type === 'created' && change.objectType?.includes('Repository')
      );
      
      if (!createdObject || createdObject.type !== 'created') {
        throw new Error('Failed to create Repository object on Sui');
      }
      
      const repoObjectId = createdObject.objectId;
      const transactionHash = result.digest;
      
      console.log(`[SuiChainService] ✅ Repository created: ${repoObjectId}`);
      console.log(`[SuiChainService] Transaction: ${this.getSuiscanUrl('tx', transactionHash)}`);
      
      return {
        repoObjectId,
        transactionHash,
      };
    } catch (error: any) {
      console.error(`[SuiChainService] ❌ Error executing transaction:`, error);
      console.error(`[SuiChainService] Error message:`, error.message);
      console.error(`[SuiChainService] Error details:`, {
        signerAddress: params.signerAddress,
        transactionBytesLength: signedTxBytes.length,
        signatureLength: params.signature.length,
      });
      
      // If error is "Missing transaction sender", the wallet didn't set the sender
      if (error.message?.includes('Missing transaction sender') || error.message?.includes('sender')) {
        throw new Error(`Transaction missing sender. The wallet (Slush) should set the sender automatically during signing. Please verify the transaction in the Slush popup shows your address (${params.signerAddress}) as the sender.`);
      }
      
      throw error;
    }
  }

  /**
   * Prepare transaction to push a commit
   * Returns transaction bytes for frontend signing
   */
  async preparePushCommit(params: Omit<PushCommitParams, 'signature' | 'publicKey'>): Promise<PrepareTransactionResult> {
    console.log(`[SuiChainService] Preparing push_commit transaction for repo: ${params.repoObjectId}`);
    
    const tx = new Transaction();
    
    // Convert parent commit ID (hex string) to vector<u8>
    const parentBytes = params.parentCommitId 
      ? Buffer.from(params.parentCommitId, 'hex')
      : Buffer.alloc(0);
    
    // Convert manifest blob ID to vector<u8>
    const manifestBlobIdBytes = Buffer.from(params.manifestBlobId, 'utf-8');
    
    // Convert merkle root (hex string) to vector<u8>
    const merkleRootBytes = Buffer.from(params.merkleRoot, 'hex');
    
    // Get repository object
    const target = `${this.packageId}::repository::push_commit`;
    tx.moveCall({
      target,
      arguments: [
        tx.object(params.repoObjectId), // Repository object
        tx.pure.vector('u8', Array.from(parentBytes)), // Vector<u8>
        tx.pure.vector('u8', Array.from(manifestBlobIdBytes)), // Vector<u8>
        tx.pure.vector('u8', Array.from(merkleRootBytes)), // Vector<u8>
      ],
    });
    
    // IMPORTANT: We need to validate the transaction, but we cannot serialize a built transaction
    // Solution: Build with temporary sender for validation, then create a custom serialization format
    // Create a copy for validation
    const validationTx = new Transaction();
    validationTx.moveCall({
      target,
      arguments: [
        validationTx.object(params.repoObjectId),
        validationTx.pure.vector('u8', Array.from(parentBytes)),
        validationTx.pure.vector('u8', Array.from(manifestBlobIdBytes)),
        validationTx.pure.vector('u8', Array.from(merkleRootBytes)),
      ],
    });
    validationTx.setSender(params.signerAddress);
    
    // Build for validation only
    console.log(`[SuiChainService] Building transaction for validation...`);
    try {
      await validationTx.build({ client: this.client });
      console.log(`[SuiChainService] ✅ Transaction validated successfully`);
    } catch (buildError: any) {
      console.error(`[SuiChainService] ❌ Failed to build transaction:`, buildError);
      throw new Error(`Failed to build transaction: ${buildError.message}`);
    }
    
    // Serialize transaction parameters in a custom format
    // toJSON() doesn't work for unbuilt transactions, so we create our own format
    console.log(`[SuiChainService] Serializing transaction parameters (wallet will rebuild during signing)...`);
    const txParams = {
      kind: 'moveCall',
      target: target,
      arguments: [
        {
          kind: 'object',
          value: params.repoObjectId,
        },
        {
          kind: 'vector<u8>',
          value: Array.from(parentBytes),
        },
        {
          kind: 'vector<u8>',
          value: Array.from(manifestBlobIdBytes),
        },
        {
          kind: 'vector<u8>',
          value: Array.from(merkleRootBytes),
        },
      ],
    };
    const txJsonString = JSON.stringify(txParams);
    const txBytesBase64 = Buffer.from(txJsonString, 'utf-8').toString('base64');
    
    console.log(`[SuiChainService] ✅ Transaction prepared (custom format): ${txJsonString.length} chars JSON, base64: ${txBytesBase64.length} chars`);
    
    return {
      transactionBytes: txBytesBase64,
    };
  }

  /**
   * Execute signed push_commit transaction
   */
  async executePushCommit(params: ExecuteTransactionParams & { repoObjectId: string; parentCommitId: string | null; manifestBlobId: string; merkleRoot: string }): Promise<PushCommitResult> {
    console.log(`[SuiChainService] Executing signed push_commit transaction`);
    
    // The frontend sends the signed transaction bytes (transaction + signature combined)
    // Deserialize the signed transaction bytes
    const signedTxBytes = Buffer.from(params.transactionBytes, 'base64');
    
    // Execute the signed transaction
    // If transactionBytes already contains the signature (signed transaction), we pass it as-is
    // Otherwise, we need to pass signature separately
    // For now, we assume the frontend sends signed transaction bytes, so we pass signature as base64 string
    const result = await this.client.executeTransactionBlock({
      transactionBlock: signedTxBytes,
      signature: params.signature, // Pass signature as base64 string (API expects string | string[])
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });
    
    // Extract created Commit object
    const createdObject = result.objectChanges?.find(
      (change) => change.type === 'created' && change.objectType?.includes('Commit')
    );
    
    if (!createdObject || createdObject.type !== 'created') {
      throw new Error('Failed to create Commit object on Sui');
    }
    
    const commitObjectId = createdObject.objectId;
    const transactionHash = result.digest;
    
    console.log(`[SuiChainService] ✅ Commit created: ${commitObjectId}`);
    console.log(`[SuiChainService] Transaction: ${this.getSuiscanUrl('tx', transactionHash)}`);
    
    return {
      commitObjectId,
      transactionHash,
    };
  }

  async createRepo(params: CreateRepoParams): Promise<CreateRepoResult> {
    console.log(`[SuiChainService] Creating repo for owner: ${params.ownerAddress}`);
    
    const tx = new Transaction();
    
    // Convert sealedRmkBlobId string to vector<u8>
    const blobIdBytes = Buffer.from(params.sealedRmkBlobId, 'utf-8');
    
    // Call Move function: create_repo(owner, sealed_rmk_blob_id)
    tx.moveCall({
      target: `${this.packageId}::repository::create_repo`,
      arguments: [
        tx.pure.address(params.ownerAddress), // Address type
        tx.pure.vector('u8', Array.from(blobIdBytes)), // Vector<u8>
      ],
    });
    
    // Build transaction bytes (for frontend signing)
    await tx.build({ client: this.client });
    
    // TODO: For MVP, return transaction bytes for frontend to sign
    // Or implement service account signing
    throw new Error('Transaction signing not yet implemented. Return txBytes to frontend for wallet signing.');
  }

  async pushCommit(params: PushCommitParams): Promise<PushCommitResult> {
    console.log(`[SuiChainService] Pushing commit to repo: ${params.repoObjectId}`);
    
    const tx = new Transaction();
    
    // Convert parent commit ID (hex string) to vector<u8>
    const parentBytes = params.parentCommitId 
      ? Buffer.from(params.parentCommitId, 'hex')
      : Buffer.alloc(0);
    
    // Convert manifest blob ID to vector<u8>
    const manifestBlobIdBytes = Buffer.from(params.manifestBlobId, 'utf-8');
    
    // Convert merkle root (hex string) to vector<u8>
    const merkleRootBytes = Buffer.from(params.merkleRoot, 'hex');
    
    // Get repository object
    tx.moveCall({
      target: `${this.packageId}::repository::push_commit`,
      arguments: [
        tx.object(params.repoObjectId), // Repository object
        tx.pure.vector('u8', Array.from(parentBytes)), // Vector<u8>
        tx.pure.vector('u8', Array.from(manifestBlobIdBytes)), // Vector<u8>
        tx.pure.vector('u8', Array.from(merkleRootBytes)), // Vector<u8>
      ],
    });
    
    // Build transaction bytes (for frontend signing)
    await tx.build({ client: this.client });
    
    // TODO: Sign transaction with service account or return bytes for frontend signing
    // For MVP: Frontend will sign with wallet
    throw new Error('Transaction signing not yet implemented. Frontend must sign with wallet.');
  }

  async grantReader(params: GrantRoleParams): Promise<void> {
    console.log(`[SuiChainService] Granting reader access to ${params.address} for repo ${params.repoObjectId}`);
    
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${this.packageId}::repository::grant_reader`,
      arguments: [
        tx.object(params.repoObjectId),
        tx.pure.address(params.address), // Address type
      ],
    });
    
    // Build transaction bytes (for frontend signing)
    await tx.build({ client: this.client });
    
    // TODO: Sign and execute
    throw new Error('Transaction signing not yet implemented. Use frontend wallet signing.');
    
    console.log(`[SuiChainService] ✅ Reader access granted`);
  }

  async grantWriter(params: GrantRoleParams): Promise<void> {
    console.log(`[SuiChainService] Granting writer access to ${params.address} for repo ${params.repoObjectId}`);
    
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${this.packageId}::repository::grant_writer`,
      arguments: [
        tx.object(params.repoObjectId),
        tx.pure.address(params.address), // Address type
      ],
    });
    
    // Build transaction bytes (for frontend signing)
    await tx.build({ client: this.client });
    
    // TODO: Sign and execute
    throw new Error('Transaction signing not yet implemented. Use frontend wallet signing.');
    
    console.log(`[SuiChainService] ✅ Writer access granted`);
  }

  async getRepositoryInfo(repoObjectId: string): Promise<RepositoryInfo> {
    console.log(`[SuiChainService] Getting repository info: ${repoObjectId}`);
    
    const obj = await this.client.getObject({
      id: repoObjectId,
      options: {
        showContent: true,
        showType: true,
      },
    });
    
    if (!obj.data || obj.data.content?.dataType !== 'moveObject') {
      throw new Error(`Repository object not found: ${repoObjectId}`);
    }
    
    const content = obj.data.content.fields as any;
    
    // Parse the repository fields
    const owner = content.owner as string;
    const writers = (content.writers as string[]) || [];
    const readers = (content.readers as string[]) || [];
    const head = content.head as { type: string; fields?: { data?: string[] } };
    const sealedRmkBlobId = content.sealed_rmk_blob_id as { type: string; fields?: { data?: string[] } };
    const createdAtMs = Number(content.created_at_ms) || 0;
    
    // Convert head from Move vector<u8> to hex string
    let headCommitId: string | null = null;
    if (head?.fields?.data && head.fields.data.length > 0) {
      const headBytes = Uint8Array.from(head.fields.data);
      headCommitId = Buffer.from(headBytes).toString('hex');
    }
    
    // Convert sealedRmkBlobId from Move vector<u8> to string
    let sealedRmkBlobIdStr = '';
    if (sealedRmkBlobId?.fields?.data && sealedRmkBlobId.fields.data.length > 0) {
      const blobIdBytes = Uint8Array.from(sealedRmkBlobId.fields.data);
      sealedRmkBlobIdStr = Buffer.from(blobIdBytes).toString('utf-8');
    }
    
    // Parse deleted flag (bool)
    const deleted = content.deleted === true || content.deleted === 1;
    
    return {
      owner,
      writers,
      readers,
      headCommitId,
      sealedRmkBlobId: sealedRmkBlobIdStr,
      createdAtMs,
      deleted, // Include deleted flag
    };
  }

  async getCommitInfo(commitObjectId: string): Promise<CommitInfo> {
    console.log(`[SuiChainService] Getting commit info: ${commitObjectId}`);
    
    const obj = await this.client.getObject({
      id: commitObjectId,
      options: {
        showContent: true,
        showType: true,
      },
    });
    
    if (!obj.data || obj.data.content?.dataType !== 'moveObject') {
      throw new Error(`Commit object not found: ${commitObjectId}`);
    }
    
    const content = obj.data.content.fields as any;
    
    // Parse commit fields
    const repoId = content.repo_id as string;
    const parent = content.parent as { type: string; fields?: { data?: string[] } };
    const manifestBlobId = content.manifest_blob_id as { type: string; fields?: { data?: string[] } };
    const merkleRoot = content.merkle_root as { type: string; fields?: { data?: string[] } };
    const author = content.author as string;
    const timestampMs = Number(content.timestamp_ms) || 0;
    
    // Convert parent from Move vector<u8> to hex string
    let parentCommitId: string | null = null;
    if (parent?.fields?.data && parent.fields.data.length > 0) {
      const parentBytes = Uint8Array.from(parent.fields.data);
      parentCommitId = Buffer.from(parentBytes).toString('hex');
    }
    
    // Convert manifestBlobId from Move vector<u8> to string
    let manifestBlobIdStr = '';
    if (manifestBlobId?.fields?.data && manifestBlobId.fields.data.length > 0) {
      const blobIdBytes = Uint8Array.from(manifestBlobId.fields.data);
      manifestBlobIdStr = Buffer.from(blobIdBytes).toString('utf-8');
    }
    
    // Convert merkleRoot from Move vector<u8> to hex string
    let merkleRootStr = '';
    if (merkleRoot?.fields?.data && merkleRoot.fields.data.length > 0) {
      const rootBytes = Uint8Array.from(merkleRoot.fields.data);
      merkleRootStr = Buffer.from(rootBytes).toString('hex');
    }
    
    return {
      commitObjectId,
      repoId,
      parentCommitId,
      manifestBlobId: manifestBlobIdStr,
      merkleRoot: merkleRootStr,
      author,
      timestampMs,
    };
  }

  async getHeadCommitId(repoObjectId: string): Promise<string | null> {
    console.log(`[SuiChainService] Getting head commit ID for repo: ${repoObjectId}`);
    
    const repoInfo = await this.getRepositoryInfo(repoObjectId);
    return repoInfo.headCommitId;
  }

  async isReader(repoObjectId: string, address: string): Promise<boolean> {
    console.log(`[SuiChainService] Checking if ${address} is reader of repo: ${repoObjectId}`);
    
    // Use Move view function via devInspectTransactionBlock
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${this.packageId}::repository::is_reader`,
      arguments: [
        tx.object(repoObjectId),
        tx.pure.address(address), // Address type
      ],
    });
    
    // Use devInspect for view functions (read-only)
    const result = await this.client.devInspectTransactionBlock({
      transactionBlock: tx,
      sender: address, // Use the address we're checking
    });
    
    // Parse the return value
    if (result.results && result.results[0]?.returnValues) {
      const returnValue = result.results[0].returnValues[0];
      // Decode bool from BCS - returnValue[1] is the bytes (Uint8Array or base64 string)
      const returnBytes = returnValue[1] as unknown;
      const bytes = returnBytes instanceof Uint8Array 
        ? returnBytes 
        : Uint8Array.from(Buffer.from(returnBytes as string, 'base64'));
      // BCS bool is 1 byte: 0x00 = false, 0x01 = true
      return bytes[0] === 1;
    }
    
    return false;
  }

  async isWriter(repoObjectId: string, address: string): Promise<boolean> {
    console.log(`[SuiChainService] Checking if ${address} is writer of repo: ${repoObjectId}`);
    
    // Use Move view function via devInspectTransactionBlock
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${this.packageId}::repository::is_writer`,
      arguments: [
        tx.object(repoObjectId),
        tx.pure.address(address), // Address type
      ],
    });
    
    // Use devInspect for view functions (read-only)
    const result = await this.client.devInspectTransactionBlock({
      transactionBlock: tx,
      sender: address, // Use the address we're checking
    });
    
    // Parse the return value
    if (result.results && result.results[0]?.returnValues) {
      const returnValue = result.results[0].returnValues[0];
      // Decode bool from BCS - returnValue[1] is the bytes (Uint8Array or base64 string)
      const returnBytes = returnValue[1] as unknown;
      const bytes = returnBytes instanceof Uint8Array 
        ? returnBytes 
        : Uint8Array.from(Buffer.from(returnBytes as string, 'base64'));
      // BCS bool is 1 byte: 0x00 = false, 0x01 = true
      return bytes[0] === 1;
    }
    
    return false;
  }

  /**
   * Prepare transaction to delete a repository (soft delete)
   * Returns transaction bytes for frontend signing
   */
  async prepareDeleteRepo(params: { repoObjectId: string; signerAddress: string }): Promise<PrepareTransactionResult> {
    try {
      console.log(`[SuiChainService] Preparing delete_repo transaction for repo: ${params.repoObjectId}`);
      
      // First, verify the repository exists and is accessible
      try {
        const repoInfo = await this.getRepositoryInfo(params.repoObjectId);
        console.log(`[SuiChainService] Repository found: owner=${repoInfo.owner}, deleted=${repoInfo.deleted}`);
        
        // Check if already deleted
        if (repoInfo.deleted) {
          throw new Error('Repository is already deleted');
        }
        
        // Check if signer is the owner
        if (repoInfo.owner !== params.signerAddress) {
          throw new Error(`Only the repository owner (${repoInfo.owner}) can delete it`);
        }
      } catch (verifyError: any) {
        console.error(`[SuiChainService] ❌ Failed to verify repository:`, verifyError);
        throw new Error(`Repository verification failed: ${verifyError.message}`);
      }
      
      const tx = new Transaction();
      const target = `${this.packageId}::repository::delete_repo`;
      
      tx.moveCall({
        target,
        arguments: [
          tx.object(params.repoObjectId), // Repository object
        ],
      });
      
      // Use devInspect for validation instead of build() to avoid TypeMismatch errors
      console.log(`[SuiChainService] Validating delete_repo transaction with devInspect...`);
      try {
        const validationTx = new Transaction();
        validationTx.moveCall({
          target,
          arguments: [
            validationTx.object(params.repoObjectId),
          ],
        });
        validationTx.setSender(params.signerAddress);
        
        await this.client.devInspectTransactionBlock({
          sender: params.signerAddress,
          transactionBlock: validationTx,
        });
        console.log(`[SuiChainService] ✅ Delete_repo transaction validated successfully`);
      } catch (validateError: any) {
        console.warn(`[SuiChainService] ⚠️ Validation warning (non-blocking):`, validateError.message);
        // Continue anyway - validation will happen when wallet signs
      }
      
      // Serialize transaction parameters in a custom format
      console.log(`[SuiChainService] Serializing delete_repo transaction parameters...`);
      const txParams = {
        kind: 'moveCall',
        target: target,
        arguments: [
          {
            kind: 'object',
            value: params.repoObjectId,
          },
        ],
      };
      const txJsonString = JSON.stringify(txParams);
      const txBytesBase64 = Buffer.from(txJsonString, 'utf-8').toString('base64');
      
      console.log(`[SuiChainService] ✅ Delete_repo transaction prepared`);
      
      return {
        transactionBytes: txBytesBase64,
      };
    } catch (error: any) {
      console.error(`[SuiChainService] ❌ Error in prepareDeleteRepo:`, error);
      throw error;
    }
  }

  /**
   * Execute signed delete_repo transaction
   */
  async executeDeleteRepo(params: ExecuteTransactionParams & { repoObjectId: string }): Promise<{ transactionHash: string }> {
    try {
      console.log(`[SuiChainService] Executing signed delete_repo transaction`);
      console.log(`[SuiChainService] Repo: ${params.repoObjectId}`);
      console.log(`[SuiChainService] Signer: ${params.signerAddress}`);
      
      const signedTxBytes = Buffer.from(params.transactionBytes, 'base64');
      
      const result = await this.client.executeTransactionBlock({
        transactionBlock: signedTxBytes,
        signature: params.signature,
        options: {
          showEffects: true,
          showObjectChanges: true,
        },
      });
      
      const transactionHash = result.digest;
      
      console.log(`[SuiChainService] ✅ Repository soft deleted`);
      console.log(`[SuiChainService] Transaction: ${this.getSuiscanUrl('tx', transactionHash)}`);
      
      return {
        transactionHash,
      };
    } catch (error: any) {
      console.error(`[SuiChainService] ❌ Error executing delete_repo transaction:`, error);
      throw error;
    }
  }
}

