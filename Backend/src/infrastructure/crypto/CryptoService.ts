import * as nacl from 'tweetnacl';
import { createHash } from 'crypto';
import { ICryptoService } from '../../domain/services/ICryptoService';
import { Keystore } from '../../domain/entities/Keystore';

/**
 * Implementation of ICryptoService using TweetNaCl for Ed25519 and Node crypto for hashing
 */
export class CryptoService implements ICryptoService {
  /**
   * Generate a new Ed25519 keypair
   */
  generateKeyPair(): Keystore {
    const keyPair = nacl.sign.keyPair();
    return {
      publicKey: Buffer.from(keyPair.publicKey).toString('base64'),
      privateKey: Buffer.from(keyPair.secretKey).toString('base64'),
    };
  }

  /**
   * Sign data with a private key
   */
  sign(data: string, privateKey: string): string {
    const dataBuffer = Buffer.from(data, 'utf8');
    const privateKeyBuffer = Buffer.from(privateKey, 'base64');

    if (privateKeyBuffer.length !== nacl.sign.secretKeyLength) {
      throw new Error(`Invalid private key length: expected ${nacl.sign.secretKeyLength}, got ${privateKeyBuffer.length}`);
    }

    const signature = nacl.sign.detached(dataBuffer, privateKeyBuffer);
    return Buffer.from(signature).toString('base64');
  }

  /**
   * Verify a signature
   */
  verify(data: string, signature: string, publicKey: string): boolean {
    try {
      const dataBuffer = Buffer.from(data, 'utf8');
      const signatureBuffer = Buffer.from(signature, 'base64');
      const publicKeyBuffer = Buffer.from(publicKey, 'base64');

      if (publicKeyBuffer.length !== nacl.sign.publicKeyLength) {
        return false;
      }

      if (signatureBuffer.length !== nacl.sign.signatureLength) {
        return false;
      }

      return nacl.sign.detached.verify(dataBuffer, signatureBuffer, publicKeyBuffer);
    } catch {
      return false;
    }
  }

  /**
   * Compute SHA-256 hash of data
   */
  hash(data: string): string {
    return createHash('sha256').update(data, 'utf8').digest('hex');
  }
}

