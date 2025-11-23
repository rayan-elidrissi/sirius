import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Auth store for managing wallet connection state
 */
interface AuthState {
  isConnected: boolean;
  address: string | null;
  publicKey: string | null;
  walletName: string | null;
  
  // Actions
  connect: (address: string, publicKey: string, walletName: string) => void;
  disconnect: () => void;
  updateAddress: (address: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isConnected: false,
      address: null,
      publicKey: null,
      walletName: null,

      connect: (address, publicKey, walletName) =>
        set({
          isConnected: true,
          address,
          publicKey,
          walletName,
        }),

      disconnect: () =>
        set({
          isConnected: false,
          address: null,
          publicKey: null,
          walletName: null,
        }),

      updateAddress: (address) =>
        set({ address }),
    }),
    {
      name: 'sirius-auth-storage',
    }
  )
);

