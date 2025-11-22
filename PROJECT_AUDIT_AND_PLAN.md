# 🔍 AUDIT COMPLET DU PROJET SIRIUS - Data Layer

**Date:** 2025-01-20  
**Objectif:** Évaluer l'état actuel Frontend + Backend et planifier l'intégration complète

---

## 📊 ÉTAT ACTUEL

### ✅ **BACKEND - Ce qui est FAIT**

#### **Architecture & Structure**
- ✅ Clean Architecture (Domain, Application, Infrastructure)
- ✅ SOLID Principles appliqués
- ✅ Dependency Injection Container
- ✅ Prisma + SQLite configuré
- ✅ Tests unitaires (Jest)

#### **Domain Layer**
- ✅ Entities: `Dataset`, `ManifestEntry`, `VersionCommit`, `Keystore`
- ✅ Repository Interfaces: `IDatasetRepository`, `IManifestEntryRepository`, `IVersionCommitRepository`
- ✅ Service Interfaces: `ICryptoService`, `IMerkleService`, `IKeystoreService`

#### **Infrastructure Layer**
- ✅ `CryptoService` (Ed25519 signing/verification)
- ✅ `MerkleService` (Merkle tree computation)
- ✅ `FileKeystoreService` (local key storage)
- ✅ `DatasetRepository` (Prisma)
- ✅ `ManifestEntryRepository` (Prisma)
- ✅ `VersionCommitRepository` (Prisma)
- ✅ `SuiWalletService` (placeholder - wallet integration)
- ✅ `BlockchainAnchorService` (placeholder - Sui anchoring)
- ✅ `IPFSBackupService` (placeholder - IPFS backup)

#### **Application Layer (Use Cases)**
- ✅ `CreateDatasetUseCase`
- ✅ `AddManifestEntriesUseCase`
- ✅ `CommitVersionUseCase` (avec keystore local)
- ✅ `CommitVersionWithWalletUseCase` (avec Sui wallet - **NOUVEAU**)
- ✅ `ListDatasetsUseCase`
- ✅ `ListVersionsUseCase`
- ✅ `VerifyChainUseCase`
- ✅ `GenerateKeyUseCase`

#### **CLI**
- ✅ Commander.js CLI avec toutes les commandes
- ✅ `create-dataset`, `add-manifest`, `commit-version`, `list-versions`, etc.

#### **❌ CE QUI MANQUE DANS LE BACKEND**
1. **🚨 CRITIQUE: Pas de serveur HTTP/API**
   - Pas de `express` ou `fastify`
   - Pas de routes REST
   - Pas d'endpoints pour le frontend
   - Le backend est **CLI-only** actuellement

2. **Services incomplets:**
   - `SuiWalletService.verifySignature()` - placeholder
   - `SuiWalletService.getPublicKey()` - placeholder
   - `BlockchainAnchorService.anchor()` - placeholder
   - `IPFSBackupService.upload()` - placeholder

3. **Intégration Walrus:**
   - Pas de service pour upload vers Walrus
   - Pas de client Walrus SDK

---

### ✅ **FRONTEND - Ce qui est FAIT**

#### **Pages**
- ✅ `SiriusLanding.tsx` - Page d'accueil avec connexion wallet
- ✅ `Dashboard.tsx` - Liste des projets
- ✅ `ProjectDetails.tsx` - Détails d'un projet (tabs: Files, Versions, Activity)
- ✅ `UseSir.tsx` - Redirige vers `/sirius`
- ✅ Pages docs (Home, About, Docs)

#### **Composants**
- ✅ `ConnectWalletModal.tsx` - Modal de connexion (Slush, Phantom, MetaMask)
- ✅ `WalletInfo.tsx` - Info wallet + disconnect
- ✅ `CreateProjectModal.tsx` - Créer un projet
- ✅ `FileUploader.tsx` - Upload de fichiers (drag & drop)
- ✅ `FilesList.tsx` - Liste des fichiers non commités
- ✅ `CreateVersionModal.tsx` - Créer une version
- ✅ `VersionsList.tsx` - Liste des versions avec chain visualization

#### **State Management**
- ✅ Zustand stores: `useAuthStore`, `useUIStore`, `useProjectsStore`
- ✅ React Query pour server state
- ✅ `SuiWalletProvider` avec `@mysten/dapp-kit`

#### **Hooks**
- ✅ `useWallet.ts` - Gestion wallet (demo mode)
- ✅ `useProjects.ts` - Gestion projets (mock API)

#### **❌ CE QUI MANQUE DANS LE FRONTEND**
1. **🚨 CRITIQUE: Pas de service API réel**
   - `useProjects.ts` utilise `mockAPI` (simulation)
   - Pas de `api.ts` ou `services/api.ts`
   - Pas d'appels HTTP vers le backend

