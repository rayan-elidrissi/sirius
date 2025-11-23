import { IDatasetRepository } from '../../domain/repositories/IDatasetRepository';
import { IManifestEntryRepository } from '../../domain/repositories/IManifestEntryRepository';
import { IWalrusService } from '../../domain/services/IWalrusService';

export interface DeleteProjectRequest {
  datasetId: string;
}

export interface DeleteProjectResult {
  datasetId: string;
  deletedBlobs: number;
  burnedBlobs: number;
  failedBlobs: string[];
}

/**
 * Use case: Delete a project (dataset) and all associated data
 * - Deletes all manifest entries
 * - Burns all blobs on Walrus (off-chain)
 * - Deletes all versions (cascade)
 * - Deletes the dataset
 * 
 * Note: On-chain data (suiTxHash) cannot be deleted as blockchain is immutable,
 * but local references are removed.
 */
export class DeleteProjectUseCase {
  constructor(
    private readonly datasetRepository: IDatasetRepository,
    private readonly manifestEntryRepository: IManifestEntryRepository,
    private readonly walrusService: IWalrusService
  ) {}

  async execute(request: DeleteProjectRequest): Promise<DeleteProjectResult> {
    const { datasetId } = request;

    // 1. Verify dataset exists
    const dataset = await this.datasetRepository.findById(datasetId);
    if (!dataset) {
      throw new Error(`Dataset not found: ${datasetId}`);
    }

    // 2. Get all manifest entries for this dataset
    const manifestEntries = await this.manifestEntryRepository.findByDatasetId(datasetId);
    
    // 3. Collect all unique blob IDs (avoid duplicates)
    const blobIds = [...new Set(manifestEntries.map(entry => entry.blobId))];
    
    // 4. Burn all blobs on Walrus (off-chain deletion)
    const burnedBlobs: string[] = [];
    const failedBlobs: string[] = [];

    for (const blobId of blobIds) {
      // Skip demo blob IDs (wblb... format with 44 chars total: "wblb" + 40 hex chars)
      // Real Walrus blobs are base64 encoded and don't start with "wblb"
      if (blobId.startsWith('wblb') && blobId.length === 44) {
        console.log(`[DeleteProject] Skipping demo blob: ${blobId}`);
        continue;
      }

      try {
        await this.walrusService.burnBlob(blobId);
        burnedBlobs.push(blobId);
        console.log(`[DeleteProject] ✅ Burned blob: ${blobId}`);
      } catch (error: any) {
        console.error(`[DeleteProject] ❌ Failed to burn blob ${blobId}:`, error.message);
        failedBlobs.push(blobId);
        // Continue with other blobs even if one fails
      }
    }

    // 5. Delete the dataset (cascade will delete versions and manifest entries)
    await this.datasetRepository.delete(datasetId);

    console.log(`[DeleteProject] ✅ Project deleted: ${dataset.name} (${datasetId})`);
    console.log(`[DeleteProject] 📊 Summary: ${blobIds.length} blobs, ${burnedBlobs.length} burned, ${failedBlobs.length} failed`);

    return {
      datasetId,
      deletedBlobs: blobIds.length,
      burnedBlobs: burnedBlobs.length,
      failedBlobs,
    };
  }
}

