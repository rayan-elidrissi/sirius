# Sirius Data Layer

**Trust and Traceability for Walrus Distributed Storage**

Sirius Data Layer provides cryptographic integrity and versioning for datasets stored on Walrus. It creates an immutable chain of versions using Merkle trees and Ed25519 signatures, enabling verifiable data provenance without requiring on-chain transactions for every commit.

---

## 🏗️ Architecture

Built with **Clean Architecture** and **SOLID** principles:

```
┌─────────────────────────────────────────────────────────────┐
│                        CLI Interface                         │
├─────────────────────────────────────────────────────────────┤
│                    Application Layer                         │
│  (Use Cases: CreateDataset, CommitVersion, VerifyChain)     │
├─────────────────────────────────────────────────────────────┤
│                      Domain Layer                            │
│   (Entities, Interfaces, Business Logic)                    │
├─────────────────────────────────────────────────────────────┤
│                  Infrastructure Layer                        │
│  (Repositories, Crypto, Merkle, Keystore, Database)         │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

- **Merkle Tree**: Computes fingerprints (roots) of dataset manifests
- **Ed25519 Signing**: Cryptographically signs each version commit
- **Version Chain/DAG**: Links versions via `parentRoot` for traceable history
- **SQLite Database**: Persists datasets, manifests, and version commits locally

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.x or higher
- **Walrus CLI** configured with an active Sui wallet
- **Sui CLI** for testnet interaction

### Installation

```bash
# Navigate to Backend directory
cd Backend

# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Initialize database
npm run dev init-db

# Generate signing keypair
npm run dev generate-key
```

This will:
1. Create a SQLite database at `prisma/sirius.db`
2. Generate an Ed25519 keypair saved to `keystore.json`
3. Display your public key (save this for later verification)

---

## 📋 CLI Commands

### 1. Initialize Database

```bash
npm run dev init-db
```

Creates the SQLite database and runs migrations.

### 2. Generate Keypair

```bash
npm run dev generate-key
```

Generates an Ed25519 keypair for signing commits. The public key is displayed; the private key is stored securely in `keystore.json`.

**⚠️ Security**: Keep `keystore.json` private! Add it to `.gitignore`.

### 3. Create Dataset

```bash
npm run dev create-dataset -- --name "My Dataset" --description "Dataset description"
```

Creates a new dataset and prints its ID. Save this ID for subsequent commands.

### 4. List Datasets

```bash
npm run dev list-datasets
```

Lists all datasets with their IDs.

### 5. Add Manifest Entries

```bash
npm run dev add-manifest -- --dataset <DATASET_ID> --entries-file samples/sample-manifest.json
```

Adds Walrus blob references to a dataset. The entries file should be JSON:

```json
[
  {
    "blobId": "wblb...",
    "path": "file1.txt",
    "metadata": {
      "mimeType": "text/plain",
      "size": 1024,
      "checksum": "sha256:..."
    }
  }
]
```

### 6. Commit Version

```bash
npm run dev commit-version -- --dataset <DATASET_ID> [--author <AUTHOR>] [--all]
```

Commits a new version:
- Computes Merkle root of manifest entries
- Links to previous version via `parentRoot`
- Signs the commit with your keypair
- Saves to database

Flags:
- `--author`: Optional author identifier (e.g., Sui address)
- `--all`: Include all entries (default: only uncommitted entries)

### 7. List Versions

```bash
npm run dev list-versions -- --dataset <DATASET_ID>
```

Lists all version commits with their Merkle roots and parent links, displaying the version chain structure.

### 8. Verify Chain

```bash
npm run dev verify-chain -- --dataset <DATASET_ID>
```

Verifies the integrity of the entire version chain:
- ✅ Merkle root correctness (re-computes and compares)
- ✅ Signature validity (verifies Ed25519 signatures)
- ✅ Parent link integrity (checks chain consistency)

---

## 🌊 Walrus Integration Guide

### Step 1: Verify Walrus & Sui Setup

**DO NOT create new wallets!** Use your existing configured wallet.

```bash
# Check Sui active address
sui client active-address
# Expected: 0x635c3e8edf5fb402b229932cdf5c1ea26a49866f430ceb67547271fccd14c897

