import { exec } from 'child_process';
import { promisify } from 'util';
import { IWalrusService, WalrusUploadResult, WalrusBlobStatus } from '../../domain/services/IWalrusService';
import * as crypto from 'crypto';
import * as os from 'os';

const execAsync = promisify(exec);

/**
 * Walrus Service Implementation
 * Uses Walrus CLI for blob operations
 * Supports WSL on Windows
 * Falls back to demo mode if Walrus CLI is not available
 * 
 * For production, this could be replaced with a direct HTTP API client
 * if Walrus provides an SDK or REST API
 */
export class WalrusService implements IWalrusService {
  private walrusCLIAvailable: boolean | null = null; // null = not checked yet
  private demoBlobs: Map<string, Buffer> = new Map(); // Store demo blobs in memory
  private readonly isWindows: boolean;
  private readonly useWSL: boolean;
  private readonly network: 'testnet' | 'mainnet' | 'devnet';

  constructor(network: 'testnet' | 'mainnet' | 'devnet' = 'testnet') {
    this.isWindows = os.platform() === 'win32';
    // Even if launched from WSL terminal, Node.js runs in Windows environment
    // So we need to use 'wsl' prefix to execute commands in WSL
    this.useWSL = this.isWindows;
    
    this.network = network;
    
    if (this.useWSL) {
      console.log(`ℹ️  WalrusService initialized. Detected Windows environment.`);
      console.log(`   Will use 'wsl' prefix to execute Walrus CLI commands in WSL.`);
    } else {
      console.log(`ℹ️  WalrusService initialized. Running in native Linux environment.`);
      console.log(`   Will use Walrus CLI directly.`);
    }
    console.log(`🌐 Network: ${this.network.toUpperCase()}`);
    console.log(`📋 IMPORTANT: Ensure Walrus CLI is configured for ${this.network}`);
    console.log(`   Run in WSL: walrus info (should show ${this.network} info)`);
  }

  /**
   * Convert Windows path to WSL path
   * C:\Users\... -> /mnt/c/Users/...
   */
  private convertToWSLPath(windowsPath: string): string {
    if (!this.isWindows) return windowsPath;
    
    // Get the drive letter
    const driveMatch = windowsPath.match(/^([A-Z]):/i);
    if (!driveMatch) {
      // Already a WSL path or relative path
      return windowsPath;
    }
    
    const drive = driveMatch[1].toLowerCase();
    const restOfPath = windowsPath.substring(2).replace(/\\/g, '/');
    
    // Convert: C:\Users\... -> /mnt/c/Users/...
    return `/mnt/${drive}${restOfPath}`;
  }

