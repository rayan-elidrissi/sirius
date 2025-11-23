import { useCallback, useState, useEffect, useRef } from 'react';
import { 
  useCurrentWallet, 
  useWallets, 
  useCurrentAccount,
  useConnectWallet,
  useDisconnectWallet,
  useSignPersonalMessage
} from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useAuthStore } from '../stores/useAuthStore';
import toast from 'react-hot-toast';

/**
 * Convert Uint8Array to base64 string
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

/**
 * Custom hook for Sui wallet interactions
 * Uses @mysten/dapp-kit for real wallet integration
 */
export function useWallet() {
  const authStore = useAuthStore();
  const currentWallet = useCurrentWallet();
  const currentAccount = useCurrentAccount();
  const wallets = useWallets() || [];
  const { mutate: connectWallet, isPending: isConnectingWallet } = useConnectWallet();
  const { mutate: disconnectWallet } = useDisconnectWallet();
  const { mutate: signPersonalMessage, isPending: isSigningMessage } = useSignPersonalMessage();
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  
  // Check if wallet is connected - currentWallet can be null even if isConnected is true
  const isConnected = currentWallet?.isConnected && currentAccount !== null && currentWallet !== null;
  const accounts = currentAccount ? [currentAccount] : [];

  // Sync dapp-kit state with auth store
  // Use ref to track previous values to avoid infinite loops
  const prevAddressRef = useRef<string | null>(null);
  const prevWalletNameRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (isConnected && currentAccount && currentWallet) {
      const address = currentAccount.address;
      const walletName = currentWallet.name;
      
      // Only update if the address or wallet name has actually changed
      if (address && (address !== prevAddressRef.current || walletName !== prevWalletNameRef.current)) {
        // Get public key from account (Sui accounts have publicKey)
        const publicKey = currentAccount.publicKey 
          ? uint8ArrayToBase64(new Uint8Array(currentAccount.publicKey))
          : '';

        prevAddressRef.current = address;
        prevWalletNameRef.current = walletName;
        
        authStore.connect(
          address,
          publicKey,
          walletName
        );
      }
    } else if (!isConnected && authStore.isConnected) {
      // Disconnected - only disconnect if we're actually disconnected
      prevAddressRef.current = null;
      prevWalletNameRef.current = null;
      authStore.disconnect();
    }
  }, [isConnected, currentAccount?.address, currentWallet?.name]);

  /**
   * Connect to a specific Sui wallet
   */
  const connect = useCallback(async (walletName: string) => {
    setIsConnecting(true);
    
    try {
      toast.loading('Connecting wallet...', { duration: 2000 });
      
      // Ensure wallets array exists
      if (!wallets || wallets.length === 0) {
        throw new Error('No wallets available. Please install a Sui wallet extension (e.g., Slush, Sui Wallet).');
      }
      
      // Find the wallet by name
      const wallet = wallets.find(w => 
        w.name.toLowerCase() === walletName.toLowerCase() ||
        w.name.toLowerCase().includes(walletName.toLowerCase())
      );

      if (!wallet) {
        throw new Error(`Wallet "${walletName}" not found. Please install it first. Available wallets: ${wallets.map(w => w.name).join(', ')}`);
      }

      // Connect to the wallet using useConnectWallet hook
      return new Promise<{ address: string; publicKey: string; walletName: string }>((resolve, reject) => {
        connectWallet(
          { wallet },
          {
            onSuccess: (result) => {
              // Wait a bit for connection to complete
              setTimeout(() => {
                const account = currentAccount;
                if (account) {
                  const publicKey = account.publicKey 
                    ? uint8ArrayToBase64(new Uint8Array(account.publicKey))
                    : '';
                  
                  toast.success('✅ Wallet connected!');
                  resolve({
                    address: account.address,
                    publicKey,
                    walletName: wallet.name,
                  });
                } else {
                  reject(new Error('No account found after connection'));
                }
              }, 1000);
            },
            onError: (error: any) => {
              const errorMessage = error.message || 'Failed to connect wallet';
              toast.error(errorMessage);
              reject(error);
            },
          }
        );
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to connect wallet';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [wallets, connectWallet, currentAccount]);

  /**
   * Disconnect wallet
   * Note: Navigation to /sirius should be handled by the component calling this function
   */
  const disconnect = useCallback(async () => {
    try {
      disconnectWallet(undefined, {
        onSuccess: () => {
          authStore.disconnect();
          toast.success('Wallet disconnected');
        },
        onError: (error) => {
          console.error('Disconnect error:', error);
          authStore.disconnect();
          toast.success('Wallet disconnected');
        },
      });
    } catch (error) {
      console.error('Disconnect error:', error);
      authStore.disconnect();
      toast.success('Wallet disconnected');
    }
  }, [disconnectWallet, authStore]);

  /**
   * Sign a message with the connected wallet
   * Returns signature and publicKey in base64 format for backend
   */
  const signMessage = useCallback(async (message: string): Promise<{
    signature: string;
    publicKey: string;
  }> => {
    if (!isConnected || !currentAccount) {
      throw new Error('Wallet not connected');
    }

    setIsSigning(true);

    try {
      toast.loading('Please approve the signature in your wallet...', { duration: 15000 });
      
      // Sign the message using useSignPersonalMessage hook
      return new Promise<{ signature: string; publicKey: string }>((resolve, reject) => {
        signPersonalMessage(
          {
            message: new TextEncoder().encode(message),
            account: currentAccount,
          },
          {
            onSuccess: (result) => {
              // Convert signature to base64
              const signatureBase64 = uint8ArrayToBase64(new Uint8Array(result.signature));
              
              // Get public key from account
              const publicKey = currentAccount.publicKey
                ? uint8ArrayToBase64(new Uint8Array(currentAccount.publicKey))
                : authStore.publicKey || '';

              if (!publicKey) {
                reject(new Error('Could not retrieve public key from wallet'));
                return;
              }

              toast.dismiss();
              toast.success('✅ Message signed successfully!');
              
              resolve({
                signature: signatureBase64,
                publicKey,
              });
            },
            onError: (error: any) => {
              toast.dismiss();
              const errorMessage = error.message || 'Failed to sign message';
              
              // User rejected the signature
              if (errorMessage.includes('reject') || errorMessage.includes('denied') || errorMessage.includes('cancel')) {
                toast.error('Signature cancelled by user');
              } else {
                toast.error(`Failed to sign: ${errorMessage}`);
              }
              
              reject(error);
            },
          }
        );
      });
    } catch (error: any) {
      toast.dismiss();
      throw error;
    } finally {
      setIsSigning(false);
    }
  }, [isConnected, currentAccount, signPersonalMessage, authStore]);

  /**
   * Sign a Sui transaction block
   * Used for Move smart contract calls
   * Uses wallet features directly since @mysten/dapp-kit doesn't export useSignTransactionBlock
   */
  const signTransaction = useCallback(async (transactionBytes: string): Promise<{
    signature: string;
    publicKey: string;
  }> => {
    if (!isConnected || !currentAccount || !currentWallet) {
      throw new Error('Wallet not connected');
    }

    setIsSigning(true);

    try {
      toast.loading('Please approve the transaction in your wallet...', { duration: 30000 });
      
      // Deserialize transaction from base64 JSON
      // The backend sends a custom JSON format with transaction parameters
      const txJsonString = atob(transactionBytes);
      const txJson = JSON.parse(txJsonString);
      
      console.log('[useWallet] Transaction JSON:', txJson);
      
      // Create a new Transaction and reconstruct from custom format
      const tx = new Transaction();
      
      // Reconstruct transaction from custom JSON format
      if (txJson.kind === 'moveCall') {
        console.log('[useWallet] Reconstructing moveCall:', {
          target: txJson.target,
          argumentsCount: txJson.arguments?.length || 0,
        });
        
        // Reconstruct arguments from custom format
        const reconstructedArgs = txJson.arguments.map((arg: any, index: number) => {
          console.log(`[useWallet] Argument ${index}:`, arg);
          
              // Handle custom argument format
              if (arg.kind === 'address') {
                return tx.pure.address(arg.value);
              } else if (arg.kind === 'vector<u8>') {
                return tx.pure.vector('u8', arg.value);
              } else if (arg.kind === 'vector<address>') {
                return tx.pure.vector('address', arg.value);
              } else if (arg.kind === 'object') {
                return tx.object(arg.value);
              } else if (arg.value !== undefined) {
                // Fallback: try to use the value directly
                return tx.pure(arg.value);
              } else {
                throw new Error(`Invalid argument format at index ${index}: ${JSON.stringify(arg)}`);
              }
        });
        
        tx.moveCall({
          target: txJson.target,
          arguments: reconstructedArgs,
        });
        
        console.log('[useWallet] ✅ Transaction reconstructed successfully');
      } else {
        throw new Error(`Unsupported transaction kind: ${txJson.kind || 'undefined'}. Full JSON: ${txJsonString}`);
      }
      
      // Log transaction details for debugging
      console.log('[useWallet] Transaction deserialized:', {
        accountAddress: currentAccount.address,
        walletName: currentWallet.name,
        transactionJsonLength: txJsonString.length,
        transactionKind: txJson.kind,
        target: txJson.target,
      });
      
      // SOLUTION 1: Set sender explicitly before signing
      // Slush wallet might not set the sender automatically during signing
      // Setting it explicitly ensures the transaction has a sender
      console.log('[useWallet] Setting sender explicitly:', currentAccount.address);
      tx.setSender(currentAccount.address);
      
      // Access wallet features directly
      // @mysten/dapp-kit doesn't export useSignTransactionBlock, so we use wallet features
      if (!currentWallet) {
        throw new Error('Wallet not available. Please ensure your wallet (Slush) is connected.');
      }

      if (!currentAccount) {
        throw new Error('No account available. Please ensure your wallet (Slush) is connected.');
      }

      console.log('[useWallet] Current wallet structure:', {
        name: currentWallet.name,
        isConnected: currentWallet.isConnected,
        hasFeatures: !!currentWallet.features,
        hasWallet: !!currentWallet.wallet,
        keys: Object.keys(currentWallet),
        currentWallet: currentWallet,
      });

      // Get the actual wallet adapter from useWallets()
      // currentWallet might be a wrapper, we need the actual wallet adapter
      // Try to find by name, or use currentWallet directly if it has features
      let walletAdapter: any = null;
      
      // Method 1: If currentWallet has features directly, use it
      if (currentWallet.features && currentWallet.features['sui:signTransactionBlock']) {
        walletAdapter = currentWallet;
        console.log('[useWallet] Using currentWallet directly (has features)');
      }
      // Method 2: Find by name in wallets list
      else if (currentWallet.name) {
        walletAdapter = wallets.find(w => w.name === currentWallet.name);
        console.log('[useWallet] Found wallet adapter by name:', currentWallet.name);
      }
      // Method 3: If currentWallet has a wallet property, use it
      else if (currentWallet.wallet) {
        walletAdapter = currentWallet.wallet;
        console.log('[useWallet] Using currentWallet.wallet');
      }
      // Method 4: Find by matching currentAccount with wallet accounts
      else if (currentAccount) {
        walletAdapter = wallets.find(w => 
          w.accounts && w.accounts.some((acc: any) => acc.address === currentAccount.address)
        );
        console.log('[useWallet] ✅ Found wallet adapter by matching account address');
      }
      // Method 5: Try to find by matching the connected wallet (fallback)
      else {
        // Find the first connected wallet
        walletAdapter = wallets.find(w => w.installed && w.accounts && w.accounts.length > 0);
        console.log('[useWallet] ⚠️ Using first connected wallet from wallets list (fallback)');
      }
      
      if (!walletAdapter) {
        console.error('[useWallet] ❌ Could not find wallet adapter:', {
          currentWalletName: currentWallet.name,
          currentWalletKeys: Object.keys(currentWallet),
          currentAccountAddress: currentAccount?.address,
          availableWallets: wallets.map(w => ({ 
            name: w.name, 
            installed: w.installed, 
            hasAccounts: !!w.accounts,
            accountAddresses: w.accounts?.map((acc: any) => acc.address) || []
          })),
        });
        throw new Error('Wallet adapter not found. Please reconnect your wallet (Slush).');
      }

      console.log('[useWallet] Wallet adapter found:', {
        name: walletAdapter.name,
        hasFeatures: !!walletAdapter.features,
        featuresKeys: walletAdapter.features ? Object.keys(walletAdapter.features) : 'no features',
      });

      // Check if wallet has the signTransactionBlock feature
      if (!walletAdapter.features) {
        console.error('[useWallet] Wallet adapter has no features:', {
          walletAdapter,
          walletAdapterKeys: Object.keys(walletAdapter),
        });
        throw new Error('Wallet features not available. Please reconnect your wallet (Slush).');
      }

      const signFeature = walletAdapter.features['sui:signTransactionBlock'];
      if (!signFeature) {
        const availableFeatures = Object.keys(walletAdapter.features || {});
        console.error('[useWallet] Wallet does not support sui:signTransactionBlock:', {
          walletName: walletAdapter.name,
          availableFeatures,
        });
        throw new Error(
          `Wallet "${walletAdapter.name}" does not support signing transactions. ` +
          `Available features: ${availableFeatures.join(', ')}. ` +
          `Please use a Sui-compatible wallet like Slush.`
        );
      }
      if (!signFeature) {
        const availableFeatures = Object.keys(walletAdapter.features || {});
        console.error('[useWallet] Wallet does not support sui:signTransactionBlock:', {
          walletName: currentWallet.name,
          availableFeatures,
        });
        throw new Error(
          `Wallet "${currentWallet.name}" does not support signing transactions. ` +
          `Available features: ${availableFeatures.join(', ')}. ` +
          `Please use a Sui-compatible wallet like Slush.`
        );
      }

      console.log('[useWallet] Signing transaction with wallet:', {
        account: currentAccount.address,
        walletName: currentWallet.name,
        transactionTarget: txJson.target,
        note: 'Slush popup will show transaction details - verify sender matches your address',
      });

      // Sign the transaction using wallet features
      // The sender is now explicitly set, so the signed transaction will include it
      const result = await signFeature.signTransactionBlock({
        transactionBlock: tx,
        account: currentAccount,
        chain: 'sui:testnet', // TODO: Get from env or config
      });
      
      console.log('[useWallet] Transaction signed successfully - Full result:', {
        result: result,
        resultType: typeof result,
        resultKeys: Object.keys(result || {}),
        hasBytes: !!result.bytes,
        hasSignature: !!result.signature,
        bytesLength: result.bytes?.length,
        signatureLength: result.signature?.length,
        // Log all properties to see what's available
        resultStringified: JSON.stringify(result, (key, value) => {
          if (value instanceof Uint8Array) {
            return `Uint8Array(${value.length})`;
          }
          return value;
        }, 2),
        note: 'Checking result structure for signed transaction bytes',
      });

      // The result structure may vary depending on the wallet
      // Some wallets return { bytes, signature }
      // Others might return the signed transaction differently
      // Slush wallet returns base64 strings, other wallets might return Uint8Array
      let signedTransactionBytes: Uint8Array | string | undefined = undefined;
      let signature: Uint8Array | string | undefined = undefined;

      // Try different result structures
      // Slush wallet returns { signature, transactionBlockBytes }
      if (result.transactionBlockBytes) {
        signedTransactionBytes = result.transactionBlockBytes;
        signature = result.signature;
        console.log('[useWallet] ✅ Using result.transactionBlockBytes and result.signature (Slush format)');
      } else if (result.bytes) {
        signedTransactionBytes = result.bytes;
        signature = result.signature;
        console.log('[useWallet] ✅ Using result.bytes and result.signature');
      } else if (result.transactionBytes) {
        signedTransactionBytes = result.transactionBytes;
        signature = result.signature;
        console.log('[useWallet] ✅ Using result.transactionBytes and result.signature');
      } else if (result.signedTransaction) {
        signedTransactionBytes = result.signedTransaction;
        signature = result.signature;
        console.log('[useWallet] ✅ Using result.signedTransaction and result.signature');
      } else if (Array.isArray(result) && result.length > 0) {
        // Some wallets return an array
        signedTransactionBytes = result[0];
        signature = result[1];
        console.log('[useWallet] ✅ Using array result format');
      } else {
        // Log the full result for debugging
        console.error('[useWallet] ❌ Unexpected result structure:', {
          result,
          resultType: typeof result,
          resultKeys: Object.keys(result || {}),
        });
        throw new Error(
          'Wallet did not return signed transaction bytes in expected format. ' +
          'Result structure: ' + JSON.stringify(Object.keys(result || {}))
        );
      }
      
      if (!signedTransactionBytes) {
        console.error('[useWallet] No signed transaction bytes found:', {
          result,
          resultKeys: Object.keys(result || {}),
        });
        throw new Error('Wallet did not return signed transaction bytes');
      }

      // Convert signed transaction bytes to base64
      // These bytes are the complete signed transaction, ready to execute
      // Slush returns base64 strings, so we need to handle both Uint8Array and base64 strings
      let signedTxBytesBase64: string;
      let signatureBase64: string;
      
      if (typeof signedTransactionBytes === 'string') {
        // Already base64 (Slush format)
        signedTxBytesBase64 = signedTransactionBytes;
        console.log('[useWallet] Transaction bytes already in base64 format');
      } else {
        // Convert Uint8Array to base64
        const signedTxBytes = signedTransactionBytes instanceof Uint8Array 
          ? signedTransactionBytes 
          : new Uint8Array(signedTransactionBytes);
        signedTxBytesBase64 = uint8ArrayToBase64(signedTxBytes);
        console.log('[useWallet] Converted Uint8Array to base64');
      }
      
      // Handle signature (also might be base64 string from Slush)
      if (typeof signature === 'string') {
        signatureBase64 = signature;
        console.log('[useWallet] Signature already in base64 format');
      } else if (signature) {
        signatureBase64 = uint8ArrayToBase64(signature instanceof Uint8Array ? signature : new Uint8Array(signature));
        console.log('[useWallet] Converted signature Uint8Array to base64');
      } else {
        signatureBase64 = '';
        console.log('[useWallet] No signature provided');
      }
      
      // Get public key from account
      const publicKey = currentAccount.publicKey
        ? uint8ArrayToBase64(new Uint8Array(currentAccount.publicKey))
        : authStore.publicKey || '';

      if (!publicKey) {
        throw new Error('Could not retrieve public key from wallet');
      }

      toast.dismiss();
      toast.success('✅ Transaction signed successfully!');
      
      return {
        transactionBytes: signedTxBytesBase64, // Send the signed transaction bytes (complete, ready to execute)
        signature: signatureBase64, // Also include signature for reference/verification
        publicKey,
      };
    } catch (error: any) {
      toast.dismiss();
      toast.error(`Failed to sign transaction: ${error.message || 'Unknown error'}`);
      throw error;
    } finally {
      setIsSigning(false);
    }
  }, [isConnected, currentAccount, currentWallet, authStore]);

  /**
   * Get list of installed wallets
   */
  const getInstalledWallets = useCallback(() => {
    return wallets.map(w => ({
      name: w.name,
      icon: w.icon,
      installed: true,
    }));
  }, [wallets]);

  return {
    // State
    isConnected: isConnected,
    address: currentAccount?.address || authStore.address || '',
    publicKey: currentAccount?.publicKey 
      ? uint8ArrayToBase64(new Uint8Array(currentAccount.publicKey))
      : authStore.publicKey || '',
    walletName: currentWallet?.name || authStore.walletName || '',
    isConnecting: isConnecting || isConnectingWallet,
    isSigning: isSigning || isSigningMessage,
    
    // Actions
    connect,
    disconnect,
    signMessage,
    signTransaction,
    
    // Utils
    getInstalledWallets,
    allWallets: wallets || [],
    isDemoMode: false, // Real wallet integration
  };
}

