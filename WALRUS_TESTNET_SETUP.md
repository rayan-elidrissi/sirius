# 🌐 Configuration Walrus CLI pour TESTNET

## ⚠️ IMPORTANT: On utilise TESTNET, pas mainnet!

Tous les blobs doivent être uploadés sur **Walrus TESTNET** pour être visibles sur `walruscan.com/testnet/blob/...`

---

## 📋 Configuration Requise

### 1. Configurer Sui CLI pour Testnet

```bash
# Dans WSL
sui client

# Lors de l'initialisation:
# - Connecter à un serveur Full Node Sui ? → Y
# - URL du serveur Full Node → https://fullnode.testnet.sui.io:443
# - Alias de l'environnement → testnet
# - Schéma de clé → 0 (pour ed25519)
```

### 2. Configurer Walrus CLI pour Testnet

```bash
# Dans WSL, télécharger la config testnet
curl --create-dirs https://docs.wal.app/setup/client_config.yaml -o ~/.config/walrus/client_config.yaml
```

### 3. Vérifier la Configuration

```bash
# Vérifier que vous êtes sur testnet
walrus info
```

**Résultat attendu:**
```
Epoch duration: 1day  ← Indique TESTNET
...
```

Si vous voyez `Epoch duration: 7days`, vous êtes sur **MAINNET** (mauvais réseau!)

---

## ✅ Vérification

### Test d'upload sur Testnet

```bash
# Créer un fichier de test
echo "Test blob for testnet" > test.txt

# Upload vers Walrus TESTNET
walrus store test.txt
```

**Résultat attendu:**
```
Storing blob...
Successfully stored blob with ID: wblb...
Blob certified!
```

### Vérifier sur WalrusCan Testnet

1. Copiez le `blobId` (commence par `wblb...`)
2. Allez sur: **https://walruscan.com/testnet/blob/<BLOB_ID>**
3. Vous devriez voir votre blob! ✅

**⚠️ Si vous utilisez `walruscan.com/blob/...` (sans /testnet), vous ne verrez PAS votre blob car c'est pour le mainnet!**

---

## 🔍 Dépannage

### Problème: Blob non visible sur walruscan.com/testnet

**Causes possibles:**
1. ❌ Walrus CLI configuré pour MAINNET au lieu de TESTNET
2. ❌ Blob uploadé sur mainnet mais cherché sur testnet
3. ❌ Blob pas encore certifié (attendre quelques secondes)

**Solutions:**
1. Vérifier la config:
   ```bash
   walrus info
   # Doit montrer "Epoch duration: 1day" pour testnet
   ```

2. Reconfigurer pour testnet:
   ```bash
   curl --create-dirs https://docs.wal.app/setup/client_config.yaml -o ~/.config/walrus/client_config.yaml
   ```

3. Vérifier le blob:
   ```bash
   walrus blob-status --blob-id <BLOB_ID>
   ```

### Problème: "Epoch duration: 7days" au lieu de "1day"

**Cela signifie que vous êtes sur MAINNET!**

**Solution:**
1. Supprimer la config actuelle:
   ```bash
   rm ~/.config/walrus/client_config.yaml
   ```

2. Télécharger la config testnet:
   ```bash
   curl --create-dirs https://docs.wal.app/setup/client_config.yaml -o ~/.config/walrus/client_config.yaml
   ```

3. Vérifier:
   ```bash
   walrus info
   # Doit maintenant montrer "Epoch duration: 1day"
   ```

---

## 📚 Documentation

- **Walrus Testnet Setup:** https://docs.wal.app/usage/started.html
- **WalrusCan Testnet:** https://walruscan.com/testnet
- **Available Networks:** https://docs.wal.app/usage/networks.html

---

## ⚠️ Notes Importantes

1. **TESTNET ne garantit PAS la persistance** - Les données peuvent être effacées à tout moment
2. **Ne pas utiliser pour production** - Utilisez mainnet pour les données importantes
3. **Tous les blobs sont publics** - Ne stockez jamais de secrets sans chiffrement
4. **URL correcte:** `walruscan.com/testnet/blob/...` (avec `/testnet` dans le chemin!)

---

**Une fois configuré pour testnet, redémarrez le backend et testez!** 🚀

