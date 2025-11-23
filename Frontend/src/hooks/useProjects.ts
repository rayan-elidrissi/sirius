import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/useAuthStore';
import { Project, CreateProjectInput } from '../types/project';
import toast from 'react-hot-toast';
import { api } from '../services/api';
import { useWallet } from './useWallet';

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

// Helper functions for localStorage persistence
const DELETED_PROJECTS_KEY = 'sirius_deleted_projects';

function getDeletedProjectsFromStorage(): Set<string> {
  try {
    const stored = localStorage.getItem(DELETED_PROJECTS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return new Set(Array.isArray(parsed) ? parsed : []);
    }
  } catch (error) {
    console.warn('[useProjects] Failed to load deleted projects from localStorage:', error);
  }
  return new Set();
}

function saveDeletedProjectsToStorage(deletedIds: Set<string>) {
  try {
    const array = Array.from(deletedIds);
    localStorage.setItem(DELETED_PROJECTS_KEY, JSON.stringify(array));
  } catch (error) {
    console.warn('[useProjects] Failed to save deleted projects to localStorage:', error);
  }
}

function addDeletedProjectToStorage(projectId: string) {
  const deleted = getDeletedProjectsFromStorage();
  deleted.add(projectId);
  saveDeletedProjectsToStorage(deleted);
}

function removeDeletedProjectFromStorage(projectId: string) {
  const deleted = getDeletedProjectsFromStorage();
  deleted.delete(projectId);
  saveDeletedProjectsToStorage(deleted);
}

