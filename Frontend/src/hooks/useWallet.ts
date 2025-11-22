import { useCallback, useState } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import toast from 'react-hot-toast';

/**
 * Custom hook for Sui wallet interactions
 * Simple version for demo - works immediately without dependencies
 */
export function useWallet() {
  const authStore = useAuthStore();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSigning, setIsSigning] = useState(false);

  /**
   * Connect to a specific Sui wallet
   */
  const connect = useCallback(async (walletName: string) => {
    setIsConnecting(true);
    
    try {
      // Demo mode: Quick connection for testing
      toast.loading('Connecting wallet...', { duration: 500 });
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockConnection = {
        address: '0x635c3e8edf5fb402b229932cdf5c1ea26a49866f430ceb67547271fccd14c897',
        publicKey: 'B7kM9xP2qW5tL3nR8vC4fY6jH1zD0aS5bN7mK9pQ2wE=',
        walletName: walletName,
      };

      authStore.connect(
        mockConnection.address,
        mockConnection.publicKey,
        mockConnection.walletName
      );

      toast.success('✅ Wallet connected!');
      return mockConnection;
    } catch (error) {
      toast.error('Failed to connect wallet');
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [authStore]);

  /**
   * Disconnect wallet
   */
  const disconnect = useCallback(() => {
    authStore.disconnect();
    toast.success('Wallet disconnected');
  }, [authStore]);

  /**
   * Sign a message with the connected wallet
   */
  const signMessage = useCallback(async (message: string): Promise<{
    signature: string;
    publicKey: string;
  }> => {
    if (!authStore.isConnected) {
      throw new Error('Wallet not connected');
    }

    setIsSigning(true);

    try {
      toast.loading('Signing message...', { duration: 500 });
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockSignature = {
        signature: 'Xy9zA1bC2dE3fG4hI5jK6lM7nO8pQ9rS0tU1vW2xY3zA4bC5dE6fG7hI8jK9lM0n',
        publicKey: authStore.publicKey || '',
      };

      toast.success('Message signed successfully');
      return mockSignature;
    } catch (error) {
      toast.error('Failed to sign message');
      throw error;
    } finally {
      setIsSigning(false);
    }
  }, [authStore]);

  /**
   * Get list of wallets for demo
   */
  const getInstalledWallets = useCallback(() => {
    return [];
  }, []);

  return {
    // State
    isConnected: authStore.isConnected,
    address: authStore.address,
    publicKey: authStore.publicKey,
    walletName: authStore.walletName,
    isConnecting,
    isSigning,
    
    // Actions
    connect,
    disconnect,
    signMessage,
    
    // Utils
    getInstalledWallets,
    allWallets: [],
    isDemoMode: true, // Always demo mode for now
  };
}

