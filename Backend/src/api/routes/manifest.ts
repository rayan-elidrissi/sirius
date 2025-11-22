import { Router, Request, Response } from 'express';
import { Container } from '../../application/Container';
import { ApiError } from '../middleware/errorHandler';
import { ManifestMetadata } from '../../domain/entities/ManifestEntry';

const router = Router();
const container = Container.getInstance();

/**
 * POST /api/manifest/entries
 * Add manifest entries to a dataset
 */
router.post('/entries', async (req: Request, res: Response, next) => {
  try {
    const { datasetId, entries } = req.body;

    if (!datasetId) {
      const error: ApiError = new Error('datasetId is required');
      error.statusCode = 400;
      throw error;
    }

    if (!Array.isArray(entries) || entries.length === 0) {
      const error: ApiError = new Error('entries must be a non-empty array');
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

    // Transform entries to CreateManifestEntryInput format
    const manifestEntries = entries.map((entry: any) => ({
      datasetId,
      blobId: entry.blobId,
      path: entry.path || null,
      metadata: entry.metadata || ({} as ManifestMetadata),
    }));

    console.log('📥 POST /api/manifest/entries - Creating manifest entries');
    console.log(`   Dataset ID: ${datasetId}`);
    console.log(`   Number of entries: ${manifestEntries.length}`);
    manifestEntries.forEach((entry, index) => {
      console.log(`   Entry ${index + 1}: blobId=${entry.blobId}, path=${entry.path}`);
    });

    const createdEntries = await container.addManifestEntriesUseCase.execute({
      datasetId,
      entries: manifestEntries,
    });

    console.log(`   ✅ Created ${createdEntries.length} manifest entries`);
    createdEntries.forEach((entry, index) => {
      console.log(`   Entry ${index + 1} ID: ${entry.id}, blobId: ${entry.blobId}`);
    });

    res.status(201).json({ entries: createdEntries });
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/manifest/entries
 * Get manifest entries for a dataset
 * Query params: datasetId, uncommitted (boolean)
 */
router.get('/entries', async (req: Request, res: Response, next) => {
  try {
    const { datasetId, uncommitted } = req.query;

    if (!datasetId || typeof datasetId !== 'string') {
      const error: ApiError = new Error('datasetId query parameter is required');
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

    let entries;
    if (uncommitted === 'true') {
      entries = await container.manifestEntryRepository.findUncommittedByDatasetId(datasetId);
    } else {
      entries = await container.manifestEntryRepository.findByDatasetId(datasetId);
    }

    console.log(`📤 GET /api/manifest/entries - Returning ${entries.length} entries for dataset ${datasetId}`);
    entries.forEach((entry, index) => {
      console.log(`   Entry ${index + 1}: id=${entry.id}, blobId=${entry.blobId}, path=${entry.path}`);
    });

    res.json({ entries });
  } catch (error: any) {
    next(error);
  }
});

export default router;

