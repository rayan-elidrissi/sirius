import { IDatasetRepository } from '../../domain/repositories/IDatasetRepository';
import { IManifestEntryRepository } from '../../domain/repositories/IManifestEntryRepository';
import { IVersionCommitRepository } from '../../domain/repositories/IVersionCommitRepository';
import { ICryptoService } from '../../domain/services/ICryptoService';
import { IMerkleService } from '../../domain/services/IMerkleService';

export interface VerifyChainRequest {
  datasetId: string;
}

export interface VersionVerificationResult {
  versionId: string;
  versionRoot: string;
  parentRoot: string | null;
  merkleRootValid: boolean;
  signatureValid: boolean;
  parentLinkValid: boolean;
  errors: string[];
}

export interface ChainVerificationResult {
  datasetId: string;
  valid: boolean;
  versionCount: number;
  versions: VersionVerificationResult[];
  errors: string[];
}

/**
 * Use case: Verify the integrity of a dataset's version chain
 */
export class VerifyChainUseCase {
  constructor(
    private readonly datasetRepository: IDatasetRepository,
    private readonly manifestEntryRepository: IManifestEntryRepository,
    private readonly versionCommitRepository: IVersionCommitRepository,
    private readonly cryptoService: ICryptoService,
    private readonly merkleService: IMerkleService
  ) {}

  async execute(request: VerifyChainRequest): Promise<ChainVerificationResult> {
    // Verify dataset exists
    const dataset = await this.datasetRepository.findById(request.datasetId);
    if (!dataset) {
      throw new Error(`Dataset not found: ${request.datasetId}`);
    }

    // Get all versions
    const versions = await this.versionCommitRepository.findByDatasetIdWithEntries(
      request.datasetId
    );

    if (versions.length === 0) {
      return {
        datasetId: request.datasetId,
        valid: true,
        versionCount: 0,
        versions: [],
        errors: [],
      };
    }

    // Build version root index
    const versionRootIndex = new Map(versions.map((v) => [v.versionRoot, v]));

    // Verify each version
    const results: VersionVerificationResult[] = [];
    const globalErrors: string[] = [];

    for (const version of versions) {
      const errors: string[] = [];
      let merkleRootValid = false;
      let signatureValid = false;
      let parentLinkValid = false;

      // 1. Verify Merkle root
      try {
        const entries = await this.manifestEntryRepository.findByIds(version.manifestEntryIds);
        const computedRoot = this.merkleService.computeManifestRoot(entries);
        merkleRootValid = computedRoot === version.versionRoot;

        if (!merkleRootValid) {
          errors.push(
            `Merkle root mismatch: expected ${version.versionRoot}, computed ${computedRoot}`
          );
        }
      } catch (error) {
        errors.push(`Failed to verify Merkle root: ${(error as Error).message}`);
      }

      // 2. Verify signature
      try {
        const signatureData = this.createSignatureData({
          datasetId: version.datasetId,
          versionRoot: version.versionRoot,
          parentRoot: version.parentRoot,
          timestamp: version.createdAt.toISOString(),
        });

        signatureValid = this.cryptoService.verify(
          signatureData,
          version.signature,
          version.publicKey
        );

        if (!signatureValid) {
          errors.push('Invalid signature');
        }
      } catch (error) {
        errors.push(`Failed to verify signature: ${(error as Error).message}`);
      }

      // 3. Verify parent link
      if (version.parentRoot === null) {
        // First version should have null parent
        parentLinkValid = true;
      } else {
        // Parent should exist in the chain
        const parent = versionRootIndex.get(version.parentRoot);
        if (parent) {
          // Parent should be created before this version
          if (parent.createdAt < version.createdAt) {
            parentLinkValid = true;
          } else {
            errors.push('Parent version was created after this version');
          }
        } else {
          errors.push(`Parent version not found: ${version.parentRoot}`);
        }
      }

      results.push({
        versionId: version.id,
        versionRoot: version.versionRoot,
        parentRoot: version.parentRoot,
        merkleRootValid,
        signatureValid,
        parentLinkValid,
        errors,
      });

      if (errors.length > 0) {
        globalErrors.push(`Version ${version.id}: ${errors.join(', ')}`);
      }
    }

    const valid = results.every(
      (r) => r.merkleRootValid && r.signatureValid && r.parentLinkValid
    );

    return {
      datasetId: request.datasetId,
      valid,
      versionCount: versions.length,
      versions: results,
      errors: globalErrors,
    };
  }

  private createSignatureData(data: {
    datasetId: string;
    versionRoot: string;
    parentRoot: string | null;
    timestamp: string;
  }): string {
    return JSON.stringify({
      datasetId: data.datasetId,
      versionRoot: data.versionRoot,
      parentRoot: data.parentRoot,
      timestamp: data.timestamp,
    });
  }
}

