import { ManifestEntry } from '../entities/ManifestEntry';

/**
 * Merkle Service Interface
 * Handles Merkle tree computation and verification
 */
export interface IMerkleService {
  /**
   * Compute Merkle root for a list of manifest entries
   * @param entries - Ordered list of manifest entries
   * @returns Merkle root hash (hex string)
   */
  computeManifestRoot(entries: ManifestEntry[]): string;

  /**
   * Verify that a Merkle root matches the given manifest entries
   * @param entries - Ordered list of manifest entries
   * @param expectedRoot - Expected Merkle root
   * @returns True if root matches
   */
  verifyManifestRoot(entries: ManifestEntry[], expectedRoot: string): boolean;
}

