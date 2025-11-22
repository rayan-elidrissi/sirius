import { Router, Request, Response } from 'express';
import { Container } from '../../application/Container';
import { ApiError } from '../middleware/errorHandler';
import { CommitVersionWithWalletUseCase } from '../../application/usecases/CommitVersionWithWalletUseCase';
import { SuiWalletService } from '../../infrastructure/wallet/SuiWalletService';
import { BlockchainAnchorService } from '../../infrastructure/blockchain/BlockchainAnchorService';
import { IPFSBackupService } from '../../infrastructure/ipfs/IPFSBackupService';

const router = Router();
const container = Container.getInstance();

// Initialize wallet-based commit use case
const commitVersionWithWalletUseCase = new CommitVersionWithWalletUseCase(
  container.datasetRepository,
  container.manifestEntryRepository,
  container.versionCommitRepository,
  container.merkleService,
  new SuiWalletService(),
  new BlockchainAnchorService(),
  new IPFSBackupService()
);

/**
 * GET /api/versions
 * List versions for a dataset
 * Query params: datasetId
 */
router.get('/', async (req: Request, res: Response, next) => {
  try {
    const { datasetId } = req.query;

    if (!datasetId || typeof datasetId !== 'string') {
      const error: ApiError = new Error('datasetId query parameter is required');
      error.statusCode = 400;
      throw error;
    }

    const versions = await container.listVersionsUseCase.execute({ datasetId });
    res.json({ versions });
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/versions/:id
 * Get a specific version by ID
 */
router.get('/:id', async (req: Request, res: Response, next) => {
  try {
    const { id } = req.params;
    const version = await container.versionCommitRepository.findById(id);

    if (!version) {
      const error: ApiError = new Error('Version not found');
      error.statusCode = 404;
      throw error;
    }

    res.json({ version });
  } catch (error: any) {
    next(error);
  }
});

/**
 * POST /api/versions/prepare
 * Prepare a commit (returns message to sign)
 */
router.post('/prepare', async (req: Request, res: Response, next) => {
  try {
    const { datasetId, includeAllEntries } = req.body;

    if (!datasetId) {
      const error: ApiError = new Error('datasetId is required');
      error.statusCode = 400;
      throw error;
    }

    const prepareResult = await commitVersionWithWalletUseCase.prepareCommit({
      datasetId,
      includeAllEntries: includeAllEntries || false,
    });

    res.json(prepareResult);
  } catch (error: any) {
    next(error);
  }
});

/**
 * POST /api/versions
 * Create a new version commit (with wallet signature)
 */
router.post('/', async (req: Request, res: Response, next) => {
  try {
    const {
      datasetId,
      signature,
      publicKey,
      author,
      note,
      enableBlockchainAnchor,
      enableIPFSBackup,
    } = req.body;

    if (!datasetId || !signature || !publicKey || !author) {
      const error: ApiError = new Error('datasetId, signature, publicKey, and author are required');
      error.statusCode = 400;
      throw error;
    }

    const version = await commitVersionWithWalletUseCase.execute({
      datasetId,
      signature,
      publicKey,
      author,
      note,
      enableBlockchainAnchor: enableBlockchainAnchor || false,
      enableIPFSBackup: enableIPFSBackup || false,
    });

    res.status(201).json({ version });
  } catch (error: any) {
    next(error);
  }
});

export default router;

