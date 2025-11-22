/**
 * API Service for Sirius Data Layer
 * Handles all HTTP requests to the backend API
 */

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
  // ============ DATASETS ============

  /**
   * Get all datasets
   */
  async getDatasets(): Promise<{ datasets: any[] }> {
    const response = await fetch(`${API_BASE_URL}/datasets`);
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
  async createDataset(data: { name: string; description?: string }): Promise<{ dataset: any }> {
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
   * Delete a dataset
   */
  async deleteDataset(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/datasets/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: {
          message: `HTTP ${response.status}: ${response.statusText}`,
          statusCode: response.status,
        },
      }));
      throw new Error(error.error.message);
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
   * Get manifest entries for a dataset
   */
  async getManifestEntries(
    datasetId: string,
    uncommitted?: boolean
  ): Promise<{ entries: any[] }> {
    const params = new URLSearchParams({ datasetId });
    if (uncommitted) {
      params.append('uncommitted', 'true');
    }
    const response = await fetch(`${API_BASE_URL}/manifest/entries?${params}`);
    return handleResponse(response);
  },

  // ============ VERSIONS ============

  /**
   * Get versions for a dataset
   */
  async getVersions(datasetId: string): Promise<{ versions: any[] }> {
    const response = await fetch(`${API_BASE_URL}/versions?datasetId=${datasetId}`);
    return handleResponse(response);
  },

  /**
   * Get a version by ID
   */
  async getVersion(id: string): Promise<{ version: any }> {
    const response = await fetch(`${API_BASE_URL}/versions/${id}`);
    return handleResponse(response);
  },

  /**
   * Prepare a commit (returns message to sign)
   */
  async prepareCommit(data: {
    datasetId: string;
    includeAllEntries?: boolean;
  }): Promise<{
    message: string;
    versionRoot: string;
    parentRoot: string | null;
    entryCount: number;
  }> {
    const response = await fetch(`${API_BASE_URL}/versions/prepare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
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
