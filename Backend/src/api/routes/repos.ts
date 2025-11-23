import { Router, Request, Response } from 'express';
import { Container } from '../../application/Container';
import { ApiError } from '../middleware/errorHandler';

const router = Router();
const container = Container.getInstance();

/**
 * POST /api/repos
 * Prepare transaction to create a new repository
 * Body: { ownerAddress: string, name?: string, description?: string }
 * Returns: { transactionBytes: string } for frontend to sign
 */
router.post('/', async (req: Request, res: Response, next) => {
  try {
    console.log(`[API] POST /api/repos - Request received`);
    const { ownerAddress, name, description, collaborators } = req.body;
    console.log(`[API] Request body:`, { ownerAddress, name, description });

    if (!ownerAddress || typeof ownerAddress !== 'string') {
      const error: ApiError = new Error('ownerAddress is required');
      error.statusCode = 400;
      throw error;
    }

    // Validate address format
    if (!ownerAddress.startsWith('0x') || ownerAddress.length < 10) {
      const error: ApiError = new Error(`Invalid ownerAddress format: ${ownerAddress}`);
      error.statusCode = 400;
      throw error;
    }

    console.log(`[API] Preparing transaction for owner: ${ownerAddress}`);
    
    // Step 1: Prepare transaction (generates RMK, seals it, uploads to Walrus, prepares Move transaction)
    // Filter and validate collaborators
    const validCollaborators = (collaborators || [])
      .map((addr: string) => addr.trim())
      .filter((addr: string) => addr && addr.startsWith('0x') && addr.length >= 10);
    
    const result = await container.createRepoUseCase.execute({
      ownerAddress,
      name: name || 'Untitled Repository',
      description,
      collaborators: validCollaborators,
    });

    console.log(`[API] ✅ Transaction prepared successfully`);
    
    res.status(200).json({
      success: true,
      data: {
        transactionBytes: result.transactionBytes,
        sealedRmkBlobId: result.sealedRmkBlobId,
        message: 'Transaction prepared. Sign with wallet and call POST /api/repos/execute',
      },
    });
  } catch (error: any) {
    console.error(`[API] ❌ Error in POST /api/repos:`, error);
    console.error(`[API] Error stack:`, error.stack);
    next(error);
  }
});

/**
 * POST /api/repos/execute
 * Execute signed create_repo transaction
 * Body: { transactionBytes: string, signature: string, publicKey: string, signerAddress: string, sealedRmkBlobId: string }
 */
