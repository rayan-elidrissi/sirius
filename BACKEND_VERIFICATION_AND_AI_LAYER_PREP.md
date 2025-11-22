# 🔍 VÉRIFICATION BACKEND + PRÉPARATION AI LAYER

**Date:** 2025-01-20  
**Objectif:** Vérifier la complétude de la Data Layer et préparer l'intégration de l'AI Layer

---

## ✅ VÉRIFICATION DATA LAYER

### **1. ENTITIES (Domain Layer)**

#### ✅ **Dataset**
- ✅ `id`, `name`, `description`, `createdAt`
- ✅ Relations: `manifestEntries`, `versionCommits`
- ✅ **STATUS:** ✅ COMPLET

#### ✅ **ManifestEntry**
- ✅ `id`, `datasetId`, `blobId` (Walrus), `path`, `metadata`
- ✅ `metadata` flexible (JSON) - peut stocker `mimeType`, `size`, `checksum`
- ✅ **STATUS:** ✅ COMPLET
- ⚠️ **NOTE:** `metadata` est déjà flexible pour ajouter des champs AI plus tard

#### ✅ **VersionCommit**
- ✅ `id`, `datasetId`, `versionRoot` (Merkle), `parentRoot` (chain)
- ✅ `signature`, `publicKey`, `author` (Sui address)
- ✅ Blockchain: `suiTxHash`, `blockHeight`, `blockTimestamp`
- ✅ IPFS: `ipfsCID`, `ipfsUrl`
- ✅ Multi-sig: `isMultiSig`, `requiredSigs`
- ✅ **STATUS:** ✅ COMPLET

#### ✅ **VersionSignature**
- ✅ Support multi-sig
- ✅ **STATUS:** ✅ COMPLET

---

### **2. REPOSITORIES**

#### ✅ **IDatasetRepository**
- ✅ CRUD complet
- ✅ **STATUS:** ✅ COMPLET

#### ✅ **IManifestEntryRepository**
- ✅ CRUD complet
- ✅ `findUncommittedByDatasetId()` - pour les fichiers non commités
- ✅ **STATUS:** ✅ COMPLET

#### ✅ **IVersionCommitRepository**
- ✅ CRUD complet
- ✅ `findLatestByDatasetId()` - pour la chain
- ✅ `findByVersionRoot()` - pour vérification
- ✅ **STATUS:** ✅ COMPLET

---

### **3. SERVICES (Infrastructure)**

#### ✅ **CryptoService**
- ✅ Ed25519 signing/verification
- ✅ SHA256 hashing
- ✅ **STATUS:** ✅ COMPLET

#### ✅ **MerkleService**
- ✅ `computeManifestRoot()` - calcule le Merkle root
- ✅ `verifyManifestRoot()` - vérifie l'intégrité
- ✅ **STATUS:** ✅ COMPLET

#### ⚠️ **SuiWalletService** (Placeholder)
- ⚠️ `verifySignature()` - placeholder
- ⚠️ `getPublicKey()` - placeholder
- ⚠️ `createCommitMessage()` - existe
- **STATUS:** ⚠️ PARTIEL (à implémenter avec `@mysten/sui`)

#### ⚠️ **BlockchainAnchorService** (Placeholder)
- ⚠️ `anchor()` - placeholder
- ⚠️ `verifyAnchor()` - placeholder
- **STATUS:** ⚠️ PARTIEL (à implémenter avec `@mysten/sui`)

#### ⚠️ **IPFSBackupService** (Placeholder)
- ⚠️ `upload()` - placeholder
- ⚠️ `retrieve()` - placeholder
- **STATUS:** ⚠️ PARTIEL (à implémenter avec `ipfs-http-client`)

#### ❌ **WalrusService** (MANQUANT)
- ❌ Pas de service pour upload/retrieve vers Walrus
- ❌ Pas de client Walrus SDK
- **STATUS:** ❌ MANQUANT - **CRITIQUE POUR LA DATA LAYER**

---

### **4. USE CASES**

#### ✅ **CreateDatasetUseCase**
- ✅ Crée un dataset
- **STATUS:** ✅ COMPLET

