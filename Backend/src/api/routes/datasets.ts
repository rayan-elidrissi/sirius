import { Router, Request, Response } from 'express';
import { Container } from '../../application/Container';
import { ApiError } from '../middleware/errorHandler';

const router = Router();
const container = Container.getInstance();
const isDev = process.env.NODE_ENV !== 'production';

/**
 * GET /api/datasets
 * List all datasets
 */
router.get('/', async (_req: Request, res: Response, next) => {
  try {
    const datasets = await container.listDatasetsUseCase.execute();
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
 */
router.post('/', async (req: Request, res: Response, next) => {
  try {
    if (isDev) {
      console.log('📥 POST /api/datasets - Request received');
      console.log('   Body:', JSON.stringify(req.body, null, 2));
      console.log('   Headers:', JSON.stringify(req.headers, null, 2));
    }
    
    const { name, description } = req.body;

    if (!name) {
      const error: ApiError = new Error('Name is required');
      error.statusCode = 400;
      throw error;
    }

    if (isDev) {
      console.log('   Creating dataset:', { name, description });
    }
    const dataset = await container.createDatasetUseCase.execute({
      name,
      description,
    });

    if (isDev) {
      console.log('   ✅ Dataset created:', dataset.id);
    }
    res.status(201).json({ dataset });
  } catch (error: any) {
    if (isDev) {
      console.error('   ❌ Error creating dataset:', error.message);
    }
    next(error);
  }
});

/**
 * DELETE /api/datasets/:id
 * Delete a dataset
 */
router.delete('/:id', async (req: Request, res: Response, next) => {
  try {
    const { id } = req.params;
    await container.datasetRepository.delete(id);
    res.status(204).send();
  } catch (error: any) {
    next(error);
  }
});

export default router;

