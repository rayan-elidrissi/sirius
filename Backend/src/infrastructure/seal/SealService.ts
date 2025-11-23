import { ISealService, SealPolicy, SealedKey, UnsealResult } from '../../domain/services/ISealService';
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';
import { ISuiChainService } from '../../domain/services/ISuiChainService';

/**
 * Seal Service Implementation
 * 
 * This is a placeholder implementation that simulates Seal SDK behavior.
 * In production, replace with real Seal SDK integration.
 * 
 * Seal SDK handles:
 * - Key sealing with policies (encrypts key with policy-derived encryption)
 * - Policy enforcement (on-chain via Move - checks permissions)
 * - Key unsealing for authorized users (decrypts if policy allows)
 * 
 * Current implementation:
 * - Uses AES-256-GCM for sealing (simulates Seal SDK encryption)
 * - Verifies permissions on-chain via SuiChainService
 * - Policy is stored on-chain (Repository object has owner/writers/readers)
 */
export class SealService implements ISealService {
  private readonly ivLength = 12; // 96 bits for GCM

  constructor(
    private readonly suiChainService?: ISuiChainService
  ) {}

  async sealKey(key: Buffer, policy: SealPolicy): Promise<SealedKey> {
    // TODO: Replace with real Seal SDK integration
    // Real Seal SDK would:
    // 1. Create a policy object with allowed addresses
    // 2. Seal the key using Seal SDK's encryption
    // 3. Return sealed blob and policy reference
    
    // Current implementation: Simulate sealing with AES-256-GCM
    // Derive a sealing key from policy (in real Seal SDK, this is handled internally)
    const sealingKey = this.deriveSealingKey(policy);
    
    // Encrypt the key with the sealing key
    const iv = randomBytes(this.ivLength);
    const cipher = createCipheriv('aes-256-gcm', sealingKey, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(key),
      cipher.final(),
    ]);
    
    const tag = cipher.getAuthTag();
    const sealedBlob = Buffer.concat([encrypted, tag, iv]); // Store IV with sealed blob
    
    console.log(`[SealService] Sealed key for policy repoId: ${policy.repoId}, ${policy.allowedAddresses.length} allowed addresses`);
    
    return {
      sealedBlob,
      policy,
    };
  }

  async unsealKey(sealedBlob: Buffer, policy: SealPolicy, callerAddress: string): Promise<UnsealResult> {
    // TODO: Replace with real Seal SDK integration
    // Real Seal SDK would:
    // 1. Check on-chain policy (via Move) if caller is authorized
    // 2. Use Seal SDK to decrypt the sealed key
    // 3. Return unsealed key
    
    // Step 1: Verify caller has permission (on-chain check)
    if (!await this.canUnseal(policy, callerAddress)) {
      throw new Error(`Address ${callerAddress} is not authorized to unseal this key for repo ${policy.repoId}`);
    }
    
    // Step 2: Unseal the key (simulate Seal SDK decryption)
    // Extract IV (last 12 bytes) and encrypted key
    const iv = sealedBlob.slice(-this.ivLength);
    const tag = sealedBlob.slice(-this.ivLength - 16, -this.ivLength);
    const encrypted = sealedBlob.slice(0, -this.ivLength - 16);
    
    // Derive sealing key from policy
    const sealingKey = this.deriveSealingKey(policy);
    
    // Decrypt
    const decipher = createDecipheriv('aes-256-gcm', sealingKey, iv);
    decipher.setAuthTag(tag);
    
    const key = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    
    console.log(`[SealService] Unsealed key for caller: ${callerAddress}`);
    
    return {
      key,
    };
  }

  async canUnseal(policy: SealPolicy, address: string): Promise<boolean> {
    // Check on-chain policy via SuiChainService
    // The Repository object on Sui Move contains owner/writers/readers
    if (!this.suiChainService) {
      // Fallback: check local policy if SuiChainService not available
      console.warn('[SealService] SuiChainService not available, using local policy check');
      return policy.allowedAddresses.includes(address);
    }
    
    try {
      // Check if address is owner, writer, or reader on-chain
      const repoInfo = await this.suiChainService.getRepositoryInfo(policy.repoId);
      
      const isOwner = repoInfo.owner === address;
      const isWriter = repoInfo.writers.includes(address);
      const isReader = repoInfo.readers.includes(address);
      
      return isOwner || isWriter || isReader;
    } catch (error) {
      console.error('[SealService] Error checking on-chain permissions:', error);
      // Fallback to local policy check
      return policy.allowedAddresses.includes(address);
    }
  }

  /**
   * Derive a sealing key from policy
   * In real Seal SDK, this is handled internally
   */
  private deriveSealingKey(policy: SealPolicy): Buffer {
    // Simple key derivation: hash(policy.repoId + sorted addresses)
    // In production, Seal SDK handles this internally
    const hash = createHash('sha256');
    hash.update(policy.repoId);
    const sortedAddresses = [...policy.allowedAddresses].sort().join(',');
    hash.update(sortedAddresses);
    return hash.digest();
  }
}

