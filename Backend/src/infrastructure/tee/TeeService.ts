import { ITeeService, TeeVerificationResult } from '../../domain/services/ITeeService';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
// Load environment variables - try multiple paths
import dotenv from 'dotenv';
// Try loading from root .env (same as server.ts)
const rootEnvPath = path.resolve(__dirname, '../../../.env');
const rootResult = dotenv.config({ path: rootEnvPath, override: false });
if (rootResult.error) {
  console.warn(`[TeeService] Failed to load .env from root: ${rootResult.error.message}`);
} else if (rootResult.parsed) {
  console.log(`[TeeService] Loaded ${Object.keys(rootResult.parsed).length} env vars from root .env`);
  console.log(`[TeeService] Loaded vars: ${Object.keys(rootResult.parsed).join(', ')}`);
  if (rootResult.parsed.ANTHROPIC_API_KEY) {
    console.log(`[TeeService] ✅ ANTHROPIC_API_KEY found in parsed vars`);
    // Force set it in process.env if not already set
    if (!process.env.ANTHROPIC_API_KEY) {
      process.env.ANTHROPIC_API_KEY = rootResult.parsed.ANTHROPIC_API_KEY;
      console.log(`[TeeService] ✅ Set ANTHROPIC_API_KEY in process.env`);
    }
  } else {
    console.warn(`[TeeService] ⚠️  ANTHROPIC_API_KEY not in parsed vars`);
  }
}
// Also try Backend/.env
const backendEnvPath = path.resolve(__dirname, '../../.env');
const backendResult = dotenv.config({ path: backendEnvPath, override: false });
if (backendResult.parsed) {
  console.log(`[TeeService] Loaded ${Object.keys(backendResult.parsed).length} env vars from Backend/.env`);
}

const execAsync = promisify(exec);

/**
 * TEE Service Implementation
 * Calls tee_v0/claude_report.py to verify file content
 * 
 * Process:
 * 1. Save file to temporary location
 * 2. Call Python script with file path
 * 3. Parse JSON response
 * 4. Clean up temporary file
 * 5. Return verification result
 */
export class TeeService implements ITeeService {
  private readonly teeScriptPath: string;
  private readonly venvPythonPath: string;
  private readonly isWindows: boolean;
  private readonly useWSL: boolean;

  constructor() {
    // Get absolute path to tee_v0/claude_report.py
    const projectRoot = path.resolve(__dirname, '../../../..');
    this.teeScriptPath = path.join(projectRoot, 'tee_v0', 'claude_report.py');
    
    // Path to Python in virtual environment
    this.venvPythonPath = path.join(projectRoot, 'tee_v0', 'venv', 'bin', 'python3');
    
    this.isWindows = os.platform() === 'win32';
    this.useWSL = this.isWindows;

    // Verify script exists
    if (!fs.existsSync(this.teeScriptPath)) {
      console.warn(`[TeeService] Warning: TEE script not found at ${this.teeScriptPath}`);
    } else {
      console.log(`[TeeService] Initialized. Script: ${this.teeScriptPath}`);
    }

    // Check if venv exists
    if (fs.existsSync(this.venvPythonPath)) {
      console.log(`[TeeService] Virtual environment found: ${this.venvPythonPath}`);
    } else {
      console.warn(`[TeeService] Virtual environment not found. Will try system Python.`);
    }
  }

