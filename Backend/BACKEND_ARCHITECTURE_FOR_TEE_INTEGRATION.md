# Architecture Backend - Documentation pour Intégration TEE Nautilus

## 📋 Vue d'ensemble

Ce document décrit l'architecture complète du backend Sirius Data Layer (Move-first) pour permettre l'intégration de **Nautilus TEE** après la création des datablobs et avant la signature pour commit dans l'objet Sui.

**Point d'intégration TEE recommandé :** Dans `CommitUseCase.execute()`, après l'upload du manifest sur Walrus et le calcul du Merkle root, mais **AVANT** la préparation de la transaction Sui (`preparePushCommit`).

---

## 🏗️ Architecture Générale

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
│  - Wallet Connection (Slush)                                │
│  - Transaction Signing                                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTP API
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Express + TypeScript)            │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         APPLICATION LAYER (Use Cases)              │   │
│  │  - CreateRepoUseCase                                │   │
│  │  - UploadFilesUseCase                               │   │
│  │  - CommitUseCase  ⬅️ POINT D'INTÉGRATION TEE       │   │
│  │  - CloneUseCase                                     │   │
│  │  - PullUseCase                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         DOMAIN SERVICES (Interfaces)                │   │
│  │  - IWalrusService (Storage)                         │   │
│  │  - IEncryptionService (XChaCha20/AES-GCM)           │   │
│  │  - ISealService (Key Sealing)                       │   │
│  │  - ISuiChainService (Move Smart Contracts)          │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         INFRASTRUCTURE (Implementations)            │   │
│  │  - WalrusService (CLI wrapper)                      │   │
│  │  - EncryptionService                                 │   │
│  │  - SealService (AES-256-GCM placeholder)            │   │
│  │  - SuiChainService (@mysten/sui)                    │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┼───────────┬──────────────┐
         ▼           ▼           ▼              ▼
    ┌─────────┐ ┌─────────┐ ┌─────────┐  ┌─────────────┐
    │ Walrus  │ │   Sui   │ │ SQLite  │  │  Nautilus  │
    │ Storage │ │ Move SC │ │  Cache  │  │    TEE     │
    └─────────┘ └─────────┘ └─────────┘  └─────────────┘
```

---

## 🔑 Services Principaux

### 1. **IWalrusService** - Stockage Distribué

**Interface :** `Backend/src/domain/services/IWalrusService.ts`

#### Méthodes

##### `uploadBuffer(buffer: Buffer, filename?: string): Promise<WalrusUploadResult>`
- **Entrée :**
  - `buffer: Buffer` - Données binaires à uploader
  - `filename?: string` - Nom de fichier optionnel
- **Sortie :**
  ```typescript
  {
    blobId: string;        // e.g., "wblb_abc123..."
    size: number;          // Taille en bytes
    certified: boolean;    // Si le blob est certifié
    url?: string;          // URL gateway optionnelle
    logs?: string[];       // Logs de debug
  }
  ```
- **Usage :** Upload de ciphertext, sealed keys, manifests

##### `downloadBlob(blobId: string): Promise<Buffer>`
- **Entrée :**
  - `blobId: string` - ID du blob Walrus (e.g., "wblb_abc123...")
- **Sortie :** `Buffer` - Contenu du blob
- **Usage :** Téléchargement pour décryptage/clone

##### `getBlobStatus(blobId: string): Promise<WalrusBlobStatus>`
- **Entrée :** `blobId: string`
- **Sortie :**
  ```typescript
  {
    blobId: string;
    size: number;
    certified: boolean;
    status: 'available' | 'pending' | 'error';
    createdAt?: Date;
  }
  ```

##### `burnBlob(blobId: string): Promise<void>`
- **Entrée :** `blobId: string`
- **Sortie :** `void`
- **Usage :** Suppression permanente d'un blob

---

### 2. **IEncryptionService** - Chiffrement Symétrique

**Interface :** `Backend/src/domain/services/IEncryptionService.ts`

#### Méthodes

##### `generateFileKey(): Buffer`
- **Entrée :** Aucune
- **Sortie :** `Buffer` (32 bytes = 256 bits)
- **Usage :** Génération de clés pour fichiers ou RMK

##### `encryptFile(plaintext: Buffer, fileKey: Buffer): EncryptionResult`
- **Entrée :**
  - `plaintext: Buffer` - Fichier en clair
  - `fileKey: Buffer` - Clé de chiffrement (32 bytes)
- **Sortie :**
  ```typescript
  {
    ciphertext: Buffer;        // Fichier chiffré
    nonce: Buffer;            // Nonce (24 bytes pour XChaCha20)
    cipherSuite: string;      // 'xchacha20-poly1305' ou 'aes-256-gcm'
  }
  ```
- **Algorithme :** XChaCha20-Poly1305 (fallback AES-256-GCM)

##### `decryptFile(ciphertext: Buffer, nonce: Buffer, fileKey: Buffer, cipherSuite: string): DecryptionResult`
- **Entrée :**
  - `ciphertext: Buffer` - Fichier chiffré
  - `nonce: Buffer` - Nonce utilisé pour le chiffrement
  - `fileKey: Buffer` - Clé de déchiffrement
  - `cipherSuite: string` - Suite de chiffrement utilisée
- **Sortie :**
  ```typescript
  {
    plaintext: Buffer;  // Fichier déchiffré
  }
  ```

##### `deriveFileKeyFromRMK(rmk: Buffer, fileId: string): Buffer`
- **Entrée :**
  - `rmk: Buffer` - Root Master Key
  - `fileId: string` - Identifiant unique du fichier
- **Sortie :** `Buffer` (32 bytes) - Clé dérivée
- **Usage :** Dérivation de clés de fichiers à partir du RMK

---

### 3. **ISealService** - Scellement de Clés

**Interface :** `Backend/src/domain/services/ISealService.ts`

#### Types

```typescript
interface SealPolicy {
  repoId: string;              // ID du repository Sui
  allowedAddresses: string[];  // Adresses autorisées à unseal
}

