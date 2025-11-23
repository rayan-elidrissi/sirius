/**
 * Encryption Service Interface
 * Handles symmetric encryption/decryption of files
 * Uses XChaCha20-Poly1305 or AES-GCM
 */
export interface EncryptionResult {
  ciphertext: Buffer;
  nonce: Buffer;
  cipherSuite: 'xchacha20-poly1305' | 'aes-256-gcm';
}

export interface DecryptionResult {
  plaintext: Buffer;
}

export interface IEncryptionService {
  /**
   * Generate a random file key (256 bits)
   */
  generateFileKey(): Buffer;

  /**
   * Encrypt a file with a file key
   * Returns ciphertext, nonce, and cipher suite used
   */
  encryptFile(plaintext: Buffer, fileKey: Buffer): EncryptionResult;

  /**
   * Decrypt a file with a file key
   */
  decryptFile(ciphertext: Buffer, nonce: Buffer, fileKey: Buffer, cipherSuite: string): DecryptionResult;

  /**
   * Derive a file key from RMK (Root Master Key)
   * For future: key derivation from RMK
   */
  deriveFileKeyFromRMK(rmk: Buffer, fileId: string): Buffer;
}