#### ✅ **AddManifestEntriesUseCase**
- ✅ Ajoute des entrées au manifest
- **STATUS:** ✅ COMPLET

#### ✅ **CommitVersionUseCase**
- ✅ Crée une version avec Merkle root + signature
- ✅ Support keystore local
- **STATUS:** ✅ COMPLET

#### ✅ **CommitVersionWithWalletUseCase**
- ✅ Crée une version avec Sui wallet
- ✅ Support blockchain anchoring (optionnel)
- ✅ Support IPFS backup (optionnel)
- ✅ `prepareCommit()` - prépare le message à signer
- **STATUS:** ✅ COMPLET

#### ✅ **ListVersionsUseCase**
- ✅ Liste les versions d'un dataset
- **STATUS:** ✅ COMPLET

#### ✅ **VerifyChainUseCase**
- ✅ Vérifie l'intégrité de la chain
- **STATUS:** ✅ COMPLET

---

## 🚨 CE QUI MANQUE POUR LA DATA LAYER

### **CRITIQUE:**
1. ❌ **WalrusService** - Upload/retrieve vers Walrus
2. ⚠️ **SuiWalletService** - Implémentation réelle (actuellement placeholder)
3. ⚠️ **BlockchainAnchorService** - Implémentation réelle (actuellement placeholder)
4. ⚠️ **IPFSBackupService** - Implémentation réelle (actuellement placeholder)

---

## 🧠 PRÉPARATION POUR L'AI LAYER

### **ANALYSE DES BESOINS AI LAYER**

L'AI Layer a besoin de stocker:

1. **Fingerprints** (par dataset/version)
   - Statistical fingerprint (moyenne, variance, entropie, taille)
   - MinHash sketch (array de hash)
   - Embedding fingerprint (vecteur 64-128 dimensions)

2. **Risk Scores** (par comparaison de nœuds)
   - `risk_score` (0-1)
   - `similarity_stats`, `similarity_minhash`, `similarity_embedding`
   - `detected_at`, `node_a`, `node_b`

3. **Integrity Scores** (par nœud Walrus)
   - `node_id`
   - `integrity_score` (0-1)
   - `recent_risks` (historique)
   - `status` (ok/suspicious/faulty)

4. **Reproducibility Receipts** (par run IA)
   - `model_id`, `code_hash`
   - `dataset_id`, `version_root`
   - `hyperparams`, `metrics`
   - `receipt_hash` (pour Sui)

5. **Global Snapshots** (par epoch)
   - `snapshot_hash`
   - `integrity_scores` (tous les nœuds)
   - `anomalies_detected`
   - `anchored_on_sui` (tx hash)

---

## 📊 MODIFICATIONS NÉCESSAIRES POUR L'AI LAYER

### **1. NOUVELLES ENTITIES (Domain)**

#### **Fingerprint Entity**
```typescript
// Backend/src/domain/entities/Fingerprint.ts
export interface Fingerprint {
  id: string;
  datasetId: string;
  versionCommitId: string | null; // null = fingerprint du dataset global
  fingerprintType: 'statistical' | 'minhash' | 'embedding' | 'combined';
  
  // Statistical fingerprint
  stats?: {
    mean?: number;
    variance?: number;
    entropy?: number;
    size: number;
    hash: string; // SHA256
  };
  
  // MinHash sketch
  minhash?: number[]; // Array de hash values
  
  // Embedding fingerprint
  embedding?: number[]; // Vecteur 64-128 dimensions
  embeddingModel?: string; // "sentence-transformers/all-MiniLM-L6-v2"
  
  // Combined fingerprint hash
  rootHash: string; // SHA256(stats + minhash + embedding)
  
  createdAt: Date;
}
```

#### **RiskScore Entity**
```typescript
// Backend/src/domain/entities/RiskScore.ts
export interface RiskScore {
  id: string;
  datasetId: string;
  nodeA: string; // Walrus node ID
  nodeB: string; // Walrus node ID
  riskScore: number; // 0-1
  similarityStats: number;
  similarityMinhash: number;
  similarityEmbedding: number;
  threshold: 'normal' | 'alert' | 'critical';
  detectedAt: Date;
  anchoredOnSui: boolean;
  suiTxHash?: string;
}
```

