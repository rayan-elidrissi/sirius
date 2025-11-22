import { Router, Request, Response } from 'express';
import { Container } from '../../application/Container';
import { ApiError } from '../middleware/errorHandler';

const router = Router();
const container = Container.getInstance();

/**
 * POST /api/verify/chain
 * Verify the integrity of a dataset's version chain
 */
router.post('/chain', async (req: Request, res: Response, next) => {
  try {
    const { datasetId } = req.body;

    if (!datasetId) {
      const error: ApiError = new Error('datasetId is required');
      error.statusCode = 400;
      throw error;
    }

    // Validate dataset exists
    const dataset = await container.datasetRepository.findById(datasetId);
    if (!dataset) {
      const error: ApiError = new Error('Dataset not found');
      error.statusCode = 404;
      throw error;
    }

    const result = await container.verifyChainUseCase.execute({ datasetId });

    res.json({
      datasetId: result.datasetId,
      valid: result.valid,
      versionCount: result.versionCount,
      errors: result.errors,
      versions: result.versions,
    });
  } catch (error: any) {
    next(error);
  }
});

export default router;

