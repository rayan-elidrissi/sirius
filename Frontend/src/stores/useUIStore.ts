import { create } from 'zustand';

/**
 * UI store for managing modals, toasts, and UI state
 */
interface UIState {
  // Modals
  isConnectWalletModalOpen: boolean;
  isCreateProjectModalOpen: boolean;
  isCreateVersionModalOpen: boolean;
  isUploadFilesModalOpen: boolean;
  
  // Loading states
  isLoading: boolean;
  loadingMessage: string;
  
  // Actions
  openConnectWalletModal: () => void;
  closeConnectWalletModal: () => void;
  openCreateProjectModal: () => void;
  closeCreateProjectModal: () => void;
  openCreateVersionModal: () => void;
  closeCreateVersionModal: () => void;
  openUploadFilesModal: () => void;
  closeUploadFilesModal: () => void;
  
  setLoading: (isLoading: boolean, message?: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Modals
  isConnectWalletModalOpen: false,
  isCreateProjectModalOpen: false,
  isCreateVersionModalOpen: false,
  isUploadFilesModalOpen: false,
  
  // Loading
  isLoading: false,
  loadingMessage: '',
  
  // Actions
  openConnectWalletModal: () => set({ isConnectWalletModalOpen: true }),
  closeConnectWalletModal: () => set({ isConnectWalletModalOpen: false }),
  
  openCreateProjectModal: () => set({ isCreateProjectModalOpen: true }),
  closeCreateProjectModal: () => set({ isCreateProjectModalOpen: false }),
  
  openCreateVersionModal: () => set({ isCreateVersionModalOpen: true }),
  closeCreateVersionModal: () => set({ isCreateVersionModalOpen: false }),
  
  openUploadFilesModal: () => set({ isUploadFilesModalOpen: true }),
  closeUploadFilesModal: () => set({ isUploadFilesModalOpen: false }),
  
  setLoading: (isLoading, message = '') =>
    set({ isLoading, loadingMessage: message }),
}));

