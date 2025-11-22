import { Router, Request, Response } from 'express';
import { WalrusService } from '../../infrastructure/storage/WalrusService';
import { ApiError } from '../middleware/errorHandler';
import multer from 'multer';

const router = Router();
// Initialize WalrusService for TESTNET
// Ensure Walrus CLI is configured for testnet: https://docs.wal.app/usage/started.html
const walrusService = new WalrusService('testnet');

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 * 1024, // 10 GB max
  },
});

/**
 * POST /api/walrus/upload
 * Upload a file to Walrus
 * Accepts multipart/form-data with 'file' field
 */
router.post('/upload', upload.single('file'), async (req: Request, res: Response, next) => {
  try {
    if (!req.file) {
      const error: ApiError = new Error('No file provided');
      error.statusCode = 400;
      throw error;
    }

    // Upload buffer to Walrus (will use demo mode if CLI not available)
    try {
      const result = await walrusService.uploadBuffer(
        req.file.buffer,
        req.file.originalname
      );

      res.status(201).json({
        blobId: result.blobId,
        size: result.size,
        certified: result.certified,
        url: result.url,
        logs: result.logs || [],
      });
    } catch (walrusError: any) {
      // Provide more detailed error message
      console.error('Walrus upload error:', walrusError);
      const error: ApiError = new Error(
        walrusError.message || 'Failed to upload to Walrus. Please ensure Walrus CLI is installed and configured.'
      );
      error.statusCode = 503;
      throw error;
    }
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/walrus/status/:blobId
 * Get status of a Walrus blob
 */
router.get('/status/:blobId', async (req: Request, res: Response, next) => {
  try {
    const { blobId } = req.params;

    if (!blobId) {
      const error: ApiError = new Error('blobId is required');
      error.statusCode = 400;
      throw error;
    }

    const status = await walrusService.getBlobStatus(blobId);

    res.json({ status });
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/walrus/download/:blobId
 * Download a blob from Walrus
 */
router.get('/download/:blobId', async (req: Request, res: Response, next) => {
  try {
    let { blobId } = req.params;
    const { filename } = req.query;

    // Decode blobId in case it was URL encoded
    blobId = decodeURIComponent(blobId);

    if (!blobId) {
      const error: ApiError = new Error('blobId is required');
      error.statusCode = 400;
      throw error;
    }

    const buffer = await walrusService.downloadBlob(blobId);

    // Set headers for file download
    const downloadFilename = (typeof filename === 'string' ? filename : `blob-${blobId.slice(0, 16)}`) || 'download';
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);
    res.setHeader('Content-Length', buffer.length.toString());

    res.send(buffer);
  } catch (error: any) {
    next(error);
  }
});

/**
 * DELETE /api/walrus/burn/:blobId
 * Burn/Delete a blob from Walrus
 */
router.delete('/burn/:blobId', async (req: Request, res: Response, next) => {
  try {
    let { blobId } = req.params;

    // Decode blobId in case it was URL encoded
    blobId = decodeURIComponent(blobId);

    if (!blobId) {
      const error: ApiError = new Error('blobId is required');
      error.statusCode = 400;
      throw error;
    }

    await walrusService.burnBlob(blobId);

    res.json({ 
      success: true, 
      message: `Blob ${blobId} has been burned successfully` 
    });
  } catch (error: any) {
    next(error);
  }
});

export default router;

