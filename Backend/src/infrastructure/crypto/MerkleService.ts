import { createHash } from 'crypto';
import { IMerkleService } from '../../domain/services/IMerkleService';
import { ManifestEntry } from '../../domain/entities/ManifestEntry';

/**
 * Implementation of IMerkleService for computing and verifying Merkle roots
 * Uses SHA-256 for hashing
 */
export class MerkleService implements IMerkleService {
  /**
   * Compute SHA-256 hash
   */
  private hash(data: string): string {
    return createHash('sha256').update(data, 'utf8').digest('hex');
  }

  /**
   * Compute canonical hash for a single manifest entry
   * Format: datasetId|blobId|path|metadataHash
   */
  private computeLeafHash(entry: ManifestEntry): string {
    const path = entry.path || '';
    const metadataStr = JSON.stringify(entry.metadata, Object.keys(entry.metadata).sort());
    const metadataHash = this.hash(metadataStr);
    const canonical = `${entry.datasetId}|${entry.blobId}|${path}|${metadataHash}`;
    return this.hash(canonical);
  }

  /**
   * Build Merkle tree from leaf hashes
   * @param leaves - Array of leaf hashes
   * @returns Root hash
   */
  private buildMerkleRoot(leaves: string[]): string {
    if (leaves.length === 0) {
      // Empty tree has a special root (hash of empty string)
      return this.hash('');
    }

    if (leaves.length === 1) {
      return leaves[0];
    }

    // Build tree level by level
    let currentLevel = [...leaves];

    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];

      for (let i = 0; i < currentLevel.length; i += 2) {
        if (i + 1 < currentLevel.length) {
          // Combine two hashes
          const combined = currentLevel[i] + currentLevel[i + 1];
          nextLevel.push(this.hash(combined));
        } else {
          // Odd number of nodes, promote the last one
          nextLevel.push(currentLevel[i]);
        }
      }

      currentLevel = nextLevel;
    }

    return currentLevel[0];
  }

  /**
   * Compute Merkle root for manifest entries
   */
  computeManifestRoot(entries: ManifestEntry[]): string {
    // Sort entries by ID for canonical ordering
    const sortedEntries = [...entries].sort((a, b) => a.id.localeCompare(b.id));

    // Compute leaf hashes
    const leafHashes = sortedEntries.map((entry) => this.computeLeafHash(entry));

    // Build Merkle tree
    return this.buildMerkleRoot(leafHashes);
  }

  /**
   * Verify Merkle root
   */
  verifyManifestRoot(entries: ManifestEntry[], expectedRoot: string): boolean {
    const computedRoot = this.computeManifestRoot(entries);
    return computedRoot === expectedRoot;
  }
}

