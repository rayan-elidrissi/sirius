# 💰 Obtenir des WAL Coins pour Walrus Testnet

## ⚠️ Problème Actuel

L'erreur `Error: could not find WAL coins with sufficient balance` signifie que votre wallet Sui n'a pas assez de tokens WAL pour payer le stockage sur Walrus testnet.

## ✅ Bonne Nouvelle

Le CLI Walrus fonctionne correctement ! Le problème est uniquement lié aux fonds.

## 🔧 Solution : Obtenir des WAL Coins

### Option 1: Via le Faucet Walrus (si disponible)

1. Vérifiez la documentation Walrus pour le faucet testnet
2. Visitez le faucet et demandez des WAL coins pour votre adresse Sui

### Option 2: Via Sui Testnet Faucet

1. Obtenez d'abord des SUI sur testnet (si nécessaire)
2. Échangez des SUI contre WAL coins (si un DEX est disponible sur testnet)

### Option 3: Vérifier votre Balance

Dans WSL, vérifiez votre balance WAL :

```bash
# Vérifier votre adresse Sui
sui client active-address

# Vérifier votre balance (si WAL est un token standard)
sui client gas
```

### Option 4: Obtenir des WAL Coins

Consultez la documentation Walrus pour savoir comment obtenir des WAL coins sur testnet :
- Site web : https://walrus.xyz
- Documentation : https://docs.wal.app
- Discord/Community : Pour demander des WAL coins de test

## 📋 Checklist

- [ ] Wallet Sui configuré pour testnet
- [ ] Adresse Sui active vérifiée
- [ ] WAL coins obtenus via faucet ou échange
- [ ] Balance WAL vérifiée (doit être > 0)

## 🔍 Vérification

Une fois que vous avez des WAL coins, réessayez d'uploader un fichier. Vous devriez voir :

```
✅ SUCCESS: Extracted blob ID: ...
✅ View on testnet: https://walruscan.com/testnet/blob/...
```

---

**Note :** Le système fonctionne correctement ! Il suffit d'obtenir des WAL coins pour pouvoir stocker des blobs.