2. **Intégration Walrus:**
   - `FileUploader.tsx` simule l'upload
   - Pas de client Walrus SDK
   - Pas d'appel réel vers Walrus

3. **Pages incomplètes:**
   - `ProjectDetails.tsx` - Tab "Activity" vide
   - `ProjectDetails.tsx` - Tab "Collaborators" manquant
   - Pas de page `/verify/:versionId` pour vérifier une version

4. **Fonctionnalités manquantes:**
   - Pas de visualisation Merkle tree
   - Pas de page de vérification de chain
   - Pas de partage de versions

---

## 🔗 CONNEXION FRONTEND ↔️ BACKEND

### **Problème Principal**
Le backend est **CLI-only** et le frontend utilise des **mocks**. Il faut créer un **serveur HTTP** dans le backend et un **service API** dans le frontend.

---

## 📋 PLAN D'ACTION DÉTAILLÉ

### **PHASE 1: Créer le Serveur HTTP Backend** 🚀

#### **1.1 Installer les dépendances**
```bash
cd Backend
npm install express cors dotenv
npm install --save-dev @types/express @types/cors
```

#### **1.2 Créer la structure API**
```
Backend/src/
  api/
    routes/
      datasets.ts      # GET /api/datasets, POST /api/datasets
      projects.ts      # Alias pour datasets (pour le frontend)
      manifest.ts      # POST /api/manifest/entries
      versions.ts      # GET /api/versions, POST /api/versions
      verify.ts        # POST /api/verify/chain
    middleware/
      errorHandler.ts
      auth.ts          # Vérification wallet signature (optionnel)
    server.ts          # Express app setup
  index.ts             # Export API server
```

#### **1.3 Endpoints à créer**

**Datasets/Projects:**
- `GET /api/datasets` - Liste tous les datasets
- `GET /api/datasets/:id` - Détails d'un dataset
- `POST /api/datasets` - Créer un dataset
  ```json
  {
    "name": "Climate Research 2024",
    "description": "...",
    "ownerAddress": "0x..."
  }
  ```

**Manifest Entries:**
- `POST /api/manifest/entries` - Ajouter des entrées
  ```json
  {
    "datasetId": "...",
    "entries": [
      {
        "blobId": "walrus://...",
        "path": "data/file.csv",
        "size": 1024,
        "mimeType": "text/csv"
      }
    ]
  }
  ```
- `GET /api/manifest/entries?datasetId=...&uncommitted=true` - Liste des entrées

**Versions:**
- `GET /api/versions?datasetId=...` - Liste des versions
- `GET /api/versions/:id` - Détails d'une version
- `POST /api/versions/prepare` - Préparer un commit (retourne message à signer)
  ```json
  {
    "datasetId": "...",
    "includeAllEntries": false
  }
  ```
- `POST /api/versions` - Créer une version (avec signature)
  ```json
  {
    "datasetId": "...",
    "signature": "...",
    "publicKey": "...",
    "author": "0x...",
    "note": "...",
    "enableBlockchainAnchor": true,
    "enableIPFSBackup": true
  }
  ```

**Verify:**
- `POST /api/verify/chain` - Vérifier la chain
  ```json
  {
    "datasetId": "..."
  }
  ```

#### **1.4 Modifier `Backend/package.json`**
```json
{
  "scripts": {
    "api:dev": "ts-node src/api/server.ts",
    "api:start": "node dist/api/server.js"
  }
}
```

---

### **PHASE 2: Créer le Service API Frontend** 🌐