interface SealedKey {
  sealedBlob: Buffer;          // Clé scellée (chiffrée)
  policy: SealPolicy;          // Politique d'accès
}

interface UnsealResult {
  key: Buffer;                 // Clé déscellée (en clair)
}
```

#### Méthodes

##### `sealKey(key: Buffer, policy: SealPolicy): Promise<SealedKey>`
- **Entrée :**
  - `key: Buffer` - Clé à sceller (RMK ou FileKey)
  - `policy: SealPolicy` - Politique d'accès
- **Sortie :** `SealedKey`
- **Implémentation actuelle :** AES-256-GCM (placeholder pour Seal SDK)
- **Usage :** Scelle RMK et FileKeys avant upload sur Walrus

##### `unsealKey(sealedBlob: Buffer, policy: SealPolicy, callerAddress: string): Promise<UnsealResult>`
- **Entrée :**
  - `sealedBlob: Buffer` - Clé scellée
  - `policy: SealPolicy` - Politique d'accès
  - `callerAddress: string` - Adresse du demandeur
- **Sortie :** `UnsealResult`
- **Vérification :** Appelle `canUnseal()` pour vérifier les permissions on-chain

##### `canUnseal(policy: SealPolicy, address: string): Promise<boolean>`
- **Entrée :**
  - `policy: SealPolicy`
  - `address: string` - Adresse à vérifier
- **Sortie :** `boolean`
- **Vérification :** Vérifie on-chain si l'adresse est owner/writer/reader du repository

---

### 4. **ISuiChainService** - Smart Contracts Sui Move

**Interface :** `Backend/src/domain/services/ISuiChainService.ts`

#### Types

```typescript
interface CreateRepoParams {
  ownerAddress: string;        // Adresse du propriétaire
  sealedRmkBlobId: string;     // Blob ID Walrus du RMK scellé
}

interface PushCommitParams {
  repoObjectId: string;        // ID de l'objet Repository Sui
  parentCommitId: string | null; // ID du commit parent (null pour premier)
  manifestBlobId: string;      // Blob ID Walrus du manifest JSON
  merkleRoot: string;          // Racine Merkle (hex string)
  signerAddress: string;       // Adresse qui signe
  signature?: string;          // Signature (pour execution)
  publicKey?: string;          // Clé publique (pour execution)
}

interface PrepareTransactionResult {
  transactionBytes: string;    // Transaction sérialisée (base64)
  transactionDigest?: string;  // Digest pour preview
}

