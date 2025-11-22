# Installation

## Installation complète

### 1. Cloner le repository

```bash
git clone <repository>
cd sirius
```

### 2. Installer les dépendances

```bash
npm install
# ou
yarn install
```

### 3. Configuration

Créer et configurer `.env` :

```env
# Storage
STORAGE_RPC_URL=https://storage.example.com
STORAGE_NETWORK=testnet

# Sui
SUI_RPC_URL=https://fullnode.testnet.sui.io:443
SUI_PACKAGE_ID=0x...

# Ceramic/IPLD
CERAMIC_URL=https://ceramic.example.com

# Dashboard
DASHBOARD_PORT=3000
API_PORT=3001
```

### 4. Déployer les smart contracts

```bash
sui client publish --gas-budget 100000000
```

### 5. Démarrer les services

```bash
npm run start:all
```
