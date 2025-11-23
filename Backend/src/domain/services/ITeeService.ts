/**
 * TEE Service Interface
 * Verifies file content using TEE (Trusted Execution Environment)
 * Currently uses tee_v0/claude_report.py for image verification
 */

export interface TeeVerificationResult {
  weapon: boolean; // True if weapon detected
  description: string; // Description of what was found
  decision: boolean; // True = legal/safe, False = illegal/unsafe
}

export interface ITeeService {
  /**
   * Verify a file using TEE
   * For images: uses Claude API to detect weapons/illegal content
   * Returns verification result with decision
   */
  verifyFile(fileBuffer: Buffer, mimeType?: string): Promise<TeeVerificationResult>;
}