interface ExecuteTransactionParams {
  transactionBytes: string;    // Transaction signée (base64)
  signature: string;          // Signature (base64)
  publicKey: string;           // Clé publique (base64)
  signerAddress: string;       // Adresse signataire
}
```

#### Méthodes Principales

##### `prepareCreateRepo(params: CreateRepoParams): Promise<PrepareTransactionResult>`
- **Entrée :** `CreateRepoParams`
- **Sortie :** `PrepareTransactionResult` - Transaction bytes pour signature frontend
- **Action :** Prépare l'appel Move `create_repo(owner, sealed_rmk_blob_id)`

##### `executeCreateRepo(params: ExecuteTransactionParams): Promise<CreateRepoResult>`
- **Entrée :** `ExecuteTransactionParams` - Transaction signée
- **Sortie :**
  ```typescript
  {
    repoObjectId: string;      // ID de l'objet Repository créé
    transactionHash: string;    // Hash de la transaction
  }
  ```

##### `preparePushCommit(params: Omit<PushCommitParams, 'signature' | 'publicKey'>): Promise<PrepareTransactionResult>`
- **Entrée :** `PushCommitParams` (sans signature/publicKey)
- **Sortie :** `PrepareTransactionResult` - Transaction bytes pour signature
- **Action :** Prépare l'appel Move `push_commit(repo, parent, manifest_blob_id, merkle_root)`

##### `executePushCommit(params: ExecuteTransactionParams & PushCommitParams): Promise<PushCommitResult>`
- **Entrée :** Transaction signée + paramètres commit
- **Sortie :**
  ```typescript
  {
    commitObjectId: string;    // ID de l'objet Commit créé
    transactionHash: string;     // Hash de la transaction
  }
  ```

##### `getRepositoryInfo(repoObjectId: string): Promise<RepositoryInfo>`
- **Entrée :** `repoObjectId: string`
- **Sortie :**
  ```typescript
  {
    owner: string;
    writers: string[];
    readers: string[];
    headCommitId: string | null;
    sealedRmkBlobId: string;
    createdAtMs: number;
  }
  ```

##### `getHeadCommitId(repoObjectId: string): Promise<string | null>`
- **Entrée :** `repoObjectId: string`
- **Sortie :** `string | null` - ID du commit HEAD (ou null si aucun)

##### `isWriter(repoObjectId: string, address: string): Promise<boolean>`
- **Entrée :** `repoObjectId`, `address`
- **Sortie :** `boolean`

##### `isReader(repoObjectId: string, address: string): Promise<boolean>`
- **Entrée :** `repoObjectId`, `address`
- **Sortie :** `boolean`

---

## 📦 Use Cases (Flux Métier)

### 1. **CreateRepoUseCase** - Création d'un Repository

**Fichier :** `Backend/src/application/usecases/CreateRepoUseCase.ts`

#### Flux Complet

```typescript
async execute(request: CreateRepoRequest): Promise<PrepareCreateRepoResult>
```

**Entrée :**
```typescript
{
  ownerAddress: string;      // Adresse du propriétaire (wallet)
  name: string;              // Nom du repository (metadata)
  description?: string;      // Description (metadata)
}
```

**Étapes :**
1. **Génération RMK** : `encryptionService.generateFileKey()` → `Buffer` (32 bytes)
2. **Création Policy Seal** :
   ```typescript
   {
     repoId: '',  // Sera défini après création
     allowedAddresses: [ownerAddress]
   }
   ```
3. **Scellement RMK** : `sealService.sealKey(rmk, policy)` → `SealedKey`
4. **Upload RMK Scellé** : `walrusService.uploadBuffer(sealedKey.sealedBlob)` → `blobId`
5. **Préparation Transaction** : `suiChainService.prepareCreateRepo({ ownerAddress, sealedRmkBlobId })`

**Sortie :**
```typescript
{
  transactionBytes: string;    // Base64 - pour signature frontend
  sealedRmkBlobId: string;     // Blob ID Walrus du RMK scellé
}
```

#### Exécution Transaction Signée

```typescript
async executeSignedTransaction(
  transactionBytes: string,
  signature: string,
  publicKey: string,
  signerAddress: string
): Promise<CreateRepoResult>
```

**Entrée :** Transaction signée par le frontend
**Sortie :**
```typescript
{
  repoObjectId: string;        // ID Sui du Repository créé
  sealedRmkBlobId: string;
  transactionHash: string;
  suiscanUrl: string;          // Lien Suiscan transaction
  repoSuiscanUrl: string;       // Lien Suiscan Repository
}
```

---

### 2. **UploadFilesUseCase** - Upload et Chiffrement de Fichiers

**Fichier :** `Backend/src/application/usecases/UploadFilesUseCase.ts`

#### Flux Complet

```typescript
async execute(request: UploadFileRequest): Promise<UploadFileResult>
```

**Entrée :**
```typescript
{
  repoObjectId: string;        // ID du repository Sui
  file: {
    buffer: Buffer;            // Contenu du fichier (plaintext)
    filename: string;
    mimeType?: string;
    size: number;
  };
  callerAddress: string;       // Adresse de l'uploader (doit être writer/owner)
}
```

**Étapes :**
1. **Vérification Permissions** : `suiChainService.isWriter(repoObjectId, callerAddress)`
2. **Récupération Policy** : `suiChainService.getRepositoryInfo(repoObjectId)` → Policy avec owner/writers/readers
3. **Génération FileKey** : `encryptionService.generateFileKey()` → `Buffer` (32 bytes)
4. **Chiffrement Fichier** : `encryptionService.encryptFile(file.buffer, fileKey)` → `EncryptionResult`
   - Retourne : `{ ciphertext, nonce, cipherSuite }`
5. **Scellement FileKey** : `sealService.sealKey(fileKey, policy)` → `SealedKey`
6. **Upload Ciphertext** : `walrusService.uploadBuffer(encryptionResult.ciphertext)` → `ciphertextBlobId`
7. **Upload Sealed Key** : `walrusService.uploadBuffer(sealedKey.sealedBlob)` → `sealedKeyBlobId`
8. **Calcul Hash** : `SHA256(ciphertext)` → `cipherHash` (hex)
9. **Création Entry Locale** : `localRepoIndexRepository.createStagedEntry(...)` → Staging (pas encore commité)

**Sortie :**
```typescript
{
  manifestEntryId: string;     // ID de l'entrée locale (staging)
  ciphertextBlobId: string;    // Blob ID Walrus du ciphertext
  sealedKeyBlobId: string;     // Blob ID Walrus de la clé scellée
  cipherHash: string;          // Hash SHA256 du ciphertext (hex)
  cipherSuite: string;         // 'xchacha20-poly1305' ou 'aes-256-gcm'
}
```

**Note :** Les fichiers sont **staged localement** mais **pas encore commités on-chain**.

---

### 3. **CommitUseCase** - Commit des Fichiers Staged ⬅️ **POINT D'INTÉGRATION TEE**

**Fichier :** `Backend/src/application/usecases/CommitUseCase.ts`

#### Flux Complet (Préparation)

```typescript
async execute(request: PrepareCommitRequest): Promise<PrepareCommitResult>
```

**Entrée :**
```typescript
{
  repoObjectId: string;        // ID du repository Sui
  authorAddress: string;      // Adresse de l'auteur (wallet)
  note?: string;              // Message de commit optionnel
}
```

**Étapes :**

1. **Récupération Entrées Staged** :
   ```typescript
   const stagedEntries = await localRepoIndexRepository.getStagedEntries(repoObjectId);
   // Retourne : LocalManifestEntry[]
   ```

2. **Construction Manifest JSON** :
   ```typescript
   const manifest = {
     version: '1.0',
     entries: stagedEntries.map(entry => ({
       filename: entry.filename,
       path: entry.path,
       ciphertextBlobId: entry.ciphertextBlobId,    // Blob ID Walrus
       sealedKeyBlobId: entry.sealedKeyBlobId,     // Blob ID Walrus
       cipherHash: entry.cipherHash,               // SHA256 hex
       cipherSuite: entry.cipherSuite,             // 'xchacha20-poly1305'
       size: entry.size,
       mimeType: entry.mimeType,
     })),
     note: note,
     timestamp: Date.now(),
   };
   const manifestJson = JSON.stringify(manifest, null, 2);
   ```

3. **Upload Manifest sur Walrus** :
   ```typescript
   const manifestBuffer = Buffer.from(manifestJson, 'utf-8');
   const manifestUpload = await walrusService.uploadBuffer(manifestBuffer);
   const manifestBlobId = manifestUpload.blobId;  // e.g., "wblb_abc123..."
   ```

4. **Calcul Merkle Root** :
   ```typescript
   const manifestHash = createHash('sha256').update(manifestJson).digest('hex');
   const merkleRoot = manifestHash;  // Pour MVP: simple hash du manifest
   ```

5. **Récupération HEAD Actuel** :
   ```typescript
   const currentHead = await suiChainService.getHeadCommitId(repoObjectId);
   const parentCommitId = currentHead || null;  // null pour premier commit
   ```

6. **🟢 POINT D'INTÉGRATION TEE NAUTILUS ICI 🟢**
   - **AVANT** : Manifest uploadé, Merkle root calculé
   - **APRÈS** : Préparation transaction Sui
   - **Action TEE** : Vérification d'intégrité, attestation, etc.

7. **Préparation Transaction Sui** :
   ```typescript
   const preparedTx = await suiChainService.preparePushCommit({
     repoObjectId,
     parentCommitId,
     manifestBlobId,
     merkleRoot,
     signerAddress: authorAddress,
   });
   ```

**Sortie :**
```typescript
{
  transactionBytes: string;    // Base64 - pour signature frontend
  manifestBlobId: string;      // Blob ID Walrus du manifest
  merkleRoot: string;           // Racine Merkle (hex)
  parentCommitId: string | null; // ID du commit parent
}
```

#### Exécution Transaction Signée

```typescript
async executeSignedTransaction(
  repoObjectId: string,
  parentCommitId: string | null,
  manifestBlobId: string,
  merkleRoot: string,
  transactionBytes: string,
  signature: string,
  publicKey: string,
  signerAddress: string
): Promise<CommitResult>
```

**Entrée :** Transaction signée par le frontend
**Sortie :**
```typescript
{
  commitObjectId: string;      // ID Sui du Commit créé
  manifestBlobId: string;
  merkleRoot: string;
  transactionHash: string;
  suiscanUrl: string;          // Lien Suiscan transaction
  commitSuiscanUrl: string;     // Lien Suiscan Commit
}
```

**Actions Post-Exécution :**
- Cache du commit localement
- Nettoyage des entrées staged (elles sont maintenant commitées)

---

## 🔗 Smart Contracts Move (Sui)

**Fichier :** `Move/sources/sirius.move`
**Package ID :** `0x95675ad3328961a00c76beaf2eec754f4d9b6e85b6bf785cfe0321460d96ee0e`
**Network :** Testnet

### Structures

#### `Repository`
```move
public struct Repository has key {
    id: UID,
    owner: address,                    // Propriétaire
    writers: vector<address>,           // Adresses autorisées à push
    readers: vector<address>,          // Adresses autorisées à read
    head: vector<u8>,                  // ID du commit HEAD (bytes)
    sealed_rmk_blob_id: vector<u8>,    // Blob ID Walrus du RMK scellé
    created_at_ms: u64,
}
```

#### `Commit`
```move
public struct Commit has key {
    id: UID,
    repo_id: ID,                       // ID du Repository
    parent: vector<u8>,                // ID du commit parent (empty pour premier)
    manifest_blob_id: vector<u8>,      // Blob ID Walrus du manifest JSON
    merkle_root: vector<u8>,           // Racine Merkle (hex bytes)
    author: address,                   // Auteur du commit
    timestamp_ms: u64,
}
```

### Fonctions Move

#### `create_repo(owner: address, sealed_rmk_blob_id: vector<u8>, ctx: &mut TxContext)`
- **Entrée :**
  - `owner: address` - Propriétaire du repository
  - `sealed_rmk_blob_id: vector<u8>` - Blob ID Walrus (UTF-8 bytes)
- **Action :** Crée un objet `Repository` partagé (shared object)
- **Retour :** Aucun (objet créé et partagé)

#### `push_commit(repo: &mut Repository, parent: vector<u8>, manifest_blob_id: vector<u8>, merkle_root: vector<u8>, ctx: &mut TxContext)`
- **Entrée :**
  - `repo: &mut Repository` - Repository à modifier
  - `parent: vector<u8>` - ID du commit parent (empty pour premier)
  - `manifest_blob_id: vector<u8>` - Blob ID Walrus du manifest (UTF-8 bytes)
  - `merkle_root: vector<u8>` - Racine Merkle (hex bytes)
- **Vérifications :**
  - Caller doit être `owner` ou dans `writers`
  - Anti-fork : `parent == repo.head` (sauf premier commit)
- **Action :** Crée un objet `Commit` et met à jour `repo.head`
- **Retour :** Aucun (objet créé et partagé)

#### `grant_reader(repo: &mut Repository, addr: address, ctx: &mut TxContext)`
- **Entrée :** `addr: address` - Adresse à ajouter comme reader
- **Vérification :** Caller doit être `owner`
- **Action :** Ajoute `addr` à `repo.readers`

#### `grant_writer(repo: &mut Repository, addr: address, ctx: &mut TxContext)`
- **Entrée :** `addr: address` - Adresse à ajouter comme writer
- **Vérification :** Caller doit être `owner`
- **Action :** Ajoute `addr` à `repo.writers`

### View Functions

#### `get_head(repo: &Repository): vector<u8>`
- Retourne `repo.head` (ID du commit HEAD)

#### `is_reader(repo: &Repository, addr: address): bool`
- Retourne `true` si `addr` est dans `readers` ou est `owner`

#### `is_writer(repo: &Repository, addr: address): bool`
- Retourne `true` si `addr` est dans `writers` ou est `owner`

#### `get_repo_info(repo: &Repository): (address, vector<address>, vector<address>, vector<u8>)`
- Retourne `(owner, writers, readers, head)`

---

## 🎯 Point d'Intégration TEE Nautilus

### Emplacement Recommandé

**Fichier :** `Backend/src/application/usecases/CommitUseCase.ts`
**Méthode :** `execute(request: PrepareCommitRequest)`
**Ligne approximative :** Après l'étape 4 (calcul Merkle root), avant l'étape 6 (préparation transaction)

### Code Actuel (Avant Intégration)

```typescript
// 4. Calculate Merkle root
const manifestHash = createHash('sha256').update(manifestJson).digest('hex');
const merkleRoot = manifestHash;
console.log(`[Commit] Merkle root: ${merkleRoot}`);

