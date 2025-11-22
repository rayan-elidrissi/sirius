import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/useAuthStore';
import { Project, CreateProjectInput } from '../types/project';
import toast from 'react-hot-toast';
import { api } from '../services/api';

/**
 * Hook for managing projects (datasets)
 * Uses React Query for server state management
 */

// Map backend Dataset to frontend Project
function mapDatasetToProject(dataset: any, address?: string): Project {
  return {
    id: dataset.id,
    name: dataset.name,
    description: dataset.description,
    category: 'research', // Default, can be extended later
    ownerAddress: address || '',
    createdAt: dataset.createdAt,
    versionCount: 0, // Will be fetched separately if needed
    fileCount: 0, // Will be fetched separately if needed
    lastUpdated: dataset.createdAt,
    securityLevel: 'enhanced', // Default
    isMultiSig: false,
    requiredSignatures: 1,
    collaborators: [],
  };
}

export function useProjects() {
  const queryClient = useQueryClient();
  const { address } = useAuthStore();

  // Fetch all projects for current user
  const projectsQuery = useQuery({
    queryKey: ['projects', address],
    queryFn: async () => {
      const { datasets } = await api.getDatasets();
      return datasets.map((d) => mapDatasetToProject(d, address || undefined));
    },
    enabled: !!address,
    // Return empty array immediately if no address
    placeholderData: [],
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      const { dataset } = await api.createDataset({
        name: input.name,
        description: input.description || undefined,
      });
      return mapDatasetToProject(dataset, address || undefined);
    },
    onSuccess: (newProject) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(`Project "${newProject.name}" created!`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to create project: ${error.message}`);
    },
  });

  return {
    // Data
    projects: projectsQuery.data || [],
    isLoading: !!address && projectsQuery.isLoading, // Only loading if we have an address
    error: projectsQuery.error,
    
    // Actions
    createProject: createProjectMutation.mutate,
    isCreating: createProjectMutation.isPending,
    
    // Refetch
    refetch: projectsQuery.refetch,
  };
}

export function useProject(projectId: string | undefined) {
  const { address } = useAuthStore();
  
  const projectQuery = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID is required');
      const { dataset } = await api.getDataset(projectId);
      return mapDatasetToProject(dataset, address || undefined);
    },
    enabled: !!projectId,
  });

  return {
    project: projectQuery.data,
    isLoading: projectQuery.isLoading,
    error: projectQuery.error,
    refetch: projectQuery.refetch,
  };
}

/**
 * Map backend ManifestEntry to frontend ManifestEntry format
 * Backend returns entries with metadata as JSON string or object
 */
function mapManifestEntry(entry: any): any {
  // Parse metadata if it's a string
  const metadata = typeof entry.metadata === 'string' 
    ? JSON.parse(entry.metadata) 
    : (entry.metadata || {});
  
  // Extract filename from path or metadata
  const filename = entry.path || metadata.filename || 'Untitled';
  
  return {
    id: entry.id,
    datasetId: entry.datasetId,
    blobId: entry.blobId,
    path: entry.path,
    filename,
    size: metadata.size || 0,
    mimeType: metadata.mimeType || 'application/octet-stream',
    metadata,
    createdAt: entry.createdAt,
    // If we're fetching uncommitted entries, they're all uncommitted
    // Otherwise, check if versionCommits array exists and is empty
    isCommitted: entry.versionCommits ? entry.versionCommits.length > 0 : false,
  };
}

/**
 * Hook for fetching manifest entries (files) for a project
 */
export function useManifestEntries(projectId: string | undefined, uncommitted: boolean = true) {
  const queryClient = useQueryClient();

  const entriesQuery = useQuery({
    queryKey: ['manifestEntries', projectId, uncommitted],
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID is required');
      const { entries } = await api.getManifestEntries(projectId, uncommitted);
      return entries.map(mapManifestEntry);
    },
    enabled: !!projectId,
  });

  return {
    entries: entriesQuery.data || [],
    isLoading: entriesQuery.isLoading,
    error: entriesQuery.error,
    refetch: entriesQuery.refetch,
    invalidate: () => {
      queryClient.invalidateQueries({ queryKey: ['manifestEntries', projectId] });
    },
  };
}

/**
 * Hook for fetching versions for a project
 */
export function useVersions(projectId: string | undefined) {
  const queryClient = useQueryClient();

  const versionsQuery = useQuery({
    queryKey: ['versions', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID is required');
      const { versions } = await api.getVersions(projectId);
      return versions;
    },
    enabled: !!projectId,
  });

  return {
    versions: versionsQuery.data || [],
    isLoading: versionsQuery.isLoading,
    error: versionsQuery.error,
    refetch: versionsQuery.refetch,
    invalidate: () => {
      queryClient.invalidateQueries({ queryKey: ['versions', projectId] });
    },
  };
}