export function useProjects() {
  const queryClient = useQueryClient();
  const { address } = useAuthStore();
  const { signTransaction } = useWallet();
  
  // Track locally deleted projects (persisted in localStorage)
  const [deletedProjectIds, setDeletedProjectIds] = useState<Set<string>>(() => {
    // Load from localStorage on mount
    return getDeletedProjectsFromStorage();
  });

  // Sync state with localStorage when it changes
  useEffect(() => {
    saveDeletedProjectsToStorage(deletedProjectIds);
  }, [deletedProjectIds]);

  // Invalidate cache when address changes
  useEffect(() => {
    if (address) {
      // Clear all project-related queries when wallet changes
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['manifestEntries'] });
      queryClient.invalidateQueries({ queryKey: ['versions'] });
      // Keep deleted projects list (don't reset on wallet change)
    }
  }, [address, queryClient]);

  // Fetch all projects for current user (using new repos API)
  const projectsQuery = useQuery({
    queryKey: ['projects', address],
    queryFn: async () => {
      if (!address) {
        throw new Error('Wallet address is required');
      }
      console.log('[useProjects] Fetching repos for address:', address);
      try {
        // Try new repos API first
        const result = await api.getRepos(address);
        const repos = result?.repos || [];
        console.log('[useProjects] Received repos:', repos.length, 'for address:', address);
        // Map repos to projects format
        const projects = repos.map((r: any) => {
          // Parse meta if it's a string
          let meta = {};
          if (r.meta) {
            meta = typeof r.meta === 'string' ? JSON.parse(r.meta) : r.meta;
          }
          
          return {
            id: r.repoObjectId || r.id,
            name: meta.name || 'Untitled Repository',
            description: meta.description || '',
            category: 'research' as const,
            ownerAddress: r.ownerAddress || address,
            createdAt: r.createdAt || new Date().toISOString(),
            versionCount: 0,
            fileCount: 0,
            lastUpdated: r.updatedAt || r.createdAt || new Date().toISOString(),
            securityLevel: 'enhanced' as const,
            isMultiSig: false,
            requiredSignatures: 1,
            collaborators: [],
            repoObjectId: r.repoObjectId || r.id, // Add for easy access
          };
        });
        
        // Filter out locally deleted projects (check localStorage directly for persistence)
        const deletedIds = getDeletedProjectsFromStorage();
        return projects.filter((p) => !deletedIds.has(p.id));
      } catch (error) {
        // Fallback to old datasets API
        console.warn('[useProjects] Repos API failed, falling back to datasets:', error);
        const { datasets } = await api.getDatasets(address);
        const projects = datasets.map((d) => mapDatasetToProject(d, address || undefined));
        // Filter out locally deleted projects (check localStorage directly for persistence)
        const deletedIds = getDeletedProjectsFromStorage();
        return projects.filter((p) => !deletedIds.has(p.id));
      }
    },
    enabled: !!address,
    placeholderData: [],
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Create project mutation (Move-first with Sui signature)
  const createProjectMutation = useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      if (!address) {
        throw new Error('Wallet address is required to create a project');
      }

      // Step 1: Prepare transaction
      toast.loading('Preparing repository creation...', { duration: 10000 });
      // Filter out empty collaborator addresses and validate format
      const validCollaborators = (input.collaborators || [])
        .map(addr => addr.trim())
        .filter(addr => addr.length > 0 && addr.startsWith('0x') && addr.length >= 10);
      
      const prepareResult = await api.prepareCreateRepo({
        ownerAddress: address,
        name: input.name,
        description: input.description,
        collaborators: validCollaborators,
      });

      console.log('[useProjects] Transaction prepared:', {
        transactionBytesLength: prepareResult.transactionBytes.length,
        sealedRmkBlobId: prepareResult.sealedRmkBlobId,
        ownerAddress: address,
      });

      toast.dismiss();
      toast.loading('Please approve the transaction in your wallet (Slush popup)...', { duration: 30000 });
      console.log('[useProjects] Opening Slush wallet popup for transaction approval...');

      // Step 2: Sign transaction with wallet
      // The Slush popup will show transaction details - verify it shows:
      // - Function: create_repo
      // - Owner: your address (0x782362...)
      // - Sealed RMK Blob ID
      const signResult = await signTransaction(prepareResult.transactionBytes);
      
      console.log('[useProjects] Transaction signed:', {
        hasTransactionBytes: !!signResult.transactionBytes,
        hasSignature: !!signResult.signature,
        hasPublicKey: !!signResult.publicKey,
      });

      toast.dismiss();
      toast.loading('Creating repository on Sui...', { duration: 15000 });

      // Step 3: Execute signed transaction
      // signResult.transactionBytes now contains the signed transaction bytes
      const executeResult = await api.executeCreateRepo({
        transactionBytes: signResult.transactionBytes, // Use signed transaction bytes from wallet
        signature: signResult.signature,
        publicKey: signResult.publicKey,
        signerAddress: address,
        sealedRmkBlobId: prepareResult.sealedRmkBlobId,
        name: input.name, // Pass name to backend
        description: input.description, // Pass description to backend
      });

      toast.dismiss();

      // Map to Project format
      const newProject: Project = {
        id: executeResult.repoObjectId,
        name: input.name,
        description: input.description || '',
        category: input.category || 'research',
        ownerAddress: address,
        createdAt: new Date().toISOString(),
        versionCount: 0,
        fileCount: 0,
        lastUpdated: new Date().toISOString(),
        securityLevel: input.securityLevel || 'enhanced',
        isMultiSig: false,
        requiredSignatures: 1,
        collaborators: input.collaborators || [],
      };

      return newProject;
    },
    onSuccess: (newProject, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(
        `✅ Repository created! View on Suiscan: https://suiscan.xyz/testnet/object/${newProject.id}`,
        { 
          duration: 8000,
          icon: '🎉',
        }
      );
    },
    onError: (error: Error) => {
      toast.error(`Failed to create repository: ${error.message}`);
    },
  });

  // Delete project mutation (optimistic delete - instant UI update for hackathon)
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      // For hackathon: instant delete, no blockchain transaction
      // The project is removed from UI immediately via optimistic update
      console.log(`[useProjects] Optimistic delete for project: ${projectId}`);
      
      // Add to deleted projects set (persists in localStorage)
      const newDeletedSet = new Set([...deletedProjectIds, projectId]);
      setDeletedProjectIds(newDeletedSet);
      addDeletedProjectToStorage(projectId); // Persist to localStorage immediately
      
      return { projectId };
    },
    // Optimistic update: remove project from list immediately
    onMutate: async (projectId: string) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['projects', address] });

      // Snapshot the previous value
      const previousProjects = queryClient.getQueryData<Project[]>(['projects', address]);

      // Optimistically update to the new value (remove the project)
      if (previousProjects) {
        queryClient.setQueryData<Project[]>(
          ['projects', address],
          previousProjects.filter((p) => p.id !== projectId)
        );
      }

      // Return a context object with the snapshotted value
      return { previousProjects };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, projectId, context) => {
      // Remove from deleted set and localStorage
      const newDeletedSet = new Set(deletedProjectIds);
      newDeletedSet.delete(projectId);
      setDeletedProjectIds(newDeletedSet);
      removeDeletedProjectFromStorage(projectId);
      
      // Rollback to previous projects list
      if (context?.previousProjects) {
        queryClient.setQueryData(['projects', address], context.previousProjects);
      }
      toast.error(`Failed to delete project`);
    },
    // Don't invalidate queries - we filter deleted projects in the queryFn
    // This prevents the project from reappearing after refetch
    onSuccess: (data, projectId) => {
      toast.success(`✅ Project deleted`, { duration: 3000 });
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
    deleteProject: deleteProjectMutation.mutate,
    isDeleting: deleteProjectMutation.isPending,
    
    // Refetch
    refetch: projectsQuery.refetch,
    invalidate: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  };
}

