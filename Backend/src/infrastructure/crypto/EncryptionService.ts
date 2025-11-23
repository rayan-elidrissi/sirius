import { IEncryptionService, EncryptionResult, DecryptionResult } from '../../domain/services/IEncryptionService';
import { randomBytes, createHash } from 'crypto';
import { xchacha20poly1305 } from '@noble/ciphers/chacha';

/**
 * Encryption Service Implementation
 * Uses XChaCha20-Poly1305 for file encryption
 * Falls back to AES-256-GCM for backward compatibility
 */
export class EncryptionService implements IEncryptionService {
  private readonly keyLength = 32; // 256 bits
  private readonly nonceLength = 24; // 192 bits for XChaCha20

  generateFileKey(): Buffer {
    return randomBytes(this.keyLength);
  }

  encryptFile(plaintext: Buffer, fileKey: Buffer): EncryptionResult {
    if (fileKey.length !== this.keyLength) {
      throw new Error(`File key must be ${this.keyLength} bytes (256 bits)`);
    }

    // Use XChaCha20-Poly1305
    const nonce = randomBytes(this.nonceLength);
    const key = new Uint8Array(fileKey);
    const nonceUint8 = new Uint8Array(nonce);
    
    try {
      const cipher = xchacha20poly1305(key, nonceUint8);
      const plaintextUint8 = new Uint8Array(plaintext);
      const ciphertext = cipher.encrypt(plaintextUint8);
      
      return {
        ciphertext: Buffer.from(ciphertext),
        nonce: Buffer.from(nonce),
        cipherSuite: 'xchacha20-poly1305',
      };
    } catch (error) {
      // Fallback to AES-256-GCM if XChaCha20 fails
      console.warn('[EncryptionService] XChaCha20 failed, falling back to AES-256-GCM:', error);
      return this.encryptFileAES(plaintext, fileKey);
    }
  }

  decryptFile(
    ciphertext: Buffer,
    nonce: Buffer,
    fileKey: Buffer,
    cipherSuite: string
  ): DecryptionResult {
    if (cipherSuite === 'xchacha20-poly1305') {
      return this.decryptFileXChaCha20(ciphertext, nonce, fileKey);
    } else if (cipherSuite === 'aes-256-gcm') {
      return this.decryptFileAES(ciphertext, nonce, fileKey);
    } else {
      throw new Error(`Unsupported cipher suite: ${cipherSuite}`);
    }
  }

  private encryptFileAES(plaintext: Buffer, fileKey: Buffer): EncryptionResult {
    // Fallback to AES-256-GCM for backward compatibility
    const { createCipheriv } = require('crypto');
    const iv = randomBytes(12); // 96 bits for GCM
    const cipher = createCipheriv('aes-256-gcm', fileKey, iv);

    const encrypted = Buffer.concat([
      cipher.update(plaintext),
      cipher.final(),
    ]);

    const tag = cipher.getAuthTag();
    const ciphertext = Buffer.concat([encrypted, tag]);

    return {
      ciphertext,
      nonce: iv,
      cipherSuite: 'aes-256-gcm',
    };
  }

  private decryptFileXChaCha20(
    ciphertext: Buffer,
    nonce: Buffer,
    fileKey: Buffer
  ): DecryptionResult {
    if (nonce.length !== this.nonceLength) {
      throw new Error(`Nonce must be ${this.nonceLength} bytes for XChaCha20`);
    }

    const key = new Uint8Array(fileKey);
    const nonceUint8 = new Uint8Array(nonce);
    const ciphertextUint8 = new Uint8Array(ciphertext);

    try {
      const cipher = xchacha20poly1305(key, nonceUint8);
      const plaintext = cipher.decrypt(ciphertextUint8);
      
      return {
        plaintext: Buffer.from(plaintext),
      };
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private decryptFileAES(
    ciphertext: Buffer,
    nonce: Buffer,
    fileKey: Buffer
  ): DecryptionResult {
    // Fallback to AES-256-GCM for backward compatibility
    const { createDecipheriv } = require('crypto');
    
    // Extract tag (last 16 bytes) and actual ciphertext
    const tag = ciphertext.slice(-16);
    const actualCiphertext = ciphertext.slice(0, -16);

    const decipher = createDecipheriv('aes-256-gcm', fileKey, nonce);
    decipher.setAuthTag(tag);

    const plaintext = Buffer.concat([
      decipher.update(actualCiphertext),
      decipher.final(),
    ]);

    return {
      plaintext,
    };
  }

  deriveFileKeyFromRMK(rmk: Buffer, fileId: string): Buffer {
    // Simple HKDF-like derivation: hash(RMK || fileId)
    // In production, use proper HKDF (e.g., from @noble/hashes)
    const hash = createHash('sha256');
    hash.update(rmk);
    hash.update(fileId);
    return hash.digest();
  }
}

