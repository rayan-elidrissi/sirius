import { create } from 'zustand';

/**
 * Projects store for managing datasets/projects state
 */
export interface Project {
  id: string;
  name: string;
  description: string | null;
  category: string;
  ownerAddress: string;
  createdAt: string;
  versionCount: number;
  fileCount: number;
  lastUpdated: string;
}

interface ProjectsState {
  projects: Project[];
  selectedProject: Project | null;
  
  // Actions
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  removeProject: (id: string) => void;
  selectProject: (project: Project | null) => void;
  clearProjects: () => void;
}

export const useProjectsStore = create<ProjectsState>((set) => ({
  projects: [],
  selectedProject: null,

  setProjects: (projects) => set({ projects }),

  addProject: (project) =>
    set((state) => ({
      projects: [project, ...state.projects],
    })),

  updateProject: (id, updates) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })),

  removeProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      selectedProject:
        state.selectedProject?.id === id ? null : state.selectedProject,
    })),

  selectProject: (project) => set({ selectedProject: project }),

  clearProjects: () => set({ projects: [], selectedProject: null }),
}));