export function useProject(projectId: string | undefined) {
  const { address } = useAuthStore();
  
  const projectQuery = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID is required');
      
      try {
        // Try new repos API first
        const { cached, sui } = await api.getRepo(projectId);
        
        console.log('[useProject] Repository data:', { cached, sui, projectId });
        
        // Use cached data if available (has meta with name), otherwise use Sui data
        // Prefer cached for metadata (name, description), but use Sui for on-chain info
        const repo = cached || {};
        const suiData = sui || {};
        
        if (!cached && !sui) {
          throw new Error('Repository not found');
        }
        
        // Parse meta if it's a string
        let meta = {};
        if (repo.meta) {
          meta = typeof repo.meta === 'string' ? JSON.parse(repo.meta) : repo.meta;
        }
        
        // Map repo to Project format
        return {
          id: repo.repoObjectId || suiData.repoObjectId || projectId,
          name: meta.name || 'Untitled Repository',
          description: meta.description || '',
          category: 'research' as const,
          ownerAddress: repo.ownerAddress || suiData.owner || address || '',
          createdAt: repo.createdAt || new Date().toISOString(),
          versionCount: 0,
          fileCount: 0,
          lastUpdated: repo.updatedAt || repo.createdAt || new Date().toISOString(),
          securityLevel: 'enhanced' as const,
          isMultiSig: false,
          requiredSignatures: 1,
          collaborators: [],
          // Add Sui blockchain info for display
          repoObjectId: repo.repoObjectId || suiData.repoObjectId || projectId,
          suiInfo: suiData, // Include full Sui info for display
        };
      } catch (error) {
        // Fallback to old datasets API
        console.warn('[useProject] Repo API failed, falling back to dataset:', error);
        const { dataset } = await api.getDataset(projectId);
        return mapDatasetToProject(dataset, address || undefined);
      }
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
 * Move-first entries have ciphertextBlobId instead of blobId
 */
function mapManifestEntry(entry: any): any {
  // Parse metadata if it's a string
  const metadata = typeof entry.metadata === 'string' 
    ? JSON.parse(entry.metadata) 
    : (entry.metadata || {});
  
  // Extract filename from path or metadata
  const filename = entry.filename || entry.path || metadata.filename || 'Untitled';
  
  // Move-first entries use ciphertextBlobId, legacy entries use blobId
  const blobId = entry.ciphertextBlobId || entry.blobId;
  
  return {
    id: entry.id,
    datasetId: entry.repoObjectId || entry.datasetId, // Move-first uses repoObjectId
    blobId: blobId, // Map ciphertextBlobId to blobId for compatibility
    path: entry.path,
    filename,
    size: entry.size || metadata.size || 0,
    mimeType: entry.mimeType || metadata.mimeType || 'application/octet-stream',
    metadata: {
      ...metadata,
      // Include Move-first specific fields in metadata
      ciphertextBlobId: entry.ciphertextBlobId,
      sealedKeyBlobId: entry.sealedKeyBlobId,
      cipherHash: entry.cipherHash,
      cipherSuite: entry.cipherSuite,
    },
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

