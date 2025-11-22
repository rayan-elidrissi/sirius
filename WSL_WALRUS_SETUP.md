# 🐋 Configuration Walrus CLI dans WSL pour Windows

## ✅ Vérification

### 1. Vérifier que WSL fonctionne

```powershell
wsl --version
```

### 2. Vérifier que Walrus CLI est installé dans WSL

**Dans WSL (pas PowerShell):**
```bash
walrus --version
```

Si ça ne fonctionne pas, installez Walrus CLI dans WSL.

### 3. Tester depuis Windows PowerShell

```powershell
wsl walrus --version
```

**Si ça fonctionne**, le backend devrait le détecter automatiquement!

---

## 🔧 Installation dans WSL

### Option 1: Via GitHub Releases

1. **Ouvrir WSL terminal**
2. **Télécharger Walrus CLI:**
   ```bash
   # Trouvez la dernière version sur GitHub
   # https://github.com/walrus-protocol/walrus/releases
   
   # Exemple pour Linux x64:
   wget https://github.com/walrus-protocol/walrus/releases/download/vX.X.X/walrus-X.X.X-linux-x86_64.tar.gz
   tar -xzf walrus-*.tar.gz
   sudo mv walrus /usr/local/bin/
   ```

### Option 2: Via cargo (si Rust installé dans WSL)

```bash
cargo install walrus-cli
```

### Option 3: Via npm (si Node.js installé dans WSL)

```bash
npm install -g @walrus-protocol/cli
```

---

## ✅ Vérification après installation

### Dans WSL:
```bash
walrus --version
```

### Depuis Windows PowerShell:
```powershell
wsl walrus --version
```

**Les deux doivent fonctionner!**

---

## 🔄 Configuration Sui dans WSL

### 1. Vérifier Sui CLI dans WSL

```bash
# Dans WSL
sui client active-address
```

### 2. Vérifier les tokens

```bash
sui client gas
```

Vous devez avoir:
- ✅ SUI tokens
- ✅ WAL tokens

### 3. Obtenir WAL tokens (si nécessaire)

```bash
walrus get-wal
```

---

## 🧪 Test Manuel dans WSL

```bash
# Créer un fichier de test
echo "Hello Walrus from WSL!" > test.txt

# Upload vers Walrus
walrus store test.txt
```

**Résultat attendu:**
```
Storing blob...
Successfully stored blob with ID: wblb...
Blob size: X bytes
Certified: true
```

### Vérifier sur WalrusScan

1. Copiez le `blobId`
2. Allez sur: **https://walrusscan.xyz**
3. Recherchez le blob ID
4. Vous devriez voir votre blob! ✅

---

## 🔄 Redémarrer le Backend

Après avoir installé/configuré Walrus CLI dans WSL:

1. **Redémarrez le serveur backend:**
   ```bash
   cd Backend
   # Arrêtez (Ctrl+C)
   npm run api:dev
   ```

2. **Vous devriez voir:**
   ```
   ✅ Walrus CLI detected via WSL. Using real Walrus storage.
   ```

3. **Si vous voyez encore "DEMO MODE":**
   - Vérifiez: `wsl walrus --version` fonctionne
   - Vérifiez que WSL est bien démarré
   - Redémarrez le serveur backend

---

## 🐛 Dépannage

### Problème: "walrus: not found" dans WSL

**Solution:**
1. Vérifiez que Walrus CLI est installé dans WSL:
   ```bash
   which walrus
   ```

2. Si vide, ajoutez au PATH WSL:
   ```bash
   # Trouvez où est walrus
   find ~ -name walrus 2>/dev/null
   
   # Ajoutez au PATH (dans ~/.bashrc ou ~/.zshrc)
   export PATH=$PATH:/chemin/vers/walrus
   ```

### Problème: "wsl walrus --version" ne fonctionne pas

**Solutions:**
1. Vérifiez que WSL est démarré:
   ```powershell
   wsl --list --running
   ```

2. Testez directement dans WSL:
   ```bash
   # Ouvrir WSL
   wsl
   # Puis:
   walrus --version
   ```

3. Si ça fonctionne dans WSL mais pas via `wsl walrus`, c'est un problème de PATH.

---

## 📝 Notes Importantes

- ✅ Walrus CLI doit être installé **dans WSL**, pas sur Windows
- ✅ Le backend détecte automatiquement WSL sur Windows
- ✅ Les chemins Windows sont automatiquement convertis en chemins WSL
- ✅ Les blobs uploadés seront visibles sur **walrusscan.xyz**

---

**Une fois configuré, redémarrez le serveur backend et testez!** 🚀