#### **NodeIntegrity Entity**
```typescript
// Backend/src/domain/entities/NodeIntegrity.ts
export interface NodeIntegrity {
  id: string;
  nodeId: string; // Walrus node ID
  integrityScore: number; // 0-1 (EMA)
  status: 'ok' | 'suspicious' | 'faulty';
  recentRisks: number[]; // Historique des risk scores
  lastUpdated: Date;
  createdAt: Date;
}
```

#### **ReproducibilityReceipt Entity**
```typescript
// Backend/src/domain/entities/ReproducibilityReceipt.ts
export interface ReproducibilityReceipt {
  id: string;
  modelId: string;
  codeHash: string; // SHA256 du code
  datasetId: string;
  versionRoot: string;
  hyperparams: Record<string, unknown>;
  metrics: Record<string, unknown>;
  receiptHash: string; // SHA256 pour Sui
  suiTxHash?: string; // Si ancré sur Sui
  createdAt: Date;
}
```

#### **GlobalSnapshot Entity**
```typescript
// Backend/src/domain/entities/GlobalSnapshot.ts
export interface GlobalSnapshot {
  id: string;
  snapshotHash: string;
  integrityScores: Record<string, number>; // nodeId -> score
  anomaliesDetected: string[]; // IDs des anomalies
  anchoredOnSui: boolean;
  suiTxHash?: string;
  createdAt: Date;
}
```

---

### **2. NOUVEAUX REPOSITORIES**

#### **IFingerprintRepository**
```typescript
// Backend/src/domain/repositories/IFingerprintRepository.ts
export interface IFingerprintRepository {
  create(input: CreateFingerprintInput): Promise<Fingerprint>;
  findByVersionCommitId(versionCommitId: string): Promise<Fingerprint[]>;
  findByDatasetId(datasetId: string): Promise<Fingerprint[]>;
  findLatestByDatasetId(datasetId: string): Promise<Fingerprint | null>;
}
```

#### **IRiskScoreRepository**
```typescript
// Backend/src/domain/repositories/IRiskScoreRepository.ts
export interface IRiskScoreRepository {
  create(input: CreateRiskScoreInput): Promise<RiskScore>;
  findByDatasetId(datasetId: string): Promise<RiskScore[]>;
  findCriticalRisks(threshold?: number): Promise<RiskScore[]>;
}
```

#### **INodeIntegrityRepository**
```typescript
// Backend/src/domain/repositories/INodeIntegrityRepository.ts
export interface INodeIntegrityRepository {
  createOrUpdate(nodeId: string, score: number, status: string): Promise<NodeIntegrity>;
  findByNodeId(nodeId: string): Promise<NodeIntegrity | null>;
  findAll(): Promise<NodeIntegrity[]>;
  findSuspiciousNodes(): Promise<NodeIntegrity[]>;
}
```

#### **IReproducibilityReceiptRepository**
```typescript
// Backend/src/domain/repositories/IReproducibilityReceiptRepository.ts
export interface IReproducibilityReceiptRepository {
  create(input: CreateReceiptInput): Promise<ReproducibilityReceipt>;
  findByDatasetId(datasetId: string): Promise<ReproducibilityReceipt[]>;
  findByVersionRoot(versionRoot: string): Promise<ReproducibilityReceipt[]>;
}
```

#### **IGlobalSnapshotRepository**
```typescript
// Backend/src/domain/repositories/IGlobalSnapshotRepository.ts
export interface IGlobalSnapshotRepository {
  create(input: CreateSnapshotInput): Promise<GlobalSnapshot>;
  findLatest(): Promise<GlobalSnapshot | null>;
  findBySuiTxHash(txHash: string): Promise<GlobalSnapshot | null>;
}
```

---

### **3. NOUVEAUX SERVICES (AI Layer)**

#### **IFingerprintingService**
```typescript
// Backend/src/domain/services/IFingerprintingService.ts
export interface IFingerprintingService {
  // Génère les 3 types de fingerprints
  generateStatisticalFingerprint(data: Buffer): Promise<StatisticalFingerprint>;
  generateMinHashFingerprint(data: Buffer): Promise<number[]>;
  generateEmbeddingFingerprint(data: Buffer): Promise<number[]>;
  
  // Combine tous les fingerprints
  generateCombinedFingerprint(data: Buffer): Promise<Fingerprint>;
  
  // Compare deux fingerprints
  compareFingerprints(fp1: Fingerprint, fp2: Fingerprint): Promise<ComparisonResult>;
}
```