// 5. Get current head from Sui
const currentHead = await this.suiChainService.getHeadCommitId(repoObjectId);
const parentCommitId = currentHead || null;

// 6. Prepare transaction for frontend signing
const preparedTx = await this.suiChainService.preparePushCommit({...});
```

### Code Proposé (Avec Intégration TEE)

```typescript
// 4. Calculate Merkle root
const manifestHash = createHash('sha256').update(manifestJson).digest('hex');
const merkleRoot = manifestHash;
console.log(`[Commit] Merkle root: ${merkleRoot}`);

// 5. Get current head from Sui
const currentHead = await this.suiChainService.getHeadCommitId(repoObjectId);
const parentCommitId = currentHead || null;

// 🟢 INTÉGRATION TEE NAUTILUS ICI 🟢
// 5.5. TEE Verification & Attestation
const teeResult = await this.nautilusTeeService.verifyAndAttest({
  manifestBlobId,
  manifestJson,
  merkleRoot,
  stagedEntries: stagedEntries.map(e => ({
    ciphertextBlobId: e.ciphertextBlobId,
    sealedKeyBlobId: e.sealedKeyBlobId,
    cipherHash: e.cipherHash,
  })),
  repoObjectId,
  authorAddress,
});
// teeResult devrait contenir :
// - attestation: Buffer (preuve TEE)
// - verified: boolean
// - teeBlobId?: string (si on upload l'attestation sur Walrus)