# Check balances
sui client gas
# You should have ~1.48 SUI and ~0.18 WAL
```

### Step 2: Check Walrus Configuration

```bash
# View Walrus info
walrus info

# List your existing blobs
walrus list-blobs
```

If you need more WAL tokens on testnet:

```bash
# Get test WAL tokens (if needed)
walrus get-wal
```

---

## 🧪 End-to-End Testing with Walrus Testnet

Follow these steps to test the Data Layer against real Walrus blobs.

### Test Scenario: Dataset with 2 Files, 2 Versions

#### Step 1: Upload Sample Files to Walrus

I've created sample files in `Backend/samples/`:
- `sample1.csv` - Sample CSV data
- `sample2.txt` - Sample text file

---

**=== ACTION REQUIRED (Step 1a) ===**

Please run these commands in your terminal to upload the sample files to Walrus:

```bash
cd Backend/samples
walrus store sample1.csv
```

**Paste the full output here so I can extract the blob ID.**

---

Once you provide the output from `walrus store sample1.csv`, I'll guide you to:
1. Store `sample2.txt`
2. Extract both blob IDs
3. Create a manifest JSON file
4. Create a dataset in Sirius
5. Add the manifest entries
6. Commit the first version
7. Add more entries and commit a second version
8. Verify the entire chain

The output should look something like:

```
Successfully stored blob with ID: wblb...
Blob certified!
...
```

Please run the command and paste the output!

---

## 🧪 Testing & Development

### Run Tests

```bash
# Run all tests with coverage
npm test

# Watch mode
npm run test:watch
```

Tests cover:
- ✅ **Merkle Tree**: Root computation, ordering, tampering detection
- ✅ **Ed25519 Crypto**: Key generation, signing, verification
- ✅ **Version Chain**: Commit creation, parent linking, chain validation

### Linting

```bash
# Check code style
npm run lint

# Auto-fix issues
npm run lint:fix

# Format code
npm run format
```

### Database Management

```bash
# View database in Prisma Studio
npm run prisma:studio

# Create new migration
npm run prisma:migrate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

---

## 📊 Data Model

### Dataset

Represents a collection of versioned data.

```typescript
{
  id: string;          // UUID
  name: string;        // Human-readable name
  description: string; // Optional
  createdAt: Date;
}
```

### ManifestEntry

References a Walrus blob within a dataset.

```typescript
{
  id: string;          // UUID
  datasetId: string;   // Foreign key
  blobId: string;      // Walrus blob ID (e.g., "wblb...")
  path: string;        // Logical path/name
  metadata: {          // JSON metadata
    mimeType?: string;
    size?: number;
    checksum?: string;
    // ... custom fields
  };
  createdAt: Date;
}
```

### VersionCommit

Represents a versioned snapshot with cryptographic proof.

```typescript
{
  id: string;              // UUID
  datasetId: string;       // Foreign key
  versionRoot: string;     // Merkle root hash
  parentRoot: string|null; // Previous version's root (null = first)
  signature: string;       // Ed25519 signature (base64)
  publicKey: string;       // Ed25519 public key (base64)
  author: string;          // Optional author (e.g., Sui address)
  manifestEntryIds: string[]; // Entry IDs in this version
  createdAt: Date;
}
```

---

## 🔐 Security Considerations

1. **Keystore Protection**
   - `keystore.json` contains your private key
   - Store securely; never commit to version control
   - Use file permissions: `chmod 600 keystore.json`

2. **Signature Verification**
   - Always verify chains before trusting data
   - Check all three aspects: Merkle root, signature, parent link

3. **Merkle Tree Properties**
   - Deterministic: same entries → same root
   - Collision-resistant (SHA-256)
   - Detects any tampering in entries

