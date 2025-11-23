/**
 * Keystore Entity
 * Represents an Ed25519 keypair for signing version commits
 */
export interface Keystore {
  publicKey: string; // Base64 encoded
  privateKey: string; // Base64 encoded
}