// 6. Prepare transaction for frontend signing
// (Optionnel: inclure teeBlobId dans les métadonnées du manifest ou comme paramètre séparé)
const preparedTx = await this.suiChainService.preparePushCommit({
  repoObjectId,
  parentCommitId,
  manifestBlobId,
  merkleRoot,
  signerAddress: authorAddress,
  // teeAttestationBlobId?: teeResult.teeBlobId,  // Si on veut stocker l'attestation
});
```

### Interface Proposée pour TEE Service

```typescript
// Backend/src/domain/services/INautilusTeeService.ts

export interface INautilusTeeService {
  /**
   * Vérifie l'intégrité des blobs et génère une attestation TEE
   * Appelé après l'upload du manifest mais avant la préparation de la transaction Sui
   */
  verifyAndAttest(params: TeeVerifyParams): Promise<TeeAttestationResult>;
}

export interface TeeVerifyParams {
  manifestBlobId: string;              // Blob ID Walrus du manifest
  manifestJson: string;                // Contenu JSON du manifest
  merkleRoot: string;                  // Racine Merkle calculée
  stagedEntries: Array<{               // Entrées staged (pour vérification)
    ciphertextBlobId: string;
    sealedKeyBlobId: string;
    cipherHash: string;
  }>;
  repoObjectId: string;                // ID du repository Sui
  authorAddress: string;               // Adresse de l'auteur
}

