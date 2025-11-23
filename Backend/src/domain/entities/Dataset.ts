/**
 * Dataset Entity
 * Represents a collection of versioned data with manifest entries
 */
export interface Dataset {
  id: string;
  name: string;
  description: string | null;
  ownerAddress: string | null; // Sui wallet address of the project owner (nullable for old projects)
  createdAt: Date;
}

export interface CreateDatasetInput {
  name: string;
  description?: string;
  ownerAddress: string; // Required: Sui wallet address
}