  /**
   * Get the command prefix for executing Walrus CLI
   * On Windows, use WSL with -d Ubuntu to specify the distribution
   */
  private getWalrusCommand(command: string): string {
    if (this.useWSL) {
      // Use wsl -d Ubuntu -- bash -c to specify the distribution and ensure bash is used
      // Load PATH from .bashrc/.profile, then execute the command
      // Escape quotes in the command for proper shell execution
      const escapedCommand = command.replace(/"/g, '\\"');
      // Use -d Ubuntu to specify the WSL distribution, -- to separate options from command
      const fullCommand = `wsl -d Ubuntu -- bash -c "source ~/.bashrc 2>/dev/null || true; source ~/.profile 2>/dev/null || true; ${escapedCommand}"`;
      console.log(`[WalrusService] WSL command: ${fullCommand}`);
      return fullCommand;
    }
    // Native Linux - use command directly
    console.log(`[WalrusService] Direct command: ${command}`);
    return command;
  }

  /**
   * Check if Walrus CLI is actually available (async)
   * Also verifies that it's configured for the correct network (testnet)
   */
  private async checkWalrusCLI(): Promise<boolean> {
    // Cache the result
    if (this.walrusCLIAvailable !== null) {
      console.log(`🔵 [WalrusService] Using cached CLI availability: ${this.walrusCLIAvailable}`);
      return this.walrusCLIAvailable;
    }

    console.log(`🔵 [WalrusService] Checking Walrus CLI availability for the first time...`);
    console.log(`   Platform: ${this.isWindows ? 'Windows' : 'Linux/Mac'}`);
    console.log(`   Use WSL: ${this.useWSL}`);

    try {
      // Try to execute walrus --version (via WSL on Windows, or directly on Linux)
      // Use wsl -d Ubuntu -- bash -c to specify the distribution and load user PATH from .bashrc/.profile
      const command = this.useWSL 
        ? 'wsl -d Ubuntu -- bash -c "source ~/.bashrc 2>/dev/null || true; source ~/.profile 2>/dev/null || true; walrus --version"'
        : 'walrus --version';
      console.log(`   Testing command: ${command}`);
      const { stdout, stderr } = await execAsync(command, { 
        timeout: 10000,
      });
      
      console.log(`   Command stdout: ${stdout.substring(0, 200)}`);
      if (stderr) {
        console.log(`   Command stderr: ${stderr.substring(0, 200)}`);
      }
      
      // If command succeeds, Walrus CLI is available
      this.walrusCLIAvailable = true;
      console.log('✅ Walrus CLI detected via WSL. Using real Walrus storage.');
      if (stdout) {
        console.log(`   Version info: ${stdout.substring(0, 100)}`);
      }

      // Verify network configuration
      try {
        const infoCommand = this.useWSL 
          ? 'wsl -d Ubuntu -- bash -c "source ~/.bashrc 2>/dev/null || true; source ~/.profile 2>/dev/null || true; walrus info"'
          : 'walrus info';
        const { stdout: infoOutput } = await execAsync(infoCommand, { timeout: 10000 });
        console.log('📊 Walrus network info:');
        console.log(infoOutput.substring(0, 300));
        
        // Check if testnet is configured (look for testnet indicators)
        const isTestnet = infoOutput.toLowerCase().includes('testnet') || 
                         infoOutput.toLowerCase().includes('epoch duration: 1day') ||
                         infoOutput.toLowerCase().includes('testnet');
        
        if (this.network === 'testnet' && !isTestnet) {
          console.warn('⚠️  WARNING: Walrus CLI may not be configured for TESTNET!');
          console.warn('   Expected testnet indicators not found in "walrus info" output.');
          console.warn('   Please ensure Walrus is configured for testnet:');
          console.warn('   1. Run: walrus info');
          console.warn('   2. Should show: "Epoch duration: 1day" (indicates testnet)');
          console.warn('   3. If not, configure: https://docs.wal.app/usage/started.html');
        }
      } catch (infoError) {
        console.warn('⚠️  Could not verify Walrus network configuration:', infoError);
      }
      
      return true;
    } catch (error: any) {
      console.error(`❌ [WalrusService] Error checking Walrus CLI:`);
      console.error(`   Error code: ${error.code}`);
      console.error(`   Error message: ${error.message}`);
      console.error(`   Error stdout: ${error.stdout || 'none'}`);
      console.error(`   Error stderr: ${error.stderr || 'none'}`);
      
      // Check if it's a timeout or command not found
      const isNotFound = error.code === 'ENOENT' || 
                        error.message.includes('n\'est pas reconnu') ||
                        error.message.includes('not found') ||
                        error.message.includes('command not found') ||
                        (error.stderr && error.stderr.includes('not found'));
      
      if (isNotFound) {
        this.walrusCLIAvailable = false;
        console.warn('\n⚠️  Walrus CLI not found in WSL. Running in DEMO MODE (blobs stored in memory only).');
        console.warn('   To use real Walrus storage:');
        console.warn('   1. Open WSL terminal');
        console.warn('   2. Install Walrus CLI in WSL: https://walrus.xyz');
        console.warn('   3. Configure for TESTNET: https://docs.wal.app/usage/started.html');
        console.warn('   4. Ensure walrus is in WSL PATH');
        console.warn('   5. Test in WSL: walrus --version && walrus info');
        console.warn('   6. Test from Windows PowerShell: wsl walrus --version');
        console.warn('   7. If step 6 works, the backend should detect it automatically\n');
        return false;
      }
      
      // Other errors (timeout, etc.) - assume not available
      this.walrusCLIAvailable = false;
      console.warn('\n⚠️  Could not verify Walrus CLI. Running in DEMO MODE.');
      console.warn(`   Error type: ${error.constructor.name}`);
      console.warn(`   Error message: ${error.message}`);
      if (error.stderr) {
        console.warn(`   Stderr: ${error.stderr.substring(0, 500)}`);
      }
      if (error.stdout) {
        console.warn(`   Stdout: ${error.stdout.substring(0, 500)}`);
      }
      console.warn('');
      return false;
    }
  }

  isEnabled(): boolean {
    // Always enabled (will use demo mode if CLI not available)
    return true;
  }

  /**
   * Upload a file to Walrus using CLI
   */
  async uploadBlob(filePath: string): Promise<WalrusUploadResult> {
    const logs: string[] = [];
    const addLog = (message: string) => {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] ${message}`;
      logs.push(logMessage);
      console.log(message);
    };

    addLog(`🔵 [WalrusService] uploadBlob called for: ${filePath}`);
    
    // Check if Walrus CLI is actually available
    addLog(`🔵 [WalrusService] Checking Walrus CLI availability...`);
    const walrusAvailable = await this.checkWalrusCLI();
    addLog(`🔵 [WalrusService] Walrus CLI available: ${walrusAvailable}`);

    // Demo mode: Generate fake blob ID
    if (!walrusAvailable) {
      addLog(`⚠️  [WalrusService] DEMO MODE - Walrus CLI not available!`);
      addLog(`⚠️  This blob will NOT be stored on Walrus and will NOT be visible on walruscan.com`);
      const fs = await import('fs/promises');
      const fileBuffer = await fs.readFile(filePath);
      const stats = await fs.stat(filePath);
      
      // Generate a demo blob ID (format: wblb...)
      const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      const blobId = `wblb${hash.substring(0, 40)}`;
      
      // Store in memory for demo
      this.demoBlobs.set(blobId, fileBuffer);
      
      addLog(`[DEMO MODE] Uploaded blob: ${blobId} (${stats.size} bytes)`);
      addLog(`⚠️  WARNING: This is a DEMO blob - it's NOT on Walrus testnet!`);
      
      return {
        blobId,
        size: stats.size,
        certified: true, // Demo mode always "certified"
        logs,
      };
    }
    
    addLog(`✅ [WalrusService] Using REAL Walrus CLI - blob will be stored on testnet`);

    // Real Walrus CLI mode
    try {
      // Convert Windows path to WSL path if needed
      const walrusPath = this.useWSL ? this.convertToWSLPath(filePath) : filePath;
      
      // Execute: walrus store --epochs <EPOCHS> <filePath> (via WSL on Windows)
      // Note: Network is configured globally in Walrus (via walrus info/config), not per command
      // According to Walrus docs: walrus store requires --epochs, --earliest-expiry-time, or --end-epoch
      // Use 1 epoch (minimum) to reduce cost - can be increased later if needed
      // Cost is proportional to epochs, so 1 epoch is much cheaper than 50
      const command = this.getWalrusCommand(`walrus store --epochs 1 "${walrusPath}"`);
      
      addLog(`\n🔵 [WalrusService] Executing Walrus command:`);
      addLog(`   Command: ${command}`);
      addLog(`   File path (original): ${filePath}`);
      addLog(`   File path (WSL): ${walrusPath}`);
      addLog(`   Network: ${this.network.toUpperCase()}`);
      
      let stdout: string;
      let stderr: string;
      
      try {
        const result = await execAsync(command, {
          timeout: 120000, // 2 minutes timeout for large files
        });
        stdout = result.stdout;
        stderr = result.stderr;
      } catch (execError: any) {
        // execAsync throws an error if the command exits with non-zero code
        stdout = execError.stdout || '';
        stderr = execError.stderr || execError.message || '';
        
        // Check for WAL coins error specifically
        const errorOutput = (stdout + ' ' + stderr).toLowerCase();
        if (errorOutput.includes('wal coins') || errorOutput.includes('sufficient balance') || errorOutput.includes('could not find wal coins')) {
          const errorMsg = stderr.match(/Error:.*/)?.[0] || stdout.match(/Error:.*/)?.[0] || 'Insufficient WAL coins balance';
          throw new Error(`Insufficient WAL coins: Your Sui wallet does not have enough WAL tokens to store blobs on Walrus testnet. Please fund your wallet with WAL coins. ${errorMsg}`);
        }
        
        // Re-throw with more context
        throw new Error(`Walrus CLI command failed: ${stderr || execError.message || 'Unknown error'}`);
      }

      // Log full output for debugging - CRITICAL for troubleshooting
      addLog('\n=== WALRUS STORE OUTPUT ===');
      addLog(`STDOUT: ${stdout}`);
      if (stderr) {
        addLog(`STDERR: ${stderr}`);
      }
      addLog(`STDOUT length: ${stdout.length}`);
      addLog(`STDERR length: ${stderr.length}`);
      addLog('==========================\n');

      // Check for errors in output FIRST - before trying to parse blob ID
      // stderr might contain warnings, but errors are critical
      const combinedOutput = (stdout + ' ' + stderr).toLowerCase();
      
      // Check for WAL coins error specifically (most common issue)
      if (combinedOutput.includes('wal coins') || 
          combinedOutput.includes('sufficient balance') || 
          combinedOutput.includes('could not find wal coins') ||
          combinedOutput.includes('insufficient')) {
        const errorMsg = stderr.match(/Error:.*/)?.[0] || 
                        stdout.match(/Error:.*/)?.[0] || 
                        stderr.match(/could not find.*/i)?.[0] ||
                        'Insufficient WAL coins balance';
        throw new Error(`Insufficient WAL coins: Your Sui wallet does not have enough WAL tokens to store blobs on Walrus testnet. Please fund your wallet with WAL coins. To get WAL coins, visit the Walrus faucet or exchange. Error details: ${errorMsg}`);
      }
      
      // Check for other errors
      if (stderr) {
        const hasError = stderr.toLowerCase().includes('error') || 
                        stderr.toLowerCase().includes('failed') ||
                        stderr.toLowerCase().includes('not found') ||
                        stderr.toLowerCase().includes('cannot');
        if (hasError && !stderr.toLowerCase().includes('success')) {
          throw new Error(`Walrus upload failed: ${stderr}`);
        }
      }

      // Parse output to extract blob ID
      // Walrus CLI outputs blob ID in various formats - try multiple patterns
      // Format 1: "Blob ID: wblb..."
      // Format 2: "wblb..." (just the ID)
      // Format 3: "Successfully stored: wblb..."
      // Format 4: JSON output: {"blob_id": "wblb..."}
      let blobId: string | null = null;
      
      // Try JSON first (if Walrus outputs JSON)
      try {
        const jsonMatch = stdout.match(/\{[\s\S]*?"blob[_-]?id"[\s:]*"([^"]+)"[\s\S]*?\}/i);
        if (jsonMatch) {
          blobId = jsonMatch[1];
        }
      } catch {}

      // Try various text patterns
      // Walrus can output blob IDs in different formats:
      // - wblb... (hex format)
      // - Base64 encoded (for testnet/mainnet)
      // - Object ID format
      if (!blobId) {
        const patterns = [
          /blob[_\s-]?id[:\s]+(wblb[a-zA-Z0-9]+)/i,
          /blob[_\s-]?id[:\s]+([a-zA-Z0-9_-]{20,})/i, // Base64 or other formats
          /(?:stored|uploaded|created)[:\s]+(wblb[a-zA-Z0-9]+)/i,
          /(?:stored|uploaded|created)[:\s]+([a-zA-Z0-9_-]{20,})/i, // Base64 format
          /(wblb[a-zA-Z0-9]{40,})/i, // Match wblb followed by 40+ alphanumeric chars
          /([a-zA-Z0-9_-]{20,})/i, // Generic pattern for base64-like IDs (20+ chars)
        ];
        
        for (const pattern of patterns) {
          const match = stdout.match(pattern) || stderr.match(pattern);
          if (match) {
            const candidate = match[1] || match[0];
            // Filter out obvious non-blob-IDs (like "Successfully", "stored", etc.)
            if (candidate.length >= 20 && 
                !candidate.toLowerCase().includes('success') &&
                !candidate.toLowerCase().includes('stored') &&
                !candidate.toLowerCase().includes('blob')) {
              blobId = candidate;
              break;
            }
          }
        }
      }
      
      if (!blobId) {
        // Log the actual output for debugging
        addLog('\n❌ ERROR: Could not extract blob ID from Walrus output!');
        addLog(`Full STDOUT: ${stdout}`);
        if (stderr) {
          addLog(`Full STDERR: ${stderr}`);
        }
        addLog('\nTrying to help debug...');
        addLog(`STDOUT lines: ${stdout.split('\n').join(' | ')}`);
        if (stderr) {
          addLog(`STDERR lines: ${stderr.split('\n').join(' | ')}`);
        }
        throw new Error(`Could not extract blob ID from Walrus output. Please check Walrus CLI is working correctly. Output: ${stdout.substring(0, 500)}`);
      }

      addLog(`\n✅ SUCCESS: Extracted blob ID: ${blobId}`);
      addLog(`✅ Blob ID length: ${blobId.length} characters`);
      addLog(`✅ Blob ID format: ${blobId.startsWith('wblb') ? 'wblb (hex)' : 'base64/other'}`);
      addLog(`✅ View on testnet: https://walruscan.com/testnet/blob/${blobId}`);

      // Get file size from filesystem (more reliable than parsing output)
      const fs = await import('fs/promises');
      const stats = await fs.stat(filePath);
      const size = stats.size;

      // Check if certified (usually indicated in output)
      const certified = stdout.toLowerCase().includes('certified') || 
                       stdout.toLowerCase().includes('certificate') ||
                       stderr.toLowerCase().includes('certified');

      return {
        blobId,
        size,
        certified,
        logs,
      };
    } catch (error: any) {
      // Check for WAL coins error in the error message/stderr
      const errorMessage = (error.message || '').toLowerCase();
      const errorStderr = (error.stderr || '').toLowerCase();
      const errorStdout = (error.stdout || '').toLowerCase();
      const combinedError = (errorMessage + ' ' + errorStderr + ' ' + errorStdout).toLowerCase();
      
      if (combinedError.includes('wal coins') || 
          combinedError.includes('sufficient balance') || 
          combinedError.includes('could not find wal coins') ||
          combinedError.includes('insufficient')) {
        const errorMsg = error.stderr?.match(/Error:.*/)?.[0] || 
                        error.stdout?.match(/Error:.*/)?.[0] || 
                        error.stderr?.match(/could not find.*/i)?.[0] ||
                        error.message ||
                        'Insufficient WAL coins balance';
        throw new Error(`Insufficient WAL coins: Your Sui wallet does not have enough WAL tokens to store blobs on Walrus testnet. Please fund your wallet with WAL coins. To get WAL coins, visit the Walrus faucet or exchange. Error details: ${errorMsg}`);
      }
      
      // DO NOT fallback to demo mode if CLI is available - this is a real error
      if (error.code === 'ENOENT' || error.message.includes('n\'est pas reconnu') || error.message.includes('not found')) {
        // Only fallback if CLI is truly not found
        if (this.walrusCLIAvailable === false) {
          console.warn('⚠️  Walrus CLI not found, falling back to demo mode');
          return this.uploadBlob(filePath); // Retry in demo mode
        }
      }
      console.error('❌ Walrus upload error:', error);
      throw new Error(`Failed to upload to Walrus: ${error.message}`);
    }
  }