export interface TeeAttestationResult {
  verified: boolean;                   // Si la vérification a réussi
  attestation: Buffer;                 // Preuve d'attestation TEE (à uploader sur Walrus)
  teeBlobId?: string;                  // Blob ID Walrus de l'attestation (si uploadé)
  verifiedAt: number;                  // Timestamp de vérification
  details?: {
    verifiedBlobs: string[];          // Liste des blob IDs vérifiés
    errors?: string[];                 // Erreurs éventuelles
  };
}
```

### Données Disponibles au Point d'Intégration

Au moment de l'intégration TEE, vous avez accès à :

1. **Manifest JSON** : Contenu complet du manifest avec toutes les entrées
2. **Manifest Blob ID** : ID Walrus du manifest uploadé
3. **Merkle Root** : Hash SHA256 du manifest
4. **Staged Entries** : Toutes les entrées avec :
   - `ciphertextBlobId` : Blob ID Walrus du fichier chiffré
   - `sealedKeyBlobId` : Blob ID Walrus de la clé scellée
   - `cipherHash` : Hash SHA256 du ciphertext
5. **Repository Info** : `repoObjectId`, `authorAddress`
6. **Parent Commit** : `parentCommitId` (ou null)

### Actions TEE Recommandées

1. **Vérification d'Intégrité** :
   - Télécharger les blobs depuis Walrus (`walrusService.downloadBlob()`)
   - Vérifier que les `cipherHash` correspondent aux blobs téléchargés
   - Vérifier que le manifest correspond au Merkle root

2. **Génération d'Attestation** :
   - Créer une attestation TEE prouvant que :
     - Les blobs sont intègres
     - Le manifest est valide
     - Le Merkle root est correct
     - L'auteur a les permissions

3. **Upload Attestation (Optionnel)** :
   - Uploader l'attestation sur Walrus
   - Obtenir un `teeBlobId` pour référence

4. **Inclusion dans Transaction (Optionnel)** :
   - Ajouter `teeBlobId` dans les métadonnées du manifest
   - Ou passer comme paramètre séparé à `push_commit`

---

## 📊 Structures de Données

### LocalManifestEntry (Staging)

```typescript
{
  id: string;                    // ID local (UUID)
  repoObjectId: string;          // ID du repository Sui
  filename: string;
  path: string | null;
  cipherSuite: string;           // 'xchacha20-poly1305'
  ciphertextBlobId: string;      // Blob ID Walrus
  sealedKeyBlobId: string;       // Blob ID Walrus
  cipherHash: string;            // SHA256 hex
  nonce: string | null;          // Nonce hex (pour déchiffrement)
  size: number;
  mimeType: string | null;
  metadata: any | null;
  createdAt: Date;
}
```

### Manifest JSON Structure

```json
{
  "version": "1.0",
  "entries": [
    {
      "filename": "example.txt",
      "path": null,
      "ciphertextBlobId": "wblb_abc123...",
      "sealedKeyBlobId": "wblb_def456...",
      "cipherHash": "a1b2c3d4...",
      "cipherSuite": "xchacha20-poly1305",
      "size": 1024,
      "mimeType": "text/plain"
    }
  ],
  "note": "Initial commit",
  "timestamp": 1234567890
}
```

---

## 🔄 Flux Complet (Avec TEE)

```
1. CREATE REPO
   ├─ Generate RMK
   ├─ Seal RMK
   ├─ Upload sealed RMK → Walrus
   ├─ Prepare Sui transaction
   ├─ Frontend signs
   └─ Execute → Repository object on Sui

2. UPLOAD FILES
   ├─ Verify permissions (writer/owner)
   ├─ Generate FileKey
   ├─ Encrypt file → ciphertext
   ├─ Seal FileKey
   ├─ Upload ciphertext → Walrus
   ├─ Upload sealed key → Walrus
   └─ Create LocalManifestEntry (staging)

3. COMMIT (AVEC TEE)
   ├─ Get staged entries
   ├─ Build manifest JSON
   ├─ Upload manifest → Walrus
   ├─ Calculate Merkle root
   ├─ Get current HEAD
   │
   ├─ 🟢 TEE VERIFICATION 🟢
   │  ├─ Download blobs from Walrus
   │  ├─ Verify cipherHash integrity
   │  ├─ Verify manifest integrity
   │  ├─ Generate TEE attestation
   │  └─ Upload attestation → Walrus (optional)
   │
   ├─ Prepare Sui transaction
   ├─ Frontend signs
   └─ Execute → Commit object on Sui
