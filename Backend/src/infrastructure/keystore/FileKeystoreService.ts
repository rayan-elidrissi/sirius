import { promises as fs } from 'fs';
import * as path from 'path';
import { IKeystoreService } from '../../domain/services/IKeystoreService';
import { Keystore } from '../../domain/entities/Keystore';

/**
 * File-based implementation of IKeystoreService
 * Stores keypair in a JSON file
 */
export class FileKeystoreService implements IKeystoreService {
  private readonly keystorePath: string;

  constructor(keystorePath?: string) {
    // Default to keystore.json in current directory
    this.keystorePath = keystorePath || path.join(process.cwd(), 'keystore.json');
  }

  /**
   * Load keystore from file
   */
  async load(): Promise<Keystore | null> {
    try {
      const data = await fs.readFile(this.keystorePath, 'utf8');
      const parsed = JSON.parse(data) as Keystore;

      // Validate structure
      if (!parsed.publicKey || !parsed.privateKey) {
        throw new Error('Invalid keystore format');
      }

      return parsed;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Save keystore to file
   */
  async save(keystore: Keystore): Promise<void> {
    const data = JSON.stringify(keystore, null, 2);
    await fs.writeFile(this.keystorePath, data, { mode: 0o600 }); // Secure permissions
  }

  /**
   * Check if keystore exists
   */
  async exists(): Promise<boolean> {
    try {
      await fs.access(this.keystorePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get keystore path
   */
  getPath(): string {
    return this.keystorePath;
  }
}

