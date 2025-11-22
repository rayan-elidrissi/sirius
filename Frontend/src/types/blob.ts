/**
 * Types pour la gestion des blobs sur la blockchain Sui
 */

export interface BlobData {
  /** Contenu du blob (peut être du texte, des bytes, etc.) */
  content: string | Uint8Array
  /** Type MIME du contenu */
  contentType?: string
  /** Métadonnées optionnelles */
  metadata?: Record<string, unknown>
}

export interface BlobCreationParams {
  /** Données du blob à créer */
  data: BlobData
  /** Adresse du wallet Sui (optionnel, sera demandé si absent) */
  walletAddress?: string
  /** Gas budget pour la transaction (optionnel) */
  gasBudget?: number
}

export interface BlobCreationResult {
  /** ID du blob créé */
  blobId: string
  /** ID de l'objet Sui créé */
  suiObjectId: string
  /** ID de la transaction */
  transactionDigest: string
  /** Epoch de début */
  startEpoch: number
  /** Epoch de fin */
  endEpoch: number
  /** Taille du blob */
  size: string
  /** Timestamp de création */
  createdAt: string
}

export interface SuiTransactionResult {
  /** Digest de la transaction */
  digest: string
  /** Statut de la transaction */
  status: 'success' | 'failure'
  /** Erreur si la transaction a échoué */
  error?: string
  /** Objets créés */
  created?: Array<{
    objectId: string
    owner: string
  }>
}

export interface SuiWalletConnection {
  /** Adresse du wallet connecté */
  address: string
  /** Nom du wallet (ex: Sui Wallet, Suiet, etc.) */
  name: string
  /** Si le wallet est connecté */
  connected: boolean
}

export interface BlobCreationState {
  /** Si la création est en cours */
  isCreating: boolean
  /** Si le wallet est connecté */
  isWalletConnected: boolean
  /** Erreur lors de la création */
  error: string | null
  /** Résultat de la création */
  result: BlobCreationResult | null
}