#### **IDivergenceDetectionService**
```typescript
// Backend/src/domain/services/IDivergenceDetectionService.ts
export interface IDivergenceDetectionService {
  // Compare deux nœuds Walrus
  detectDivergence(
    nodeA: string,
    nodeB: string,
    datasetId: string
  ): Promise<RiskScore>;
  
  // Calcule le risk score
  calculateRiskScore(
    similarityStats: number,
    similarityMinhash: number,
    similarityEmbedding: number
  ): number;
  
  // Détermine le seuil
  getRiskThreshold(riskScore: number): 'normal' | 'alert' | 'critical';
}
```

#### **IIntegrityEngineService**
```typescript
// Backend/src/domain/services/IIntegrityEngineService.ts
export interface IIntegrityEngineService {
  // Met à jour l'intégrité d'un nœud (EMA)
  updateNodeIntegrity(
    nodeId: string,
    riskScore: number,
    alpha?: number // EMA coefficient (default 0.3)
  ): Promise<NodeIntegrity>;
  
  // Génère un snapshot global
  generateGlobalSnapshot(): Promise<GlobalSnapshot>;
  
  // Détecte les anomalies
  detectAnomalies(snapshot: GlobalSnapshot): Promise<string[]>;
}
```

#### **IReceiptService**
```typescript
// Backend/src/domain/services/IReceiptService.ts
export interface IReceiptService {
  // Génère un receipt pour un run IA
  generateReceipt(input: GenerateReceiptInput): Promise<ReproducibilityReceipt>;
  
  // Calcule le receipt hash
  calculateReceiptHash(receipt: ReproducibilityReceipt): string;
  
  // Vérifie un receipt
  verifyReceipt(receipt: ReproducibilityReceipt): boolean;
}
```

---

### **4. MODIFICATIONS SCHEMA PRISMA**

#### **Nouvelles Tables**
```prisma
// Fingerprints
model Fingerprint {
  id              String   @id @default(uuid())
  datasetId       String
  versionCommitId String?
  fingerprintType String   // 'statistical' | 'minhash' | 'embedding' | 'combined'
  statsJson       String?  // JSON: {mean, variance, entropy, size, hash}
  minhashJson     String?  // JSON: [number, number, ...]
  embeddingJson   String?  // JSON: [number, number, ...]
  embeddingModel  String?
  rootHash        String
  createdAt       DateTime @default(now())
  
  dataset         Dataset  @relation(fields: [datasetId], references: [id])
  versionCommit   VersionCommit? @relation(fields: [versionCommitId], references: [id])
  
  @@index([datasetId])
  @@index([versionCommitId])
  @@index([rootHash])
}

// Risk Scores
model RiskScore {
  id                  String   @id @default(uuid())
  datasetId           String
  nodeA               String
  nodeB               String
  riskScore           Float
  similarityStats     Float
  similarityMinhash   Float
  similarityEmbedding  Float
  threshold           String   // 'normal' | 'alert' | 'critical'
  detectedAt          DateTime @default(now())
  anchoredOnSui       Boolean  @default(false)
  suiTxHash           String?
  
  dataset             Dataset  @relation(fields: [datasetId], references: [id])
  
  @@index([datasetId])
  @@index([nodeA, nodeB])
  @@index([threshold])
}

// Node Integrity
model NodeIntegrity {
  id            String   @id @default(uuid())
  nodeId        String   @unique
  integrityScore Float
  status        String   // 'ok' | 'suspicious' | 'faulty'
  recentRisksJson String // JSON: [number, number, ...]
  lastUpdated   DateTime @default(now())
  createdAt     DateTime @default(now())
  
  @@index([status])
  @@index([integrityScore])
}

// Reproducibility Receipts
model ReproducibilityReceipt {
  id            String   @id @default(uuid())
  modelId       String
  codeHash      String
  datasetId     String
  versionRoot   String
  hyperparamsJson String // JSON
  metricsJson   String   // JSON
  receiptHash   String
  suiTxHash     String?
  createdAt     DateTime @default(now())
  
  dataset       Dataset  @relation(fields: [datasetId], references: [id])
  
  @@index([datasetId])
  @@index([versionRoot])
  @@index([receiptHash])
}

// Global Snapshots
model GlobalSnapshot {
  id                String   @id @default(uuid())
  snapshotHash      String   @unique
  integrityScoresJson String // JSON: {nodeId: score, ...}
  anomaliesJson     String   // JSON: [string, ...]
  anchoredOnSui     Boolean  @default(false)
  suiTxHash         String?
  createdAt         DateTime @default(now())
  
  @@index([snapshotHash])
  @@index([createdAt])
}
```