router.post('/execute', async (req: Request, res: Response, next) => {
  try {
    console.log(`[API] POST /api/repos/execute - Request body keys:`, Object.keys(req.body));
    const { transactionBytes, signature, publicKey, signerAddress, sealedRmkBlobId, name, description } = req.body;
    console.log(`[API] Received name: "${name}", description: "${description}"`);

    if (!transactionBytes || !signature || !publicKey || !signerAddress || !sealedRmkBlobId) {
      const error: ApiError = new Error('transactionBytes, signature, publicKey, signerAddress, and sealedRmkBlobId are required');
      error.statusCode = 400;
      throw error;
    }

    // Execute the signed transaction
    const result = await container.createRepoUseCase.executeSignedTransaction(
      transactionBytes,
      signature,
      publicKey,
      signerAddress
    );

    console.log(`[API] Saving repository with metadata:`, {
      repoObjectId: result.repoObjectId,
      name: name || 'Untitled Repository',
      description: description || '',
      hasName: !!name,
      hasDescription: !!description,
      nameValue: name,
      descriptionValue: description,
    });
    
    // Cache the repository locally
    await container.localRepoIndexRepository.createOrUpdate({
      repoObjectId: result.repoObjectId,
      ownerAddress: signerAddress,
      sealedRmkBlobId: sealedRmkBlobId, // Use from request
      meta: {
        name: name || 'Untitled Repository',
        description: description || '',
      },
    });
    
    console.log(`[API] ✅ Repository cached with metadata`);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/repos
 * List repositories for an owner
 * Query params: ownerAddress (required)
 * Must be before /:repoObjectId to avoid route conflicts
 */
router.get('/', async (req: Request, res: Response, next) => {
  try {
    const { ownerAddress } = req.query;

    if (!ownerAddress || typeof ownerAddress !== 'string') {
      const error: ApiError = new Error('ownerAddress query parameter is required');
      error.statusCode = 400;
      throw error;
    }

    const repos = await container.localRepoIndexRepository.findByOwnerAddress(ownerAddress);

    // Filter out deleted repos by checking on-chain status
    const reposWithDeletedStatus = await Promise.all(
      repos.map(async (repo) => {
        try {
          const suiInfo = await container.suiChainService.getRepositoryInfo(repo.repoObjectId);
          return {
            ...repo,
            deleted: suiInfo.deleted || false,
          };
        } catch (error) {
          // If we can't fetch from Sui, assume not deleted
          console.warn(`[API] Could not fetch deleted status for repo ${repo.repoObjectId}:`, error);
          return {
            ...repo,
            deleted: false,
          };
        }
      })
    );

    // Filter out deleted repos
    const activeRepos = reposWithDeletedStatus.filter(repo => !repo.deleted);

    res.json({
      success: true,
      data: activeRepos, // Return only non-deleted repos
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/repos/:repoObjectId
 * Get repository info (from cache + Sui)
 */
router.get('/:repoObjectId', async (req: Request, res: Response, next) => {
  try {
    const { repoObjectId } = req.params;

    // Skip validation for special routes (like wildcards)
    if (repoObjectId === '*' || repoObjectId === 'favicon.ico') {
      res.status(404).json({
        success: false,
        error: 'Not found',
      });
      return;
    }

    // Validate repoObjectId format (Sui object IDs start with 0x and are 66 chars)
    if (!repoObjectId || !repoObjectId.startsWith('0x') || repoObjectId.length < 10) {
      const error: ApiError = new Error(`Invalid repoObjectId format: ${repoObjectId}. Sui object IDs must start with '0x' and be at least 10 characters long.`);
      error.statusCode = 400;
      throw error;
    }

    // Get from cache
    const cached = await container.localRepoIndexRepository.findByRepoObjectId(repoObjectId);
    
    // Get from Sui (source of truth)
    const suiInfo = await container.suiChainService.getRepositoryInfo(repoObjectId);

    res.json({
      success: true,
      data: {
        cached,
        sui: suiInfo,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/repos/:repoObjectId/files
 * Upload and stage a file
 * Body: { file: { filename: string, content: Buffer|string, mimeType?: string }, callerAddress: string }
 */
router.post('/:repoObjectId/files', async (req: Request, res: Response, next) => {
  try {
    const { repoObjectId } = req.params;
    const { file, callerAddress } = req.body;

    if (!file || !file.filename || !file.content) {
      const error: ApiError = new Error('file object with filename and content is required');
      error.statusCode = 400;
      throw error;
    }

    if (!callerAddress) {
      const error: ApiError = new Error('callerAddress is required');
      error.statusCode = 400;
      throw error;
    }

    // Convert content to Buffer if needed
    const buffer = Buffer.isBuffer(file.content) 
      ? file.content 
      : Buffer.from(file.content, 'base64');

    const result = await container.uploadFilesUseCase.execute({
      repoObjectId,
      file: {
        buffer,
        filename: file.filename,
        mimeType: file.mimeType,
        size: buffer.length,
      },
      callerAddress,
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/repos/:repoObjectId/staged
 * Get staged files
 */
router.get('/:repoObjectId/staged', async (req: Request, res: Response, next) => {
  try {
    const { repoObjectId } = req.params;

    const staged = await container.localRepoIndexRepository.getStagedEntries(repoObjectId);

    res.json({
      success: true,
      data: staged,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/repos/:repoObjectId/commit
 * Prepare transaction to commit staged files
 * Body: { authorAddress: string, note?: string }
 * Returns: { transactionBytes: string, manifestBlobId: string, merkleRoot: string } for frontend to sign
 */
router.post('/:repoObjectId/commit', async (req: Request, res: Response, next) => {
  try {
    const { repoObjectId } = req.params;
    const { authorAddress, note } = req.body;

    if (!authorAddress) {
      const error: ApiError = new Error('authorAddress is required');
      error.statusCode = 400;
      throw error;
    }

    // Step 1: Prepare transaction (builds manifest, uploads to Walrus, calculates merkle root, prepares Move transaction)
    const result = await container.commitUseCase.execute({
      repoObjectId,
      authorAddress,
      note,
    });

    res.status(200).json({
      success: true,
      data: {
        transactionBytes: result.transactionBytes,
        manifestBlobId: result.manifestBlobId,
        merkleRoot: result.merkleRoot,
        parentCommitId: result.parentCommitId,
        message: 'Transaction prepared. Sign with wallet and call POST /api/repos/:repoObjectId/commit/execute',
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/repos/:repoObjectId/commit/execute
 * Execute signed push_commit transaction
 * Body: { transactionBytes: string, signature: string, publicKey: string, signerAddress: string, manifestBlobId: string, merkleRoot: string, parentCommitId: string | null }
 */
router.post('/:repoObjectId/commit/execute', async (req: Request, res: Response, next) => {
  try {
    const { repoObjectId } = req.params;
    const { transactionBytes, signature, publicKey, signerAddress, manifestBlobId, merkleRoot, parentCommitId } = req.body;

    if (!transactionBytes || !signature || !publicKey || !signerAddress || !manifestBlobId || !merkleRoot) {
      const error: ApiError = new Error('transactionBytes, signature, publicKey, signerAddress, manifestBlobId, and merkleRoot are required');
      error.statusCode = 400;
      throw error;
    }

    // Execute the signed transaction
    const result = await container.commitUseCase.executeSignedTransaction(
      repoObjectId,
      parentCommitId || null,
      manifestBlobId,
      merkleRoot,
      transactionBytes,
      signature,
      publicKey,
      signerAddress
    );

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/repos/:repoObjectId/clone
 * Clone a repository
 * Body: { callerAddress: string, outputPath?: string }
 */
router.post('/:repoObjectId/clone', async (req: Request, res: Response, next) => {
  try {
    const { repoObjectId } = req.params;
    const { callerAddress, outputPath } = req.body;

    if (!callerAddress) {
      const error: ApiError = new Error('callerAddress is required');
      error.statusCode = 400;
      throw error;
    }

    const result = await container.cloneUseCase.execute({
      repoObjectId,
      callerAddress,
      outputPath,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/repos/:repoObjectId/pull
 * Pull updates from Sui
 * Body: { callerAddress: string, localHeadCommitId?: string }
 */
router.post('/:repoObjectId/pull', async (req: Request, res: Response, next) => {
  try {
    const { repoObjectId } = req.params;
    const { callerAddress, localHeadCommitId } = req.body;

    if (!callerAddress) {
      const error: ApiError = new Error('callerAddress is required');
      error.statusCode = 400;
      throw error;
    }

    const result = await container.pullUseCase.execute({
      repoObjectId,
      callerAddress,
      localHeadCommitId,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/repos/:repoObjectId
 * Soft delete a repository (marks as deleted on-chain)
 * Body: { signerAddress: string }
 */
router.delete('/:repoObjectId', async (req: Request, res: Response, next) => {
  try {
    console.log(`[API] DELETE /api/repos/:repoObjectId - Request received`);
    console.log(`[API] Request params:`, req.params);
    console.log(`[API] Request body:`, req.body);
    
    const { repoObjectId } = req.params;
    const { signerAddress } = req.body;

    // Skip validation for special routes
    if (repoObjectId === '*' || repoObjectId === 'favicon.ico') {
      res.status(404).json({
        success: false,
        error: 'Not found',
      });
      return;
    }

    // Validate repoObjectId format
    if (!repoObjectId || !repoObjectId.startsWith('0x') || repoObjectId.length < 10) {
      const error: ApiError = new Error(`Invalid repoObjectId format: ${repoObjectId}`);
      error.statusCode = 400;
      throw error;
    }

    if (!signerAddress || typeof signerAddress !== 'string') {
      const error: ApiError = new Error('signerAddress is required in request body');
      error.statusCode = 400;
      throw error;
    }

    console.log(`[API] Preparing delete_repo transaction for repo: ${repoObjectId}, signer: ${signerAddress}`);

    // Prepare transaction
    const preparedTx = await container.suiChainService.prepareDeleteRepo({
      repoObjectId,
      signerAddress,
    });

    console.log(`[API] ✅ Delete transaction prepared successfully`);

    res.status(200).json({
      success: true,
      data: {
        transactionBytes: preparedTx.transactionBytes,
        message: 'Transaction prepared. Sign with wallet and call DELETE /api/repos/:repoObjectId/execute',
      },
    });
  } catch (error: any) {
    console.error(`[API] ❌ Error in DELETE /api/repos/:repoObjectId:`, error);
    console.error(`[API] Error stack:`, error.stack);
    next(error);
  }
});

/**
 * DELETE /api/repos/:repoObjectId/execute
 * Execute signed delete_repo transaction
 * Body: { transactionBytes: string, signature: string, publicKey: string, signerAddress: string }
 */
router.delete('/:repoObjectId/execute', async (req: Request, res: Response, next) => {
  try {
    const { repoObjectId } = req.params;
    const { transactionBytes, signature, publicKey, signerAddress } = req.body;

    if (!transactionBytes || !signature || !publicKey || !signerAddress) {
      const error: ApiError = new Error('transactionBytes, signature, publicKey, and signerAddress are required');
      error.statusCode = 400;
      throw error;
    }

    // Execute the signed transaction
    const result = await container.suiChainService.executeDeleteRepo({
      repoObjectId,
      transactionBytes,
      signature,
      publicKey,
      signerAddress,
    });

    // Optionally: Burn blobs on Walrus (off-chain cleanup)
    // This is optional - the repository is already soft-deleted on-chain
    // You can add logic here to burn the sealed RMK blob and other blobs if needed

    res.status(200).json({
      success: true,
      data: {
        transactionHash: result.transactionHash,
        suiscanUrl: `https://suiscan.xyz/testnet/tx/${result.transactionHash}`,
        message: 'Repository soft deleted successfully',
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

