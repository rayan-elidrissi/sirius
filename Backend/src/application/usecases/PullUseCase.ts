import { ISuiChainService } from '../../domain/services/ISuiChainService';

export interface PullRequest {
  repoObjectId: string;
  callerAddress: string;
  localHeadCommitId?: string | null; // Current local head (if any)
}

export interface PullResult {
  hasUpdates: boolean;
  newCommits: Array<{
    commitObjectId: string;
    manifestBlobId: string;
    merkleRoot: string;
    author: string;
    timestampMs: number;
  }>;
  latestCommitId: string | null;
}

/**
 * Use case: Pull updates from Sui
 * 
 * Flow:
 * 1. Get current head from Sui
 * 2. Compare with local head
 * 3. If different, fetch new commits (incremental)
 * 4. Return list of new commits
 * 
 * Note: Actual file download is done via CloneUseCase
 */
export class PullUseCase {
  constructor(
    private readonly suiChainService: ISuiChainService
  ) {}

  async execute(request: PullRequest): Promise<PullResult> {
    const { repoObjectId, localHeadCommitId } = request;

    // 1. Get current head from Sui
    const chainHead = await this.suiChainService.getHeadCommitId(repoObjectId);

    // 2. Compare with local head
    if (!chainHead) {
      return {
        hasUpdates: false,
        newCommits: [],
        latestCommitId: null,
      };
    }

    if (chainHead === localHeadCommitId) {
      return {
        hasUpdates: false,
        newCommits: [],
        latestCommitId: chainHead,
      };
    }

    // 3. Fetch new commits (walk back from head to local head)
    const newCommits: PullResult['newCommits'] = [];
    let currentCommitId: string | null = chainHead;

    while (currentCommitId && currentCommitId !== localHeadCommitId) {
      const commitInfo = await this.suiChainService.getCommitInfo(currentCommitId);
      newCommits.push({
        commitObjectId: commitInfo.commitObjectId,
        manifestBlobId: commitInfo.manifestBlobId,
        merkleRoot: commitInfo.merkleRoot,
        author: commitInfo.author,
        timestampMs: commitInfo.timestampMs,
      });

      // Walk to parent
      currentCommitId = commitInfo.parentCommitId || null;
    }

    // Reverse to get chronological order (oldest first)
    newCommits.reverse();

    console.log(`[Pull] Found ${newCommits.length} new commit(s)`);

    return {
      hasUpdates: true,
      newCommits,
      latestCommitId: chainHead,
    };
  }
}