  /**
   * Upload a buffer to Walrus
   * Creates a temporary file, uploads it, then deletes it
   */
  async uploadBuffer(buffer: Buffer, filename: string = 'blob'): Promise<WalrusUploadResult> {
    const fs = await import('fs/promises');
    const path = await import('path');
    const os = await import('os');

    // Create temporary file
    const tempDir = os.tmpdir();
    // Sanitize filename for filesystem
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const tempFile = path.join(tempDir, `sirius-${Date.now()}-${sanitizedFilename}`);

    try {
      // Write buffer to temp file
      await fs.writeFile(tempFile, buffer);

      // Upload the temp file
      const result = await this.uploadBlob(tempFile);

      return result;
    } catch (error: any) {
      // Provide more context in error message
      if (error.message.includes('ENOENT') || error.message.includes('not found')) {
        throw new Error('Walrus CLI not found. Please install Walrus CLI and ensure it is in your PATH. Visit https://walrus.xyz for installation instructions.');
      }
      throw error;
    } finally {
      // Clean up temp file
      try {
        await fs.unlink(tempFile);
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Get blob status from Walrus
   */
  async getBlobStatus(blobId: string): Promise<WalrusBlobStatus> {
    // Check if this is a demo blob ID (starts with wblb and is 40+ chars hex)
    // Demo blobs have format: wblb + 40 hex chars
    const isDemoBlobId = blobId.startsWith('wblb') && blobId.length === 44 && /^wblb[a-f0-9]{40}$/i.test(blobId);
    
    if (isDemoBlobId) {
      console.warn(`⚠️  [WalrusService] Blob ID ${blobId} appears to be a demo blob ID. Demo blobs are not stored on Walrus.`);
      return {
        blobId,
        size: 0,
        certified: false,
        status: 'error',
      };
    }

    // Check if we're in demo mode
    const walrusAvailable = await this.checkWalrusCLI();
    
    // Demo mode: Check in-memory storage
    if (!walrusAvailable) {
      const blob = this.demoBlobs.get(blobId);
      if (blob) {
        return {
          blobId,
          size: blob.length,
          certified: true,
          status: 'available',
        };
      }
      return {
        blobId,
        size: 0,
        certified: false,
        status: 'error',
      };
    }

    // Real Walrus CLI mode
    try {
      // Execute: walrus blob-status --blob-id <blobId> (via WSL on Windows)
      // Note: Network is configured globally in Walrus, not per command
      // According to Walrus docs: walrus blob-status --blob-id <BLOB_ID>
      const command = this.getWalrusCommand(`walrus blob-status --blob-id "${blobId}"`);
      const { stdout, stderr } = await execAsync(command, {
        timeout: 10000,
      });

      console.log(`[Walrus] blob-status for ${blobId}:`, stdout);

      // Check for errors
      if (stderr && !stderr.toLowerCase().includes('status') && !stderr.toLowerCase().includes('available')) {
        const hasError = stderr.toLowerCase().includes('error') || 
                        stderr.toLowerCase().includes('not found') ||
                        stderr.toLowerCase().includes('failed');
        if (hasError) {
          throw new Error(`Walrus status check failed: ${stderr}`);
        }
      }

      // Parse output - try multiple formats
      let size = 0;
      let certified = false;
      let available = false;

      // Try to extract size
      const sizeMatch = stdout.match(/size[:\s]+(\d+)/i) || stdout.match(/(\d+)\s*bytes?/i);
      if (sizeMatch) {
        size = parseInt(sizeMatch[1], 10);
      }

      // Check status indicators
      certified = stdout.toLowerCase().includes('certified') || 
                  stderr.toLowerCase().includes('certified');
      available = stdout.toLowerCase().includes('available') || 
                  stdout.toLowerCase().includes('stored') ||
                  stdout.toLowerCase().includes('certified') ||
                  !stdout.toLowerCase().includes('not found');

      return {
        blobId,
        size,
        certified,
        status: available ? 'available' : 'pending',
      };
    } catch (error: any) {
      console.error(`[Walrus] Error checking blob status for ${blobId}:`, error.message);
      // Don't fallback to demo if CLI is available - return error status
      return {
        blobId,
        size: 0,
        certified: false,
        status: 'error',
      };
    }
  }

  /**
   * Download blob content from Walrus
   * Note: This might require additional Walrus CLI commands or API
   */
  async downloadBlob(blobId: string): Promise<Buffer> {
    const walrusAvailable = await this.checkWalrusCLI();
    
    // Demo mode: Return from memory
    if (!walrusAvailable) {
      const blob = this.demoBlobs.get(blobId);
      if (blob) {
        return blob;
      }
      throw new Error(`Blob not found: ${blobId}`);
    }

    try {
      // For now, we'll use a placeholder approach
      // In production, this would use: walrus retrieve <blobId> --output <file>
      // or a direct HTTP API call to Walrus gateway

      // Try to retrieve via CLI if available
      const tempDir = await import('os').then(m => m.tmpdir());
      const path = await import('path');
      const fs = await import('fs/promises');
      const tempFile = path.join(tempDir, `sirius-download-${Date.now()}`);

      try {
        // Convert Windows path to WSL path if needed
        const wslTempFile = this.useWSL ? this.convertToWSLPath(tempFile) : tempFile;
        
        // Execute: walrus read <blobId> --out <tempFile> (via WSL on Windows)
        // Note: Network is configured globally in Walrus, not per command
        // According to Walrus docs: walrus read <BLOB_ID> --out <file>
        const command = this.getWalrusCommand(`walrus read "${blobId}" --out "${wslTempFile}"`);
        const { stdout, stderr } = await execAsync(command, {
          timeout: 60000, // 1 minute timeout
        });

        console.log(`[Walrus] read output for ${blobId}:`, stdout);
        if (stderr) {
          console.log(`[Walrus] read stderr:`, stderr);
        }

        // Check for errors
        if (stderr && (stderr.toLowerCase().includes('error') || stderr.toLowerCase().includes('not found'))) {
          throw new Error(`Walrus read failed: ${stderr}`);
        }

        // Read the downloaded file
        const buffer = await fs.readFile(tempFile);

        // Clean up
        await fs.unlink(tempFile);

        return buffer;
      } catch (error: any) {
        console.error(`[Walrus] Error downloading blob ${blobId}:`, error.message);
        throw new Error(`Blob download failed: ${error.message}`);
      }
    } catch (error: any) {
      throw new Error(`Failed to download blob: ${error.message}`);
    }
  }

  /**
   * Burn/Delete a blob from Walrus
   * Uses: walrus delete --blob-id <blobId>
   */
  async burnBlob(blobId: string): Promise<void> {
    const walrusAvailable = await this.checkWalrusCLI();
    
    // Demo mode: Remove from memory
    if (!walrusAvailable) {
      if (this.demoBlobs.has(blobId)) {
        this.demoBlobs.delete(blobId);
        console.log(`[DEMO MODE] Burned blob: ${blobId}`);
        return;
      }
      throw new Error('Blob not found in demo storage');
    }

    // Real Walrus CLI mode
    try {
      // Note: walrus status doesn't exist, so we need to get ObjectID from the blob metadata
      // The ObjectID is stored in the cache when the blob is uploaded
      // For now, we'll try to use walrus read with --metadata flag, or use the blobId directly if it's an ObjectID
      console.log(`[Walrus] Attempting to burn blob: ${blobId}`);
      
      let objectId: string | null = null;
      
      // If blobId is already an ObjectID (starts with 0x), use it directly
      if (blobId.startsWith('0x')) {
        objectId = blobId;
        console.log(`[Walrus] Using blobId as ObjectID: ${objectId}`);
      } else {
        // Try to get ObjectID from walrus read output (it might contain metadata)
        // Note: This is a workaround - ideally ObjectID should be stored in cache during upload
        try {
          const tempFile = require('os').tmpdir() + '/' + require('crypto').randomBytes(8).toString('hex');
          const readCommand = this.getWalrusCommand(`walrus read "${blobId}" --out "${this.useWSL ? this.convertToWSLPath(tempFile) : tempFile}"`);
          const { stdout: readStdout, stderr: readStderr } = await execAsync(readCommand, {
            timeout: 30000,
          });
          
          // Parse ObjectID from read output (if available)
          const output = readStdout || readStderr || '';
          const objectIdMatch = output.match(/Sui object ID:\s*(0x[a-fA-F0-9]+)/i);
          if (objectIdMatch) {
            objectId = objectIdMatch[1];
            console.log(`[Walrus] Found ObjectID from read output: ${objectId}`);
          }
        } catch (readError: any) {
          console.warn(`[Walrus] Could not get ObjectID from read: ${readError.message}`);
        }
        
        // If still no ObjectID, we can't burn the blob
        if (!objectId) {
          throw new Error(`Could not determine ObjectID for blob ${blobId}. The ObjectID should be stored in cache during upload. For now, only blobs with ObjectID format (0x...) can be burned.`);
        }
      }

      // Now burn using ObjectID
      let command = this.getWalrusCommand(`walrus burn-blobs --object-ids "${objectId}"`);
      let { stdout, stderr } = await execAsync(command, {
        timeout: 30000, // 30 seconds timeout
      });

      console.log(`[Walrus] burn output for ${blobId}:`, stdout);
      if (stderr) {
        console.log(`[Walrus] burn stderr:`, stderr);
      }

      // Check for errors
      if (stderr && !stderr.toLowerCase().includes('success') && !stderr.toLowerCase().includes('burned') && !stderr.toLowerCase().includes('deleted')) {
        const hasError = stderr.toLowerCase().includes('error') || 
                        stderr.toLowerCase().includes('failed') ||
                        (stderr.toLowerCase().includes('not found') && !stdout.toLowerCase().includes('success'));
        if (hasError) {
          throw new Error(`Walrus burn failed: ${stderr}`);
        }
      }

      console.log(`✅ Successfully burned blob: ${blobId}`);
      if (stdout) {
        console.log(`   Output: ${stdout.substring(0, 200)}`);
      }
    } catch (error: any) {
      if (error.code === 'ENOENT' || error.message.includes('n\'est pas reconnu')) {
        throw new Error('Walrus CLI not found. Please install Walrus CLI and ensure it is in your PATH.');
      }
      console.error(`[Walrus] Error burning blob ${blobId}:`, error.message);
      throw new Error(`Failed to burn blob: ${error.message}`);
    }
  }
}

