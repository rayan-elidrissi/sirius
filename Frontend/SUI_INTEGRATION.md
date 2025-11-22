# Guide d'intégration Sui pour la création de blobs

Ce document explique comment implémenter la création de blobs sur la blockchain Sui en production.

## 📋 Prérequis

1. **Installer les dépendances Sui**

```bash
npm install @mysten/sui @mysten/wallet-standard
# ou
yarn add @mysten/sui @mysten/wallet-standard
```

2. **Configurer les variables d'environnement**

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```env
# Sui Configuration
VITE_SUI_RPC_URL=https://fullnode.testnet.sui.io:443
VITE_SUI_PACKAGE_ID=0x...  # ID du package déployé sur Sui
VITE_SUI_NETWORK=testnet   # mainnet, testnet, ou devnet
```

## 🔧 Implémentation

### 1. Service Sui (`src/services/sui.ts`)

Le service Sui contient des fonctions TODO qui doivent être implémentées :

#### a) Connexion au wallet

```typescript
// Dans connectSuiWallet()
import { getWallets } from '@mysten/wallet-standard'

export async function connectSuiWallet(): Promise<{ address: string; name: string }> {
  const wallets = getWallets()
  
  if (wallets.length === 0) {
    throw new Error('No Sui wallet found. Please install a Sui wallet extension.')
  }

  const wallet = wallets[0]
  await wallet.features['standard:connect'].connect()
  
  const accounts = wallet.features['standard:connect'].accounts
  if (accounts.length === 0) {
    throw new Error('No accounts found in wallet')
  }

  return {
    address: accounts[0].address,
    name: wallet.name,
  }
}
```

#### b) Création de blob

```typescript
// Dans createBlobOnSui()
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client'
import { TransactionBlock } from '@mysten/sui/transactions'
import { getSuiConfig } from './sui'

export async function createBlobOnSui(
  data: { content: string | Uint8Array; contentType?: string; metadata?: Record<string, unknown> },
  walletAddress?: string
): Promise<BlobCreationResult> {
  const config = getSuiConfig()
  const client = new SuiClient({ url: config.rpcUrl })

  // Préparer les données
  const blobBytes = typeof data.content === 'string' 
    ? new TextEncoder().encode(data.content)
    : data.content

  // Créer la transaction
  const txb = new TransactionBlock()

  // Appeler la fonction Move pour créer le blob
  // NOTE: Adaptez cette partie selon votre smart contract Sui
  const [blob] = txb.moveCall({
    target: `${config.packageId}::blob::create`,
    arguments: [
      txb.pure(Array.from(blobBytes)),
      txb.pure(data.contentType || 'application/octet-stream'),
      txb.pure(JSON.stringify(data.metadata || {})),
    ],
  })

  // Transférer l'objet au wallet connecté
  txb.transferObjects([blob], txb.pure(walletAddress))

  // Obtenir le wallet et signer la transaction
  const wallets = getWallets()
  const wallet = wallets[0]
  const signer = await wallet.features['standard:connect'].getAccounts()
  
  // Exécuter la transaction
  const result = await wallet.features['sui:signAndExecuteTransactionBlock'].signAndExecuteTransactionBlock({
    transactionBlock: txb,
    account: signer[0],
    chain: `sui:${config.network}`,
  })

  // Extraire les informations du résultat
  const createdObject = result.objectChanges?.find(
    (change) => change.type === 'created'
  )

  if (!createdObject || createdObject.type !== 'created') {
    throw new Error('Failed to create blob object')
  }

  // Récupérer l'epoch actuel
  const epochInfo = await client.getLatestSuiSystemState()
  const currentEpoch = Number(epochInfo.epoch)

  return {
    blobId: createdObject.objectId,
    suiObjectId: createdObject.objectId,
    transactionDigest: result.digest,
    startEpoch: currentEpoch,
    endEpoch: currentEpoch + 1,
    size: `${(blobBytes.length / 1024 / 1024).toFixed(2)} MB`,
    createdAt: new Date().toISOString(),
  }
}
```

### 2. Smart Contract Sui (Move)

Vous devrez créer un smart contract Move pour gérer les blobs. Exemple de structure :

```move
module blob::blob {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;

    struct Blob has key {
        id: UID,
        content: vector<u8>,
        content_type: String,
        metadata: String,
        created_at: u64,
    }

    public entry fun create(
        content: vector<u8>,
        content_type: vector<u8>,
        metadata: vector<u8>,
        ctx: &mut TxContext
    ): Blob {
        let blob = Blob {
            id: object::new(ctx),
            content,
            content_type: string::utf8(content_type),
            metadata: string::utf8(metadata),
            created_at: tx_context::epoch_timestamp_ms(ctx),
        };
        
        transfer::share_object(blob);
        blob
    }
}
```

### 3. Déploiement du Smart Contract

```bash
# Installer Sui CLI
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch devnet sui

# Publier le package
sui client publish --gas-budget 100000000

# Récupérer le PACKAGE_ID et l'ajouter à .env
```

## 🧪 Tests

Pour tester l'intégration :

1. **Installer un wallet Sui** (ex: Sui Wallet, Suiet)
2. **Configurer les variables d'environnement**
3. **Déployer le smart contract**
4. **Tester la création de blob** via l'interface

## 📝 Notes importantes

- **Gas fees**: Les transactions Sui nécessitent des frais de gas (SUI)
- **Network**: Assurez-vous d'utiliser le bon réseau (testnet pour les tests, mainnet pour la production)
- **Wallet**: L'utilisateur doit avoir un wallet Sui installé et connecté
- **Smart Contract**: Adaptez le smart contract selon vos besoins spécifiques

## 🔗 Ressources

- [Documentation Sui](https://docs.sui.io/)
- [Sui TypeScript SDK](https://github.com/MystenLabs/sui/tree/main/sdk/typescript)
- [Sui Wallet Standard](https://github.com/MystenLabs/sui/tree/main/sdk/wallet-standard)