  async verifyFile(fileBuffer: Buffer, mimeType?: string): Promise<TeeVerificationResult> {
    // Only verify image files for now
    if (!mimeType || !mimeType.startsWith('image/')) {
      // For non-image files, assume safe (decision: true)
      console.log(`[TeeService] Skipping TEE verification for non-image file (${mimeType})`);
      return {
        weapon: false,
        description: 'Non-image file - not verified by TEE',
        decision: true, // Assume safe for non-images
      };
    }

    // Check if script exists
    if (!fs.existsSync(this.teeScriptPath)) {
      console.warn(`[TeeService] TEE script not found, skipping verification`);
      return {
        weapon: false,
        description: 'TEE script not available - verification skipped',
        decision: true, // Default to safe if TEE unavailable
      };
    }

    // Create temporary file
    const tempDir = os.tmpdir();
    const tempFileName = `tee_verify_${crypto.randomBytes(8).toString('hex')}.${this.getFileExtension(mimeType)}`;
    const tempFilePath = path.join(tempDir, tempFileName);

    try {
      // Write file to temp location
      fs.writeFileSync(tempFilePath, fileBuffer);
      console.log(`[TeeService] Created temp file: ${tempFilePath}`);

      // Determine script path (convert to WSL path if needed)
      let scriptPath = this.teeScriptPath;
      if (this.useWSL) {
        scriptPath = this.convertToWSLPath(this.teeScriptPath);
      }

      // Determine temp file path for Python script
      let pythonTempPath = tempFilePath;
      if (this.useWSL) {
        pythonTempPath = this.convertToWSLPath(tempFilePath);
      }

      // Build Python command - use wrapper script for WSL to avoid quote escaping issues
      let command: string;
      if (this.useWSL) {
        // Use wrapper script in WSL to handle paths and Python execution
        const projectRoot = path.resolve(__dirname, '../../../..');
        const wrapperScriptPath = path.join(projectRoot, 'tee_v0', 'verify_image.sh');
        const wrapperScriptWSL = this.convertToWSLPath(wrapperScriptPath);
        const scriptPathWSL = this.convertToWSLPath(scriptPath);
        const tempPathWSL = this.convertToWSLPath(pythonTempPath);
        // Get API key from environment
        const apiKey = process.env.ANTHROPIC_API_KEY || '';
        
        if (!apiKey) {
          console.error(`[TeeService] ❌ ANTHROPIC_API_KEY not found in environment!`);
          console.error(`[TeeService] Please set ANTHROPIC_API_KEY in Backend/.env or as environment variable`);
        } else {
          console.log(`[TeeService] ✅ ANTHROPIC_API_KEY found (${apiKey.substring(0, 10)}...)`);
        }
        
        // Use wrapper script with proper path escaping
        // Pass API key as argument to the script
        const apiKeyArg = apiKey ? apiKey : '';
        command = `wsl -d Ubuntu -- bash "${wrapperScriptWSL}" "${scriptPathWSL}" "${tempPathWSL}" "${apiKeyArg}"`;
      } else {
        // Native Linux - use venv if available
        if (fs.existsSync(this.venvPythonPath)) {
          command = `"${this.venvPythonPath}" "${scriptPath}" "${pythonTempPath}"`;
        } else {
          command = `python3 "${scriptPath}" "${pythonTempPath}" || python "${scriptPath}" "${pythonTempPath}"`;
        }
      }

      console.log(`[TeeService] Executing: ${command.substring(0, 200)}...`);
      
      // Debug: Check if API key is available
      const apiKeyEnv = process.env.ANTHROPIC_API_KEY;
      console.log(`[TeeService] ANTHROPIC_API_KEY in env: ${apiKeyEnv ? 'SET (' + apiKeyEnv.substring(0, 10) + '...)' : 'NOT SET'}`);

      // Pass environment variables to WSL, including ANTHROPIC_API_KEY
      const execEnv = {
        ...process.env,
        ANTHROPIC_API_KEY: apiKeyEnv || '',
      };

      const { stdout, stderr } = await execAsync(command, {
        maxBuffer: 10 * 1024 * 1024, // 10MB max output
        env: execEnv,
      });

      if (stderr && !stderr.includes('WARNING')) {
        console.warn(`[TeeService] stderr: ${stderr}`);
      }

      // Parse JSON response
      const cleanedOutput = this.cleanJsonOutput(stdout);
      const result = JSON.parse(cleanedOutput) as TeeVerificationResult;

      console.log(`[TeeService] Verification result:`, {
        weapon: result.weapon,
        decision: result.decision,
        description: result.description.substring(0, 100),
      });

      return result;
    } catch (error: any) {
      console.error(`[TeeService] Error verifying file:`, error.message);
      console.error(`[TeeService] Full error:`, error);
      
      // If TEE verification fails, we should NOT default to safe
      // Instead, mark as unsafe to prevent illegal content from passing
      return {
        weapon: true, // Assume weapon detected if verification fails
        description: `TEE verification failed: ${error.message}. File cannot be verified and is marked as unsafe.`,
        decision: false, // Mark as unsafe on error (fail-secure approach)
      };
    } finally {
      // Clean up temp file
      try {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
          console.log(`[TeeService] Cleaned up temp file: ${tempFilePath}`);
        }
      } catch (cleanupError) {
        console.warn(`[TeeService] Failed to cleanup temp file:`, cleanupError);
      }
    }
  }

  /**
   * Convert Windows path to WSL path
   */
  private convertToWSLPath(windowsPath: string): string {
    if (!this.isWindows) return windowsPath;
    
    const driveMatch = windowsPath.match(/^([A-Z]):/i);
    if (!driveMatch) {
      return windowsPath;
    }
    
    const drive = driveMatch[1].toLowerCase();
    const restOfPath = windowsPath.substring(2).replace(/\\/g, '/');
    return `/mnt/${drive}${restOfPath}`;
  }


  /**
   * Get file extension from MIME type
   */
  private getFileExtension(mimeType: string): string {
    const mimeMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
    };
    return mimeMap[mimeType] || 'jpg';
  }

  /**
   * Clean JSON output (remove markdown fences, etc.)
   */
  private cleanJsonOutput(raw: string): string {
    let cleaned = raw.trim();
    
    // Remove markdown code fences
    if (cleaned.startsWith('```')) {
      const lines = cleaned.split('\n');
      if (lines[0].startsWith('```')) {
        lines.shift();
      }
      if (lines[lines.length - 1].startsWith('```')) {
        lines.pop();
      }
      cleaned = lines.join('\n').trim();
      
      // Remove 'json' tag if present
      if (cleaned.toLowerCase().startsWith('json')) {
        cleaned = cleaned.substring(4).trim();
      }
    }
    
    return cleaned;
  }
}

