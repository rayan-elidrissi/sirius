import * as nacl from 'tweetnacl';

/**
 * Convert base64 string to Uint8Array
 */
function fromB64(base64: string): Uint8Array {
  return Uint8Array.from(Buffer.from(base64, 'base64'));
}

/**
 * Service for interacting with Sui wallets
 * Verifies signatures from external Sui wallets (Sui Wallet, Suiet, Ethos)
 */
export interface WalletSignatureData {
  message: string;
  signature: string; // Base64 encoded
  publicKey: string; // Base64 encoded Sui public key
}

export class SuiWalletService {
  /**
   * Verify a signature from a Sui wallet
   * Sui wallets use Ed25519 signatures (same as our crypto)
   */
  verifySignature(data: WalletSignatureData): boolean {
    try {
      const messageBytes = new TextEncoder().encode(data.message);
      const signatureBytes = fromB64(data.signature);
      const publicKeyBytes = fromB64(data.publicKey);

      // Sui uses Ed25519, same as TweetNaCl
      return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Verify that a wallet address owns a public key
   * In Sui, address = hash(flag || public_key)
   */
  verifyAddressOwnership(address: string, _publicKey: string): boolean {
    try {
      // For now, we trust the wallet-provided public key
      // In production, derive address from public key and compare
      // const derivedAddress = deriveAddressFromPublicKey(publicKey);
      // return derivedAddress === address;

      // Simplified for hackathon: just check format
      return address.startsWith('0x') && address.length === 66;
    } catch {
      return false;
    }
  }

  /**
   * Create a message for wallet to sign (for authentication)
   */
  createAuthMessage(address: string, nonce: string): string {
    return JSON.stringify({
      domain: 'sirius.io',
      statement: 'Sign in to Sirius Data Layer',
      address,
      nonce,
      issuedAt: new Date().toISOString(),
    });
  }

  /**
   * Create a message for version commit signing
   */
  createCommitMessage(data: {
    datasetId: string;
    versionRoot: string;
    parentRoot: string | null;
    timestamp: string;
  }): string {
    return JSON.stringify({
      domain: 'sirius.io',
      action: 'commit_version',
      datasetId: data.datasetId,
      versionRoot: data.versionRoot,
      parentRoot: data.parentRoot,
      timestamp: data.timestamp,
    });
  }
}