#### **2.1 Créer `Frontend/src/services/api.ts`**
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = {
  // Datasets
  getDatasets: (ownerAddress?: string) => fetch(...),
  getDataset: (id: string) => fetch(...),
  createDataset: (data: CreateDatasetInput) => fetch(...),
  
  // Manifest
  addManifestEntries: (datasetId: string, entries: ManifestEntryInput[]) => fetch(...),
  getManifestEntries: (datasetId: string, uncommitted?: boolean) => fetch(...),
  
  // Versions
  getVersions: (datasetId: string) => fetch(...),
  getVersion: (id: string) => fetch(...),
  prepareCommit: (datasetId: string) => fetch(...),
  createVersion: (data: CreateVersionInput) => fetch(...),
  
  // Verify
  verifyChain: (datasetId: string) => fetch(...),
};
```

#### **2.2 Modifier `useProjects.ts`**
- Remplacer `mockAPI` par les vrais appels à `api`
- Gérer les erreurs HTTP
- Utiliser React Query correctement

#### **2.3 Créer `Frontend/src/services/walrus.ts`**
- Client Walrus SDK
- Fonction `uploadToWalrus(file: File): Promise<{ blobId: string }>`

#### **2.4 Modifier `FileUploader.tsx`**
- Utiliser `uploadToWalrus()` au lieu du mock
- Appeler `api.addManifestEntries()` après upload

---

### **PHASE 3: Compléter les Pages Frontend** 🎨

#### **3.1 Compléter `ProjectDetails.tsx`**
- Tab "Activity" - Afficher l'historique des actions
- Tab "Collaborators" - Gérer les collaborateurs (si multi-sig)

#### **3.2 Créer page `/verify/:versionId`**
- Afficher les détails d'une version
- Vérifier la signature
- Afficher le Merkle tree
- Lien vers Sui explorer si `suiTxHash` existe

#### **3.3 Améliorer `VersionsList.tsx`**
- Connecter aux vraies données
- Implémenter "Verify Chain" button
- Implémenter "View Details" button

---

### **PHASE 4: Intégration Walrus** 🐋

#### **4.1 Installer Walrus SDK**
```bash
cd Frontend
npm install @walrus-protocol/sdk  # ou le package officiel
```

#### **4.2 Configurer Walrus**
- Endpoint Walrus testnet
- API keys si nécessaire

#### **4.3 Implémenter upload réel**
- Dans `FileUploader.tsx`
- Gérer le progress
- Gérer les erreurs

---

### **PHASE 5: Implémenter les Services Placeholder** 🔧

#### **5.1 `SuiWalletService`**
- Utiliser `@mysten/sui` pour vérifier les signatures
- Implémenter `verifySignature()`
- Implémenter `getPublicKey()`

#### **5.2 `BlockchainAnchorService`**
- Utiliser `@mysten/sui` pour envoyer des transactions
- Implémenter `anchor()` - Envoyer `versionRoot` sur Sui
- Implémenter `verifyAnchor()` - Vérifier sur Sui

#### **5.3 `IPFSBackupService`**
- Utiliser `ipfs-http-client` ou `web3.storage`
- Implémenter `upload()` - Backup vers IPFS
- Implémenter `retrieve()` - Récupérer depuis IPFS

---

## 🎯 PRIORITÉS

### **URGENT (Pour que ça marche)**
1. ✅ Créer serveur HTTP Express dans le backend
2. ✅ Créer les routes API (datasets, versions, manifest)
3. ✅ Créer service API frontend
4. ✅ Connecter `useProjects.ts` au vrai backend
5. ✅ Connecter `FileUploader` au vrai backend

### **IMPORTANT (Pour une expérience complète)**
6. ✅ Intégrer Walrus SDK
7. ✅ Implémenter `prepareCommit` + `createVersion` flow
8. ✅ Compléter les pages frontend manquantes

### **NICE TO HAVE (Améliorations)**
9. ✅ Implémenter les services placeholder (Sui, IPFS)
10. ✅ Ajouter visualisation Merkle tree
11. ✅ Ajouter page de vérification

---

## 📝 PROCHAINES ÉTAPES IMMÉDIATES

1. **Créer le serveur Express** dans `Backend/src/api/server.ts`
2. **Créer les routes** pour datasets, versions, manifest
3. **Créer le service API** dans `Frontend/src/services/api.ts`
4. **Remplacer les mocks** dans `useProjects.ts`
5. **Tester l'intégration** end-to-end

---

## 🔍 FICHIERS À CRÉER/MODIFIER

### **Backend:**
- `Backend/src/api/server.ts` (NOUVEAU)
- `Backend/src/api/routes/datasets.ts` (NOUVEAU)
- `Backend/src/api/routes/versions.ts` (NOUVEAU)
- `Backend/src/api/routes/manifest.ts` (NOUVEAU)
- `Backend/package.json` (MODIFIER - ajouter express, cors)

### **Frontend:**
- `Frontend/src/services/api.ts` (NOUVEAU)
- `Frontend/src/services/walrus.ts` (NOUVEAU)
- `Frontend/src/hooks/useProjects.ts` (MODIFIER - remplacer mockAPI)
- `Frontend/src/components/files/FileUploader.tsx` (MODIFIER - vrai upload)
- `Frontend/src/components/versions/CreateVersionModal.tsx` (MODIFIER - vrai API)
- `Frontend/.env` (NOUVEAU - `VITE_API_URL=http://localhost:3000/api`)

---

## ✅ CHECKLIST FINALE

- [ ] Backend: Serveur Express créé
- [ ] Backend: Routes API créées
- [ ] Backend: Endpoints testés avec Postman/curl
- [ ] Frontend: Service API créé
- [ ] Frontend: useProjects connecté au backend
- [ ] Frontend: FileUploader connecté au backend
- [ ] Frontend: CreateVersion connecté au backend
- [ ] Walrus: SDK intégré
- [ ] Tests: End-to-end fonctionnel
- [ ] Documentation: README mis à jour

---

**Prêt à commencer?** 🚀

