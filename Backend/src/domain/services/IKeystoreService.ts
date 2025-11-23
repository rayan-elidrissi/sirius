import { Keystore } from '../entities/Keystore';

/**
 * Keystore Service Interface
 * Manages persistent storage of Ed25519 keypairs
 */
export interface IKeystoreService {
  /**
   * Load keystore from storage
   * @returns Keystore or null if not found
   */
  load(): Promise<Keystore | null>;

  /**
   * Save keystore to storage
   */
  save(keystore: Keystore): Promise<void>;

  /**
   * Check if keystore exists
   */
  exists(): Promise<boolean>;
}

