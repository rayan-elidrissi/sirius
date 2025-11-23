import { Router, Request, Response } from 'express';
import { Container } from '../../application/Container';
import { ApiError } from '../middleware/errorHandler';
import { DeleteProjectUseCase } from '../../application/usecases/DeleteProjectUseCase';
import { WalrusService } from '../../infrastructure/storage/WalrusService';

const router = Router();
const container = Container.getInstance();

// Initialize delete project use case
const deleteProjectUseCase = new DeleteProjectUseCase(
  container.datasetRepository,
  container.manifestEntryRepository,
  new WalrusService('testnet')
);

/**
 * GET /api/datasets
 * List all datasets for a specific wallet owner
 * Query params: ownerAddress (required)
 */
router.get('/', async (req: Request, res: Response, next) => {
  try {
    const { ownerAddress } = req.query;

    if (!ownerAddress || typeof ownerAddress !== 'string') {
      const error: ApiError = new Error('ownerAddress query parameter is required');
      error.statusCode = 400;
      throw error;
    }

    console.log(`📋 GET /api/datasets - Fetching datasets for owner: ${ownerAddress}`);
    const datasets = await container.listDatasetsUseCase.execute({ ownerAddress });
    console.log(`✅ Found ${datasets.length} dataset(s) for owner: ${ownerAddress}`);
    res.json({ datasets });
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/datasets/:id
 * Get a specific dataset by ID
 */
router.get('/:id', async (req: Request, res: Response, next) => {
  try {
    const { id } = req.params;
    const dataset = await container.datasetRepository.findById(id);

    if (!dataset) {
      const error: ApiError = new Error('Dataset not found');
      error.statusCode = 404;
      throw error;
    }

    res.json({ dataset });
  } catch (error: any) {
    next(error);
  }
});

/**
 * POST /api/datasets
 * Create a new dataset
 * Body: { name, description?, ownerAddress }
 */
router.post('/', async (req: Request, res: Response, next) => {
  try {
    console.log('📥 POST /api/datasets - Request received');
    console.log('   Body:', JSON.stringify(req.body, null, 2));
    console.log('   Headers:', JSON.stringify(req.headers, null, 2));
    
    const { name, description, ownerAddress } = req.body;

    if (!name) {
      const error: ApiError = new Error('Name is required');
      error.statusCode = 400;
      throw error;
    }

    if (!ownerAddress) {
      const error: ApiError = new Error('ownerAddress is required');
      error.statusCode = 400;
      throw error;
    }

    console.log('   Creating dataset:', { name, description, ownerAddress });
    const dataset = await container.createDatasetUseCase.execute({
      name,
      description,
      ownerAddress,
    });

    console.log('   ✅ Dataset created:', dataset.id, 'for owner:', ownerAddress);
    res.status(201).json({ dataset });
  } catch (error: any) {
    console.error('   ❌ Error creating dataset:', error.message);
    next(error);
  }
});

/**
 * DELETE /api/datasets/:id
 * Delete a project (dataset) and all associated data
 * - Burns all blobs on Walrus (off-chain)
 * - Deletes all versions and manifest entries (cascade)
 * - Deletes the dataset
 */
router.delete('/:id', async (req: Request, res: Response, next) => {
  try {
    const { id } = req.params;

    console.log(`🗑️  DELETE /api/datasets/${id} - Deleting project...`);

    const result = await deleteProjectUseCase.execute({ datasetId: id });

    console.log(`✅ Project deleted successfully:`);
    console.log(`   - Dataset ID: ${result.datasetId}`);
    console.log(`   - Blobs deleted: ${result.deletedBlobs}`);
    console.log(`   - Blobs burned on Walrus: ${result.burnedBlobs}`);
    if (result.failedBlobs.length > 0) {
      console.warn(`   ⚠️  Failed to burn ${result.failedBlobs.length} blobs:`, result.failedBlobs);
    }

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
      result: {
        datasetId: result.datasetId,
        deletedBlobs: result.deletedBlobs,
        burnedBlobs: result.burnedBlobs,
        failedBlobs: result.failedBlobs,
      },
    });
  } catch (error: any) {
    console.error(`❌ Error deleting project:`, error.message);
    next(error);
  }
});

export default router;

