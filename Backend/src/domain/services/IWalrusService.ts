/**
 * Interface for Walrus storage service
 * Handles upload and retrieval of blobs to/from Walrus distributed storage
 */
export interface IWalrusService {
  /**
   * Upload a file to Walrus and return the blob ID
   */
  uploadBlob(filePath: string): Promise<WalrusUploadResult>;

  /**
   * Upload a buffer to Walrus and return the blob ID
   */
  uploadBuffer(buffer: Buffer, filename?: string): Promise<WalrusUploadResult>;

  /**
   * Retrieve blob metadata from Walrus
   */
  getBlobStatus(blobId: string): Promise<WalrusBlobStatus>;

  /**
   * Download blob content from Walrus
   */
  downloadBlob(blobId: string): Promise<Buffer>;

  /**
   * Burn/Delete a blob from Walrus
   * This permanently deletes the blob and frees storage space
   */
  burnBlob(blobId: string): Promise<void>;

  /**
   * Check if Walrus service is available
   */
  isEnabled(): boolean;
}

export interface WalrusUploadResult {
  blobId: string; // e.g., "wblb..."
  size: number;
  certified: boolean;
  url?: string; // Optional gateway URL
  logs?: string[]; // Upload logs for debugging
}

export interface WalrusBlobStatus {
  blobId: string;
  size: number;
  certified: boolean;
  status: 'available' | 'pending' | 'error';
  createdAt?: Date;
}

