# Sirius Data Layer - Move-first MVP

A decentralized data layer built on Sui blockchain with Walrus storage, featuring Move-first architecture for governance, versioning, and permissions. Sirius provides secure, verifiable, and immutable versioning for datasets with end-to-end encryption and on-chain access control.
Video Demo : https://www.youtube.com/watch?v=xlXxQPLIW24
## 🎯 What is Sirius Data Layer?

Sirius is a **decentralized data versioning system** that combines:
- **On-chain governance** (Sui Move) for repositories, commits, and permissions
- **Decentralized storage** (Walrus) for encrypted file payloads
- **Cryptographic sealing** (Seal SDK) for key management with on-chain policies
- **Merkle tree verification** for data integrity
- **TEE verification** (Nautilus) for content compliance

## 🏗️ Architecture

### Core Components

- **Sui Move Smart Contracts**: Source of truth for repositories, commits, and permissions
  - `Repository` objects store ownership, access control, and head commit
  - `Commit` objects form an immutable chain with Merkle roots
  - Anti-fork mechanism ensures linear version history

- **Walrus Storage**: Decentralized storage for encrypted data
  - Stores ciphertexts (encrypted files)
  - Stores sealed keys (encrypted file keys)
  - Stores manifests (JSON metadata)
  - Uses Reed-Solomon encoding for redundancy

- **Seal Service**: Key sealing with on-chain policies
  - Root Master Key (RMK) per repository
  - File keys sealed with policy-based encryption
  - Only authorized addresses can unseal keys

- **Merkle Root**: Cryptographic integrity verification
  - SHA-256 hash of manifest JSON
  - Stored on-chain in each Commit
  - Enables tamper detection without storing full manifest on-chain

- **TEE Verification**: Content compliance checking
  - Analyzes images using Claude API
  - Automatically burns illegal content
  - Certifies legal files with "Nautilus Certified" badge

- **Backend**: Express API orchestrator
  - Handles file encryption/decryption
  - Manages Walrus uploads/downloads
  - Coordinates TEE verification
  - Caches metadata locally (SQLite)

- **Frontend**: React-based UI
  - Sui wallet integration (@mysten/dapp-kit)
  - Project management and file upload
  - Version history visualization
  - SuiScan links for on-chain verification

## 📁 Project Structure

```
├── Backend/          # Express API server (TypeScript)
│   ├── src/
│   │   ├── api/      # Express routes
│   │   ├── application/  # Use cases
│   │   ├── domain/   # Domain models and interfaces
│   │   ├── infrastructure/  # Implementations (Sui, Walrus, Seal, etc.)
│   │   └── prisma/   # Database schema
│   └── .env          # Environment variables
├── Frontend/         # React frontend (Vite)
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── hooks/    # Custom hooks
│   │   ├── services/ # API client
│   │   └── pages/    # Page components
│   └── .env
├── Move/             # Sui Move smart contracts
│   ├── sources/
│   │   └── sirius.move  # Main contract
│   └── Move.toml
├── tee_v0/           # TEE verification scripts
│   ├── claude_report.py  # Claude API integration
│   └── verify_image.sh  # WSL wrapper script
└── README.md         # This file
```

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+**
- **Sui CLI** (for Move contract deployment)
- **Walrus CLI** (configured for testnet)
- **WSL** (for Windows users using Walrus CLI)
- **Python 3.12+** (for TEE verification)
- **Anthropic API Key** (for Claude API)

### Backend Setup

```bash
cd Backend
npm install
cp .env.example .env  # Edit .env with your configuration
npx prisma migrate dev  # Setup SQLite database
npm run api:dev
```

**Required Environment Variables:**
- `SUI_PACKAGE_ID`: Your published Move package ID
- `SUI_NETWORK`: `testnet` or `mainnet`
- `WALRUS_NETWORK`: `testnet` or `mainnet`
- `PORT`: Backend server port (default: 3001)
- `ANTHROPIC_API_KEY`: For TEE verification

### Frontend Setup

```bash
cd Frontend
npm install
npm run dev
```

### Move Contracts

```bash
cd Move
sui move build
sui client publish --gas-budget 100000000
# Update SUI_PACKAGE_ID in Backend/.env with the published package ID
```

### TEE Setup (Optional)

```bash
cd tee_v0
python3 -m venv venv
source venv/bin/activate  # On Windows: use WSL
pip install -r requirements.txt
# Ensure ANTHROPIC_API_KEY is set in Backend/.env
```

## 🔐 Security Features

- **End-to-End Encryption**: All files encrypted with XChaCha20-Poly1305 or AES-256-GCM before upload
- **Key Sealing**: File keys sealed with Seal SDK using on-chain policies
- **No Plaintext Storage**: No unencrypted data stored on Walrus
- **On-Chain Access Control**: Permissions enforced via Sui Move contracts
- **Merkle Root Verification**: Tamper detection via cryptographic hashing
- **Anti-Fork Protection**: Linear commit chain enforced on-chain
- **TEE Content Verification**: Automatic detection and removal of illegal content

## 🔗 Key Technologies

- **Blockchain**: Sui (Move smart contracts)
- **Storage**: Walrus (decentralized blob storage)
- **Encryption**: XChaCha20-Poly1305, AES-256-GCM
- **Hashing**: SHA-256 (Merkle roots)
- **Key Management**: Seal SDK (policy-based sealing)
- **Frontend**: React, Vite, TypeScript, @mysten/dapp-kit
- **Backend**: Express, TypeScript, Prisma, SQLite
- **TEE**: Python, Claude API (Anthropic)

## 📊 Workflow Overview

1. **Create Repository**: Generate RMK, seal it, upload to Walrus, create on Sui
2. **Upload Files**: Encrypt files, seal keys, upload to Walrus, stage locally
3. **TEE Verification**: Decrypt, verify content, burn illegal files
4. **Create Version**: Build manifest, calculate Merkle root, create Commit on Sui
5. **View Versions**: Browse commit chain with SuiScan links

## 🔗 Links

- [Sui Documentation](https://docs.sui.io/)
- [Walrus Documentation](https://walrus.com/)
- [Suiscan Explorer](https://suiscan.xyz/)
- [Seal SDK](https://github.com/MystenLabs/seal)

## 👥 Team

- **Ali B.** - Team Member
- **Rayan E.** - Team Member

## 📄 License

MIT
