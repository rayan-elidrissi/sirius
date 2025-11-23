import { IWalrusService } from '../../domain/services/IWalrusService';
import { ISealService } from '../../domain/services/ISealService';
import { ISuiChainService } from '../../domain/services/ISuiChainService';
import { IEncryptionService } from '../../domain/services/IEncryptionService';

export interface CreateRepoRequest {
  ownerAddress: string;
  name: string;
  description?: string;
  collaborators?: string[]; // Sui wallet addresses of collaborators
}

export interface PrepareCreateRepoResult {
  transactionBytes: string; // Base64 encoded transaction bytes
  sealedRmkBlobId: string;
}

export interface CreateRepoResult {
  repoObjectId: string;
  sealedRmkBlobId: string;
  transactionHash: string;
  suiscanUrl: string; // Link to view transaction on Suiscan
  repoSuiscanUrl: string; // Link to view Repository object on Suiscan
}

/**
 * Use case: Create a new repository
 * 
 * Flow:
 * 1. Generate RMK (Root Master Key)
 * 2. Seal RMK with policy (owner only initially)
 * 3. Upload sealed RMK to Walrus
 * 4. Call Move create_repo() on Sui
 * 5. Cache repo info locally
 */
export class CreateRepoUseCase {
  constructor(
    private readonly walrusService: IWalrusService,
    private readonly sealService: ISealService,
    private readonly suiChainService: ISuiChainService,
    private readonly encryptionService: IEncryptionService
  ) {}

  async execute(request: CreateRepoRequest): Promise<PrepareCreateRepoResult> {
    try {
      const { ownerAddress } = request;
      console.log(`[CreateRepo] Starting repository creation for owner: ${ownerAddress}`);
      
      // Note: name and description are for future use (metadata on-chain)

      // 1. Generate RMK (256 bits)
      console.log(`[CreateRepo] Step 1: Generating RMK...`);
      let rmk: Buffer;
      try {
        rmk = this.encryptionService.generateFileKey();
        console.log(`[CreateRepo] ✅ Generated RMK (${rmk.length} bytes)`);
      } catch (error: any) {
        console.error(`[CreateRepo] ❌ Failed to generate RMK:`, error);
        throw new Error(`Failed to generate RMK: ${error.message}`);
      }

      // 2. Create Seal policy (owner + collaborators)
      console.log(`[CreateRepo] Step 2: Creating Seal policy...`);
      const collaborators = (request.collaborators || []).filter(addr => 
        addr && addr.startsWith('0x') && addr.length >= 10
      );
      const allowedAddresses = [ownerAddress, ...collaborators];
      const policy = {
        repoId: '', // Will be set after repo creation
        allowedAddresses,
      };
      console.log(`[CreateRepo] ✅ Policy created for ${policy.allowedAddresses.length} address(es) (owner + ${collaborators.length} collaborators)`);

      // 3. Seal RMK
      console.log(`[CreateRepo] Step 3: Sealing RMK for owner: ${ownerAddress}...`);
      let sealedKey;
      try {
        sealedKey = await this.sealService.sealKey(rmk, policy);
        console.log(`[CreateRepo] ✅ RMK sealed (${sealedKey.sealedBlob.length} bytes)`);
      } catch (error: any) {
        console.error(`[CreateRepo] ❌ Failed to seal RMK:`, error);
        throw new Error(`Failed to seal RMK: ${error.message}`);
      }

      // 4. Upload sealed RMK to Walrus
      console.log(`[CreateRepo] Step 4: Uploading sealed RMK to Walrus...`);
      let sealedRmkUpload;
      try {
        sealedRmkUpload = await this.walrusService.uploadBuffer(sealedKey.sealedBlob);
        const sealedRmkBlobId = sealedRmkUpload.blobId;
        console.log(`[CreateRepo] ✅ Sealed RMK uploaded: ${sealedRmkBlobId}`);
      } catch (error: any) {
        console.error(`[CreateRepo] ❌ Failed to upload sealed RMK to Walrus:`, error);
        throw new Error(`Failed to upload sealed RMK to Walrus: ${error.message}`);
      }
      const sealedRmkBlobId = sealedRmkUpload.blobId;

      // 5. Prepare transaction for frontend signing
      console.log(`[CreateRepo] Step 5: Preparing transaction for frontend signing...`);
      let preparedTx;
      try {
        preparedTx = await this.suiChainService.prepareCreateRepo({
          ownerAddress,
          sealedRmkBlobId,
          initialWriters: collaborators, // Pass collaborators as initial writers
        });
        console.log(`[CreateRepo] ✅ Transaction prepared (${preparedTx.transactionBytes.length} bytes)`);
      } catch (error: any) {
        console.error(`[CreateRepo] ❌ Failed to prepare transaction:`, error);
        console.error(`[CreateRepo] Error details:`, {
          message: error.message,
          stack: error.stack,
          ownerAddress,
          sealedRmkBlobId,
        });
        throw new Error(`Failed to prepare transaction: ${error.message}`);
      }

      // Return transaction bytes for frontend to sign
      // Frontend will call executeSignedTransaction after signing
      console.log(`[CreateRepo] ✅ Repository creation preparation completed successfully`);
      return {
        transactionBytes: preparedTx.transactionBytes,
        sealedRmkBlobId,
      };
    } catch (error: any) {
      console.error(`[CreateRepo] ❌ Fatal error in execute:`, error);
      console.error(`[CreateRepo] Error stack:`, error.stack);
      throw error; // Re-throw to be handled by error handler
    }
  }

  /**
   * Execute signed create_repo transaction
   * Called after frontend signs the transaction
   */
  async executeSignedTransaction(
    transactionBytes: string,
    signature: string,
    publicKey: string,
    signerAddress: string
  ): Promise<CreateRepoResult> {
    console.log(`[CreateRepo] Executing signed transaction...`);

    // Execute the signed transaction
    const createResult = await this.suiChainService.executeCreateRepo({
      transactionBytes,
      signature,
      publicKey,
      signerAddress,
    });

    console.log(`[CreateRepo] ✅ Repository created on Sui: ${createResult.repoObjectId}`);

    // Generate Suiscan URLs
    const network = process.env.SUI_NETWORK || 'testnet';
    const networkPath = network === 'testnet' ? 'testnet' : network === 'mainnet' ? '' : 'devnet';
    const baseUrl = networkPath ? `https://suiscan.xyz/${networkPath}` : 'https://suiscan.xyz';
    const suiscanUrl = `${baseUrl}/tx/${createResult.transactionHash}`;
    const repoSuiscanUrl = `${baseUrl}/object/${createResult.repoObjectId}`;

    return {
      repoObjectId: createResult.repoObjectId,
      sealedRmkBlobId: '', // Will be set from cache
      transactionHash: createResult.transactionHash,
      suiscanUrl,
      repoSuiscanUrl,
    };
  }
}

