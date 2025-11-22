import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { BlobCreationParams, BlobCreationResult, BlobCreationState } from '../types/blob'
import {
  connectSuiWallet,
  getConnectedWalletAddress,
  createBlobOnSui,
  isSuiWalletAvailable,
} from '../services/sui'

/**
 * Hook personnalisé pour gérer la création de blob sur Sui
 */
export function useCreateBlob() {
  const [state, setState] = useState<BlobCreationState>({
    isCreating: false,
    isWalletConnected: false,
    error: null,
    result: null,
  })
  const navigate = useNavigate()

  /**
   * Vérifie et connecte le wallet si nécessaire
   */
  const ensureWalletConnected = useCallback(async (): Promise<string> => {
    const address = await getConnectedWalletAddress()
    if (address) {
      setState((prev) => ({ ...prev, isWalletConnected: true }))
      return address
    }

    // Vérifier si le wallet est disponible
    const walletAvailable = await isSuiWalletAvailable()
    if (!walletAvailable) {
      throw new Error(
        'Sui wallet not found. Please install a Sui wallet extension (e.g., Sui Wallet, Suiet).'
      )
    }

    // Connecter le wallet
    const { address: newAddress } = await connectSuiWallet()
    setState((prev) => ({ ...prev, isWalletConnected: true }))
    return newAddress
  }, [])

  /**
   * Crée un blob sur Sui
   */
  const createBlob = useCallback(
    async (params: BlobCreationParams): Promise<BlobCreationResult> => {
      setState((prev) => ({
        ...prev,
        isCreating: true,
        error: null,
        result: null,
      }))

      try {
        // S'assurer que le wallet est connecté
        const walletAddress = params.walletAddress || (await ensureWalletConnected())

        // Créer le blob sur Sui
        const result = await createBlobOnSui(params.data, walletAddress)

        setState((prev) => ({
          ...prev,
          isCreating: false,
          result,
        }))

        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        setState((prev) => ({
          ...prev,
          isCreating: false,
          error: errorMessage,
        }))
        throw error
      }
    },
    [ensureWalletConnected]
  )

  /**
   * Crée un blob et navigue vers la page de détails
   */
  const createBlobAndNavigate = useCallback(
    async (params: BlobCreationParams) => {
      try {
        const result = await createBlob(params)
        // Naviguer vers la page de détails du blob créé
        navigate(`/blob/${result.blobId}`)
        return result
      } catch (error) {
        // L'erreur est déjà gérée dans createBlob
        throw error
      }
    },
    [createBlob, navigate]
  )

  /**
   * Réinitialise l'état
   */
  const reset = useCallback(() => {
    setState({
      isCreating: false,
      isWalletConnected: false,
      error: null,
      result: null,
    })
  }, [])

  return {
    ...state,
    createBlob,
    createBlobAndNavigate,
    ensureWalletConnected,
    reset,
  }
}