4. **Version Chain Integrity**
   - `parentRoot` creates tamper-evident history
   - Breaking any link invalidates the entire chain
   - Each commit is independently verifiable

---

## 🎯 Design Decisions

### Why SQLite?

- **Local-first**: No server dependencies
- **Portable**: Single file database
- **Fast**: Perfect for local dev and testing
- **Easy migration**: Can switch to PostgreSQL/MySQL later via Prisma

### Why Ed25519?

- **Fast**: Signing and verification
- **Small**: 32-byte public keys, 64-byte signatures
- **Secure**: Standard for blockchain and distributed systems
- **Compatible**: Used by Sui and many Web3 systems

### Why Merkle Trees?

- **Efficient**: O(log n) proof size
- **Standard**: Used by Git, Bitcoin, Ethereum, IPFS
- **Verifiable**: Anyone can recompute and verify
- **Incremental**: Can prove individual entries

### Why Version Chain (not just snapshots)?

- **Traceable**: Every version links to its predecessor
- **Auditable**: Full history is verifiable
- **Flexible**: Supports branching (future DAG support)
- **Efficient**: Only store deltas if needed

---

## 🔧 Troubleshooting

### Database Errors

```bash
# Reset database
npx prisma migrate reset

# Regenerate client
npm run prisma:generate
```

### Keystore Issues

```bash
# Delete and regenerate (WARNING: invalidates old signatures)
rm keystore.json
npm run dev generate-key
```

### TypeScript Errors

```bash
# Clean build
rm -rf dist
npm run build
```

### Walrus Connection Issues

```bash
# Check Walrus status
walrus info

# Verify wallet address
sui client active-address

# Check balances
sui client gas
```

---

## 📚 API Reference (Programmatic Use)

You can also use Sirius Data Layer programmatically:

```typescript
import { 
  Container,
  CreateDatasetUseCase,
  CommitVersionUseCase,
  VerifyChainUseCase
} from 'sirius-data-layer';

const container = Container.getInstance();

// Create dataset
const dataset = await container.createDatasetUseCase.execute({
  name: 'My Dataset',
  description: 'Test dataset'
});

// Add manifest entries
await container.addManifestEntriesUseCase.execute({
  datasetId: dataset.id,
  entries: [
    {
      blobId: 'wblb...',
      path: 'file.txt',
      metadata: { mimeType: 'text/plain', size: 1024 }
    }
  ]
});

// Commit version
const commit = await container.commitVersionUseCase.execute({
  datasetId: dataset.id,
  author: '0x...'
});

// Verify chain
const result = await container.verifyChainUseCase.execute({
  datasetId: dataset.id
});

console.log('Chain valid:', result.valid);
```

---

## 🛣️ Roadmap (Future Layers)

The Data Layer is **complete** and ready for integration with:

1. **AI Layer** (surveillance & governance)
   - Fingerprint analysis
   - Risk scoring
   - Anomaly detection

2. **On-chain Anchoring Layer** (Sui Move contracts)
   - `anchor_epoch`: Publish Merkle roots on-chain
   - `submit_snapshot`: Record dataset snapshots
   - `record_receipt`: Store audit trails

3. **Dashboard** (React/Next.js)
   - Visual chain explorer
   - Dataset management
   - Real-time verification status

---

## 📄 License

MIT

---

## 🤝 Contributing

This is a hackathon project. For production use:

1. Add more comprehensive error handling
2. Implement connection pooling for database
3. Add rate limiting for CLI commands
4. Support for distributed keystore (e.g., HSM, cloud KMS)
5. Add Ceramic/IPLD integration for decentralized storage
6. Implement DAG branching and merging

---

## 📞 Support

For issues or questions about:
- **Walrus**: https://docs.wal.app/
- **Sui**: https://docs.sui.io/
- **This project**: Open an issue on GitHub

---

**Built with ❤️ for the Walrus Hackathon**

