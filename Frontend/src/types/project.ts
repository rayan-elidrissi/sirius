/**
 * Project/Dataset types for Sirius
 */

export interface Project {
  id: string;
  name: string;
  description: string | null;
  category: 'research' | 'medical' | 'enterprise' | 'education' | 'personal' | 'other';
  ownerAddress: string;
  createdAt: string;
  versionCount: number;
  fileCount: number;
  lastUpdated: string;
  
  // Security settings
  securityLevel: 'standard' | 'enhanced' | 'maximum';
  isMultiSig: boolean;
  requiredSignatures: number;
  
  // Collaborators
  collaborators: string[]; // Wallet addresses
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  category: Project['category'];
  securityLevel: Project['securityLevel'];
  collaborators?: string[];
}

export interface ManifestEntry {
  id: string;
  datasetId: string;
  blobId: string;
  path: string | null;
  filename: string;
  size: number;
  mimeType: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  isCommitted: boolean;
}

export interface UploadedFile extends File {
  id?: string;
  blobId?: string;
  uploadProgress?: number;
  status?: 'pending' | 'uploading' | 'uploaded' | 'error';
  error?: string;
}

