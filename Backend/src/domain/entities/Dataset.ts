/**
 * Dataset Entity
 * Represents a collection of versioned data with manifest entries
 */
export interface Dataset {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
}

export interface CreateDatasetInput {
  name: string;
  description?: string;
}

