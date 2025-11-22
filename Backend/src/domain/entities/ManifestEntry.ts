/**
 * ManifestEntry Entity
 * Represents a single blob reference in a dataset with metadata
 */
export interface ManifestEntry {
  id: string;
  datasetId: string;
  blobId: string; // Walrus blob ID
  path: string | null; // Logical path or name
  metadata: ManifestMetadata;
  createdAt: Date;
}

export interface ManifestMetadata {
  mimeType?: string;
  size?: number;
  checksum?: string;
  [key: string]: unknown; // Allow additional custom metadata
}

export interface CreateManifestEntryInput {
  datasetId: string;
  blobId: string;
  path?: string;
  metadata: ManifestMetadata;
}

