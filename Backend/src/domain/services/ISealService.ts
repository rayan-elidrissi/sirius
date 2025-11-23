/**
 * Seal Service Interface
 * Wraps Seal SDK for key sealing/unsealing
 * Seal SDK handles encryption/sealing off-chain
 * Move only enforces the policy
 */

export interface SealPolicy {
  repoId: string; // Sui object ID
  allowedAddresses: string[]; // owner + readers + writers
}

export interface SealedKey {
  sealedBlob: Buffer; // Sealed key blob (to upload to Walrus)
  policy: SealPolicy; // Policy to store on-chain
}

export interface UnsealResult {
  key: Buffer; // Unsealed key (RMK or FileKey)
}

export interface ISealService {
  /**
   * Seal a key (RMK or FileKey) with a policy
   * Returns sealed blob (to upload to Walrus) and policy (to store on-chain)
   */
  sealKey(key: Buffer, policy: SealPolicy): Promise<SealedKey>;

  /**
   * Unseal a key from a sealed blob
   * Verifies caller has permission according to policy
   * Returns unsealed key
   */
  unsealKey(sealedBlob: Buffer, policy: SealPolicy, callerAddress: string): Promise<UnsealResult>;

  /**
   * Check if an address has permission to unseal
   * (Verifies against on-chain policy)
   */
  canUnseal(policy: SealPolicy, address: string): Promise<boolean>;
}

