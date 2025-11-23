/**
 * API Service for Sirius Data Layer
 * Handles all HTTP requests to the backend API
 */

// Backend runs on port 3001 (check Backend/.env PORT=3001)
// Frontend should use VITE_API_URL env var or default to 3001
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface ApiError {
  error: {
    message: string;
    statusCode: number;
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: {
        message: `HTTP ${response.status}: ${response.statusText}`,
        statusCode: response.status,
      },
    }));
    throw new Error(error.error.message);
  }
  return response.json();
}

export const api = {
  // ============ REPOSITORIES (Move-first) ============

  /**
   * Prepare transaction to create a repository
   * Returns transaction bytes for frontend signing
   */
  async prepareCreateRepo(data: {
    ownerAddress: string;
    name?: string;
    description?: string;
    collaborators?: string[];
  }): Promise<{
    transactionBytes: string;
    sealedRmkBlobId: string;
    message: string;
  }> {
    const response = await fetch(`${API_BASE_URL}/repos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    const result = await handleResponse<{ data: { transactionBytes: string; sealedRmkBlobId: string; message: string } }>(response);
    return result.data;
  },

  /**
   * Execute signed create_repo transaction
   */
  async executeCreateRepo(data: {
    transactionBytes: string;
    signature: string;
    publicKey: string;
    signerAddress: string;
    sealedRmkBlobId: string;
    name?: string;
    description?: string;
  }): Promise<{
    repoObjectId: string;
    transactionHash: string;
    suiscanUrl: string;
    repoSuiscanUrl: string;
  }> {
    const response = await fetch(`${API_BASE_URL}/repos/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    const result = await handleResponse<{ data: any }>(response);
    return result.data;
  },

  /**
   * Get all repositories for an owner
   */
  async getRepos(ownerAddress: string): Promise<{ repos: any[] }> {
    const response = await fetch(`${API_BASE_URL}/repos?ownerAddress=${encodeURIComponent(ownerAddress)}`);
    const result = await handleResponse<{ data: any[] }>(response);
    // Backend returns { success: true, data: repos[] }
    // Frontend expects { repos: [...] }
    return { repos: result.data || [] };
  },

  /**
   * Upload a file to a repository
   * This uploads to Walrus and creates a manifest entry in one call
   */
  async uploadFileToRepo(
    repoObjectId: string,
    file: File,
    callerAddress: string
  ): Promise<{
    blobId: string;
    manifestEntryId: string;
    walrusUrl: string;
  }> {
    // Convert file to base64 (browser-compatible)
    const fileBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(fileBuffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64Content = btoa(binary);

    const response = await fetch(`${API_BASE_URL}/repos/${repoObjectId}/files`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file: {
          filename: file.name,
          content: base64Content,
          mimeType: file.type || 'application/octet-stream',
        },
        callerAddress,
      }),
    });
    const result = await handleResponse<{ data: any }>(response);
    return result.data;
  },

  /**
   * Get repository info
   */
  async getRepo(repoObjectId: string): Promise<{ cached: any; sui: any }> {
    const response = await fetch(`${API_BASE_URL}/repos/${repoObjectId}`);
    const result = await handleResponse<{ data: any }>(response);
    return result.data;
  },

  /**
   * Prepare transaction to delete a repository (soft delete)
   */
  async prepareDeleteRepo(data: {
    repoObjectId: string;
    signerAddress: string;
  }): Promise<{
    transactionBytes: string;
    message: string;
  }> {
    const response = await fetch(`${API_BASE_URL}/repos/${data.repoObjectId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ signerAddress: data.signerAddress }),
    });
    const result = await handleResponse<{ data: any }>(response);
    return result.data;
  },

  /**
   * Execute signed delete_repo transaction
   */
  async executeDeleteRepo(data: {
    repoObjectId: string;
    transactionBytes: string;
    signature: string;
    publicKey: string;
    signerAddress: string;
  }): Promise<{
    transactionHash: string;
    suiscanUrl: string;
    message: string;
  }> {
    const response = await fetch(`${API_BASE_URL}/repos/${data.repoObjectId}/execute`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transactionBytes: data.transactionBytes,
        signature: data.signature,
        publicKey: data.publicKey,
        signerAddress: data.signerAddress,
      }),
    });
    const result = await handleResponse<{ data: any }>(response);
    return result.data;
  },

  /**
   * Prepare transaction to commit staged files
   */
  async prepareCommit(data: {
    repoObjectId: string;
    authorAddress: string;
    note?: string;
  }): Promise<{
    transactionBytes: string;
    manifestBlobId: string;
    merkleRoot: string;
    parentCommitId: string | null;
    message: string;
  }> {
    const response = await fetch(`${API_BASE_URL}/repos/${data.repoObjectId}/commit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        authorAddress: data.authorAddress,
        note: data.note,
      }),
    });
    const result = await handleResponse<{ data: any }>(response);
    return result.data;
  },

  /**
   * Execute signed push_commit transaction
   */
  async executeCommit(data: {
    repoObjectId: string;
    transactionBytes: string;
    signature: string;
    publicKey: string;
    signerAddress: string;
    manifestBlobId: string;
    merkleRoot: string;
    parentCommitId: string | null;
  }): Promise<{
    commitObjectId: string;
    transactionHash: string;
    suiscanUrl: string;
    commitSuiscanUrl: string;
  }> {
    const response = await fetch(`${API_BASE_URL}/repos/${data.repoObjectId}/commit/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transactionBytes: data.transactionBytes,
        signature: data.signature,
        publicKey: data.publicKey,
        signerAddress: data.signerAddress,
        manifestBlobId: data.manifestBlobId,
        merkleRoot: data.merkleRoot,
        parentCommitId: data.parentCommitId,
      }),
    });
    const result = await handleResponse<{ data: any }>(response);
    return result.data;
  },

  // ============ DATASETS (Legacy - will be deprecated) ============

  /**
   * Get all datasets for a specific wallet owner
   */
  async getDatasets(ownerAddress: string): Promise<{ datasets: any[] }> {
    if (!ownerAddress) {
      throw new Error('ownerAddress is required');
    }
    const response = await fetch(`${API_BASE_URL}/datasets?ownerAddress=${encodeURIComponent(ownerAddress)}`, {
      method: 'GET',
    });
    return handleResponse(response);
  },

  /**
   * Get a dataset by ID
   */
  async getDataset(id: string): Promise<{ dataset: any }> {
    const response = await fetch(`${API_BASE_URL}/datasets/${id}`);
    return handleResponse(response);
  },

  /**
   * Create a new dataset
   */
  async createDataset(data: {
    name: string;
    description?: string;
    ownerAddress: string; // Required: Sui wallet address
  }): Promise<{ dataset: any }> {
    if (!data.ownerAddress) {
      throw new Error('ownerAddress is required');
    }
    const response = await fetch(`${API_BASE_URL}/datasets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  /**
   * Delete a project (dataset) and all associated data
   * Burns all blobs on Walrus and deletes all versions
   */
  async deleteDataset(id: string): Promise<{
    success: boolean;
    message: string;
    result: {
      datasetId: string;
      deletedBlobs: number;
      burnedBlobs: number;
      failedBlobs: string[];
    };
  }> {
    const response = await fetch(`${API_BASE_URL}/datasets/${id}`, {
      method: 'DELETE',
    });
    
    // Check if response has content
    const contentType = response.headers.get('content-type');
    const hasJsonContent = contentType && contentType.includes('application/json');
    
    if (!response.ok) {
      // Try to parse error response
      if (hasJsonContent) {
        try {
          const error: ApiError = await response.json();
          throw new Error(error.error?.message || `HTTP ${response.status}: ${response.statusText}`);
        } catch (e: any) {
          // If JSON parsing fails, use status text
          throw new Error(e.message || `HTTP ${response.status}: ${response.statusText}`);
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    }
    
    // Parse successful response
    if (hasJsonContent) {
      try {
        return await response.json();
      } catch (e: any) {
        throw new Error(`Failed to parse response: ${e.message}`);
      }
    } else {
      // If no JSON content, return a default success response
      return {
        success: true,
        message: 'Project deleted successfully',
        result: {
          datasetId: id,
          deletedBlobs: 0,
          burnedBlobs: 0,
          failedBlobs: [],
        },
      };
    }
  },

  // ============ MANIFEST ENTRIES ============

  /**
   * Add manifest entries to a dataset
   */
  async addManifestEntries(
    datasetId: string,
    entries: Array<{
      blobId: string;
      path?: string;
      metadata?: {
        mimeType?: string;
        size?: number;
        checksum?: string;
        [key: string]: unknown;
      };
    }>
  ): Promise<{ entries: any[] }> {
    const response = await fetch(`${API_BASE_URL}/manifest/entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ datasetId, entries }),
    });
    return handleResponse(response);
  },

  /**
   * Get manifest entries for a repository (Move-first)
   * Uses repoObjectId instead of datasetId
   */
  async getManifestEntries(
    repoObjectId: string,
    uncommitted?: boolean
  ): Promise<{ entries: any[] }> {
    // Use new Move-first route for staged entries
    if (uncommitted) {
      const response = await fetch(`${API_BASE_URL}/repos/${repoObjectId}/staged`);
      const result = await handleResponse<{ data: any[] }>(response);
      return { entries: result.data || [] };
    } else {
      // For committed entries, we'll need to implement a route or use the commit cache
      // For now, return empty array
      return { entries: [] };
    }
  },

  // ============ VERSIONS ============

  /**
   * Get versions for a repository (Move-first)
   * Uses repoObjectId instead of datasetId
   * For now, return empty array as versions are stored on-chain as Commit objects
   */
  async getVersions(repoObjectId: string): Promise<{ versions: any[] }> {
    // TODO: Implement route to fetch commits from Sui
    // For now, return empty array
    return { versions: [] };
  },

  /**
   * Get a version by ID
   */
  async getVersion(id: string): Promise<{ version: any }> {
    const response = await fetch(`${API_BASE_URL}/versions/${id}`);
    return handleResponse(response);
  },


  /**
   * Create a version commit (with wallet signature)
   */
  async createVersion(data: {
    datasetId: string;
    signature: string;
    publicKey: string;
    author: string;
    note?: string;
    enableBlockchainAnchor?: boolean;
    enableIPFSBackup?: boolean;
  }): Promise<{ version: any }> {
    const response = await fetch(`${API_BASE_URL}/versions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // ============ VERIFY ============

  /**
   * Verify the integrity of a dataset's version chain
   */
  async verifyChain(datasetId: string): Promise<{
    datasetId: string;
    valid: boolean;
    versionCount: number;
    errors: string[];
    details: any;
  }> {
    const response = await fetch(`${API_BASE_URL}/verify/chain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ datasetId }),
    });
    return handleResponse(response);
  },

  // ============ WALRUS ============

  /**
   * Upload a file to Walrus
   */
  async uploadToWalrus(file: File): Promise<{
    blobId: string;
    size: number;
    certified: boolean;
    url?: string;
    logs?: string[];
  }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/walrus/upload`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse(response);
  },

  /**
   * Get status of a Walrus blob
   */
  async getWalrusBlobStatus(blobId: string): Promise<{ status: any }> {
    const response = await fetch(`${API_BASE_URL}/walrus/status/${blobId}`);
    return handleResponse(response);
  },

  /**
   * Download a blob from Walrus
   */
  async downloadBlob(blobId: string, filename?: string): Promise<Blob> {
    // Encode blobId to handle special characters in URL
    const encodedBlobId = encodeURIComponent(blobId);
    const url = `${API_BASE_URL}/walrus/download/${encodedBlobId}${filename ? `?filename=${encodeURIComponent(filename)}` : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: {
          message: `HTTP ${response.status}: ${response.statusText}`,
          statusCode: response.status,
        },
      }));
      throw new Error(error.error.message);
    }
    
    return response.blob();
  },

  /**
   * Burn/Delete a blob from Walrus
   */
  async burnBlob(blobId: string): Promise<{ success: boolean; message: string }> {
    // Encode blobId to handle special characters in URL
    const encodedBlobId = encodeURIComponent(blobId);
    const response = await fetch(`${API_BASE_URL}/walrus/burn/${encodedBlobId}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
};
