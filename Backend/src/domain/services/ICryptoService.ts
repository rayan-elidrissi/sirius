import { Keystore } from '../entities/Keystore';

/**
 * Crypto Service Interface
 * Handles all cryptographic operations (Ed25519 signing, hashing)
 */
export interface ICryptoService {
  /**
   * Generate a new Ed25519 keypair
   */
  generateKeyPair(): Keystore;

  /**
   * Sign data with a private key
   * @param data - Data to sign
   * @param privateKey - Base64 encoded private key
   * @returns Base64 encoded signature
   */
  sign(data: string, privateKey: string): string;

  /**
   * Verify a signature
   * @param data - Original data
   * @param signature - Base64 encoded signature
   * @param publicKey - Base64 encoded public key
   * @returns True if signature is valid
   */
  verify(data: string, signature: string, publicKey: string): boolean;

  /**
   * Compute SHA-256 hash of data
   * @param data - Data to hash
   * @returns Hex encoded hash
   */
  hash(data: string): string;
}