```

---

## 🔧 Configuration

### Variables d'Environnement

```env
# Sui Configuration
SUI_PACKAGE_ID=0x95675ad3328961a00c76beaf2eec754f4d9b6e85b6bf785cfe0321460d96ee0e
SUI_NETWORK=testnet  # testnet | mainnet | devnet

# Walrus Configuration
WALRUS_NETWORK=testnet  # testnet | mainnet | devnet

# TEE Configuration (à ajouter)
NAUTILUS_TEE_ENABLED=true
NAUTILUS_TEE_ENDPOINT=https://...
NAUTILUS_TEE_API_KEY=...
```

---

## 📝 Notes Importantes

1. **Sender Transaction** : Ne pas définir manuellement `tx.setSender()` - le wallet le définit automatiquement
2. **Seal Service** : Actuellement un placeholder AES-256-GCM - à remplacer par le vrai Seal SDK
3. **Merkle Root** : Pour MVP, simple hash SHA256 du manifest - peut être amélioré avec un vrai arbre Merkle
4. **Cache Local** : SQLite est un cache uniquement - la source de vérité est sur Sui Move
5. **Permissions** : Vérifiées on-chain via `isWriter()` / `isReader()` avant chaque opération

---

## 🚀 Prochaines Étapes pour Intégration TEE

1. Créer `INautilusTeeService` interface
2. Implémenter `NautilusTeeService` avec SDK Nautilus
3. Injecter dans `CommitUseCase` via Container
4. Appeler `verifyAndAttest()` après calcul Merkle root
5. Optionnel : Upload attestation sur Walrus
6. Optionnel : Inclure `teeBlobId` dans manifest ou transaction Sui

---

---

## 📚 Exemple de Code d'Intégration TEE

### Étape 1 : Créer l'Interface TEE Service

**Fichier :** `Backend/src/domain/services/INautilusTeeService.ts`

```typescript
export interface INautilusTeeService {
  verifyAndAttest(params: TeeVerifyParams): Promise<TeeAttestationResult>;
}

export interface TeeVerifyParams {
  manifestBlobId: string;
  manifestJson: string;
  merkleRoot: string;
  stagedEntries: Array<{
    ciphertextBlobId: string;
    sealedKeyBlobId: string;
    cipherHash: string;
  }>;
  repoObjectId: string;
  authorAddress: string;
}

export interface TeeAttestationResult {
  verified: boolean;
  attestation: Buffer;
  teeBlobId?: string;
  verifiedAt: number;
  details?: {
    verifiedBlobs: string[];
    errors?: string[];
  };
}
```

### Étape 2 : Implémenter le Service TEE

**Fichier :** `Backend/src/infrastructure/tee/NautilusTeeService.ts`

```typescript
import { INautilusTeeService, TeeVerifyParams, TeeAttestationResult } from '../../domain/services/INautilusTeeService';
import { IWalrusService } from '../../domain/services/IWalrusService';

export class NautilusTeeService implements INautilusTeeService {
  constructor(
    private readonly walrusService: IWalrusService
  ) {}

  async verifyAndAttest(params: TeeVerifyParams): Promise<TeeAttestationResult> {
    // 1. Télécharger les blobs depuis Walrus
    const verifiedBlobs: string[] = [];
    const errors: string[] = [];

    for (const entry of params.stagedEntries) {
      try {
        // Télécharger ciphertext
        const ciphertext = await this.walrusService.downloadBlob(entry.ciphertextBlobId);
        
        // Vérifier le hash
        const crypto = await import('crypto');
        const calculatedHash = crypto.createHash('sha256').update(ciphertext).digest('hex');
        
        if (calculatedHash !== entry.cipherHash) {
          errors.push(`Hash mismatch for blob ${entry.ciphertextBlobId}`);
          continue;
        }
        
        verifiedBlobs.push(entry.ciphertextBlobId);
      } catch (error) {
        errors.push(`Failed to verify blob ${entry.ciphertextBlobId}: ${error}`);
      }
    }

    // 2. Vérifier le manifest
    const manifestHash = crypto.createHash('sha256').update(params.manifestJson).digest('hex');
    if (manifestHash !== params.merkleRoot) {
      errors.push('Manifest hash mismatch');
    }

    // 3. Générer l'attestation TEE (à implémenter avec SDK Nautilus)
    const attestation = await this.generateTeeAttestation({
      manifestBlobId: params.manifestBlobId,
      merkleRoot: params.merkleRoot,
      verifiedBlobs,
      repoObjectId: params.repoObjectId,
      authorAddress: params.authorAddress,
    });

    // 4. Uploader l'attestation sur Walrus (optionnel)
    let teeBlobId: string | undefined;
    if (attestation) {
      const uploadResult = await this.walrusService.uploadBuffer(attestation);
      teeBlobId = uploadResult.blobId;
    }

    return {
      verified: errors.length === 0,
      attestation: attestation || Buffer.alloc(0),
      teeBlobId,
      verifiedAt: Date.now(),
      details: {
        verifiedBlobs,
        errors: errors.length > 0 ? errors : undefined,
      },
    };
  }

