# 🐋 Installation Walrus CLI - Guide Complet

## Pourquoi installer Walrus CLI?

Sans Walrus CLI, l'application fonctionne en **mode demo** (blobs en mémoire uniquement).
Avec Walrus CLI, vos fichiers sont **vraiment stockés** sur Walrus et visibles sur **walrusscan.xyz**.

---

## 📥 Installation

### Option 1: Via GitHub Releases (Recommandé)

1. **Aller sur GitHub:**
   - https://github.com/walrus-protocol/walrus/releases
   - Ou cherchez "walrus protocol github releases"

2. **Télécharger:**
   - Cherchez la dernière version pour Windows
   - Téléchargez le fichier `.exe` ou `.zip`

3. **Installer:**
   - Si `.exe`: Exécutez-le
   - Si `.zip`: Extrayez dans un dossier (ex: `C:\walrus\`)

4. **Ajouter au PATH:**
   - Ouvrez "Variables d'environnement" Windows
   - Modifiez la variable `Path`
   - Ajoutez le chemin vers le dossier contenant `walrus.exe`
   - Exemple: `C:\walrus\`

### Option 2: Via npm (si disponible)

```bash
npm install -g @walrus-protocol/cli
```

### Option 3: Via cargo (Rust)

Si vous avez Rust installé:

```bash
cargo install walrus-cli
```

---

## ✅ Vérification

Après installation, **redémarrez votre terminal** et testez:

```powershell
walrus --version
```

**Résultat attendu:**
```
walrus X.X.X
```

Si vous voyez une erreur, Walrus CLI n'est pas dans votre PATH.

---

## 🔧 Configuration

### 1. Vérifier Sui Wallet

```bash
sui client active-address
```

Vous devez avoir une adresse Sui configurée.

### 2. Vérifier les tokens

```bash
sui client gas
```

Vous devez avoir:
- ✅ **SUI tokens** (pour les transactions)
- ✅ **WAL tokens** (pour Walrus storage)

### 3. Obtenir des tokens WAL (si nécessaire)

```bash
walrus get-wal
```

---

## 🧪 Test Manuel

### Test d'upload

```bash
# Créer un fichier de test
echo "Hello Walrus!" > test.txt

# Upload vers Walrus
walrus store test.txt
```

**Résultat attendu:**
```
Storing blob...
Successfully stored blob with ID: wblbXXXXXXXXXXXXXXXXXXXXXXXXXXXX
Blob size: 14 bytes
Certified: true
```

### Vérifier sur WalrusScan

1. Copiez le `blobId` (commence par `wblb...`)
2. Allez sur: **https://walrusscan.xyz**
3. Collez le blob ID dans la recherche
4. Vous devriez voir votre blob! ✅

---

## 🔄 Après Installation

### 1. Redémarrer le serveur backend

```bash
cd Backend
# Arrêtez le serveur (Ctrl+C)
npm run api:dev
```

### 2. Vérifier les logs

Vous devriez voir:
```
✅ Walrus CLI detected. Using real Walrus storage.
```

**Si vous voyez encore "DEMO MODE":**
- Vérifiez que `walrus --version` fonctionne dans votre terminal
- Redémarrez le serveur backend
- Vérifiez que le PATH est correct

### 3. Tester via le frontend

1. Ouvrez `http://localhost:5173/sirius`
2. Connectez le wallet
3. Créez un projet
4. Uploadez un fichier
5. Vérifiez les logs du backend → devrait dire "Successfully uploaded to Walrus"
6. Copiez le `blobId` retourné
7. Allez sur **walrusscan.xyz** et cherchez le blob ID

---

## 🐛 Dépannage

### Problème: "walrus n'est pas reconnu"

**Solutions:**
1. Vérifiez que Walrus CLI est installé:
   ```powershell
   where.exe walrus
   ```

2. Si vide, ajoutez au PATH:
   - Trouvez où est `walrus.exe`
   - Ajoutez ce dossier au PATH Windows
   - **Redémarrez le terminal**

3. Testez dans un nouveau terminal:
   ```powershell
   walrus --version
   ```

### Problème: "Insufficient WAL tokens"

```bash
walrus get-wal
```

### Problème: "Sui wallet not configured"

```bash
sui client active-address
# Si vide, configurez votre wallet Sui
```

---

## 📚 Commandes Utiles

```bash
# Version
walrus --version

# Infos du cluster
walrus info

# Lister vos blobs
walrus list-blobs

# Status d'un blob
walrus blob-status <BLOB_ID>

# Obtenir des tokens WAL
walrus get-wal

# Upload un fichier
walrus store <file>
```

---

## 🔗 Liens Utiles

- **Walrus Protocol:** https://walrus.xyz
- **GitHub:** https://github.com/walrus-protocol/walrus
- **WalrusScan:** https://walrusscan.xyz
- **Documentation:** (cherchez la doc officielle)

---

**Une fois installé, redémarrez le serveur backend et testez!** 🚀