#### **Modifications Tables Existantes**
```prisma
// Ajouter relation Fingerprint dans Dataset
model Dataset {
  // ... existing fields
  fingerprints Fingerprint[]
}

// Ajouter relation Fingerprint dans VersionCommit
model VersionCommit {
  // ... existing fields
  fingerprints Fingerprint[]
  riskScores    RiskScore[]
}

// Ajouter relation Receipt dans Dataset
model Dataset {
  // ... existing fields
  receipts ReproducibilityReceipt[]
}
```

---

## 🎯 PLAN D'INTÉGRATION AI LAYER

### **ÉTAPE 1: Préparer le Schéma (Sans casser l'existant)**
1. ✅ Créer les nouvelles entities (Fingerprint, RiskScore, etc.)
2. ✅ Créer les nouveaux repositories interfaces
3. ✅ Modifier Prisma schema (ajouter les tables)
4. ✅ Migration Prisma

### **ÉTAPE 2: Implémenter les Services AI**
1. ✅ `FingerprintingService` - Statistical, MinHash, Embedding
2. ✅ `DivergenceDetectionService` - Risk score calculation
3. ✅ `IntegrityEngineService` - Node integrity scoring
4. ✅ `ReceiptService` - Reproducibility receipts

### **ÉTAPE 3: Créer les Use Cases AI**
1. ✅ `GenerateFingerprintUseCase`
2. ✅ `DetectDivergenceUseCase`
3. ✅ `UpdateIntegrityUseCase`
4. ✅ `GenerateReceiptUseCase`
5. ✅ `GenerateSnapshotUseCase`

### **ÉTAPE 4: Intégrer avec la Data Layer**
1. ✅ Appeler `GenerateFingerprintUseCase` après chaque `CommitVersionUseCase`
2. ✅ Appeler `DetectDivergenceUseCase` périodiquement (cron job)
3. ✅ Appeler `UpdateIntegrityUseCase` après chaque divergence détectée
4. ✅ Appeler `GenerateSnapshotUseCase` périodiquement

---

## ✅ CHECKLIST FINALE

### **DATA LAYER:**
- [x] Entities complètes
- [x] Repositories complets
- [x] Services de base (Crypto, Merkle)
- [ ] ⚠️ WalrusService (MANQUANT - CRITIQUE)
- [ ] ⚠️ SuiWalletService (Placeholder - à implémenter)
- [ ] ⚠️ BlockchainAnchorService (Placeholder - à implémenter)
- [ ] ⚠️ IPFSBackupService (Placeholder - à implémenter)

### **AI LAYER PREPARATION:**
- [ ] Entities AI créées
- [ ] Repositories AI créés
- [ ] Services AI créés
- [ ] Schema Prisma étendu
- [ ] Use Cases AI créés
- [ ] Intégration avec Data Layer

---

## 🚀 PROCHAINES ÉTAPES

1. **CRITIQUE:** Créer `WalrusService` pour la Data Layer
2. **IMPORTANT:** Préparer le schéma Prisma pour l'AI Layer (sans casser l'existant)
3. **IMPORTANT:** Créer les entities AI Layer
4. **NICE TO HAVE:** Implémenter les services placeholder (Sui, IPFS)

---

**STATUS GLOBAL:** ✅ Data Layer architecture solide, prête pour l'AI Layer avec quelques ajouts