  private async generateTeeAttestation(data: any): Promise<Buffer> {
    // TODO: Implémenter avec SDK Nautilus
    // Retourner l'attestation TEE comme Buffer
    return Buffer.from(JSON.stringify(data));
  }
}
```

### Étape 3 : Modifier CommitUseCase

**Fichier :** `Backend/src/application/usecases/CommitUseCase.ts`

```typescript
// Ajouter dans le constructor
constructor(
  private readonly walrusService: IWalrusService,
  private readonly suiChainService: ISuiChainService,
  private readonly localRepoIndexRepository: ILocalRepoIndexRepository,
  private readonly nautilusTeeService: INautilusTeeService  // ← Ajouter
) {}

// Modifier execute()
async execute(request: PrepareCommitRequest): Promise<PrepareCommitResult> {
  // ... étapes 1-4 existantes ...

  // 5. Get current head from Sui
  const currentHead = await this.suiChainService.getHeadCommitId(repoObjectId);
  const parentCommitId = currentHead || null;

  // 🟢 INTÉGRATION TEE NAUTILUS 🟢
  console.log(`[Commit] Starting TEE verification...`);
  const teeResult = await this.nautilusTeeService.verifyAndAttest({
    manifestBlobId,
    manifestJson,
    merkleRoot,
    stagedEntries: stagedEntries.map(e => ({
      ciphertextBlobId: e.ciphertextBlobId,
      sealedKeyBlobId: e.sealedKeyBlobId,
      cipherHash: e.cipherHash,
    })),
    repoObjectId,
    authorAddress,
  });

  if (!teeResult.verified) {
    throw new Error(`TEE verification failed: ${teeResult.details?.errors?.join(', ')}`);
  }

  console.log(`[Commit] ✅ TEE verification passed. Attestation: ${teeResult.teeBlobId || 'not uploaded'}`);

  // 6. Prepare transaction for frontend signing
  const preparedTx = await this.suiChainService.preparePushCommit({
    repoObjectId,
    parentCommitId,
    manifestBlobId,
    merkleRoot,
    signerAddress: authorAddress,
  });

  // Retourner aussi teeBlobId si nécessaire
  return {
    transactionBytes: preparedTx.transactionBytes,
    manifestBlobId,
    merkleRoot,
    parentCommitId,
    // teeBlobId: teeResult.teeBlobId,  // Optionnel
  };
}
```

### Étape 4 : Mettre à jour Container

**Fichier :** `Backend/src/application/Container.ts`

```typescript
import { NautilusTeeService } from '../infrastructure/tee/NautilusTeeService';

// Dans le constructor
private constructor() {
  // ... services existants ...
  
  // TEE Service
  this.nautilusTeeService = new NautilusTeeService(this.walrusService);
  
  // Mettre à jour CommitUseCase
  this.commitUseCase = new CommitUseCase(
    this.walrusService,
    this.suiChainService,
    this.localRepoIndexRepository,
    this.nautilusTeeService  // ← Ajouter
  );
}
```

---

## 🔍 Détails Techniques Supplémentaires

### Format des Blob IDs Walrus

- **Format :** `wblb_<base58-encoded-hash>`
- **Exemple :** `wblb_2xK9pQmR7vN3tY8wZ5hJ4cL6bF1dA9sE0`
- **Taille :** Variable selon le contenu

### Format des Object IDs Sui

- **Format :** `0x<64-char-hex>`
- **Exemple :** `0x95675ad3328961a00c76beaf2eec754f4d9b6e85b6bf785cfe0321460d96ee0e`
- **Taille :** 66 caractères (0x + 64 hex)

### Chiffrement

- **Algorithme Principal :** XChaCha20-Poly1305
- **Taille Clé :** 32 bytes (256 bits)
- **Taille Nonce :** 24 bytes (192 bits)
- **Fallback :** AES-256-GCM (12 bytes IV)

### Scellement de Clés

- **Algorithme Actuel :** AES-256-GCM (placeholder)
- **Taille IV :** 12 bytes
- **Format Sealed Blob :** `[encrypted_key][auth_tag][iv]`
- **À Remplacer Par :** Seal SDK réel

---

## 📋 Checklist d'Intégration TEE

- [ ] Créer `INautilusTeeService` interface
- [ ] Implémenter `NautilusTeeService` avec SDK Nautilus
- [ ] Ajouter service dans `Container.ts`
- [ ] Injecter dans `CommitUseCase` constructor
- [ ] Appeler `verifyAndAttest()` dans `CommitUseCase.execute()`
- [ ] Gérer les erreurs de vérification TEE
- [ ] Optionnel : Upload attestation sur Walrus
- [ ] Optionnel : Inclure `teeBlobId` dans manifest ou transaction
- [ ] Tests unitaires pour TEE service
- [ ] Tests d'intégration avec flow complet

---

**Document créé le :** 2025-01-XX
**Version :** 1.0
**Auteur :** Backend Team

