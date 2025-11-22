# 🐋 Configuration Walrus CLI pour Sirius

## Installation de Walrus CLI

### Windows

1. **Télécharger Walrus CLI:**
   - Visitez: https://walrus.xyz ou https://github.com/walrus-protocol/walrus
   - Téléchargez la version Windows

2. **Installer:**
   - Extrayez l'archive
   - Ajoutez le dossier au PATH Windows

3. **Vérifier l'installation:**
   ```powershell
   walrus --version
   ```

### Alternative: Via npm (si disponible)
```bash
npm install -g @walrus-protocol/cli
```

---

## Configuration

### 1. Vérifier que Walrus CLI est dans le PATH

**Windows PowerShell:**
```powershell
$env:PATH -split ';' | Select-String -Pattern "walrus"
```

**Ou tester directement:**
```powershell
walrus --version
```

Si vous obtenez une erreur "'walrus' n'est pas reconnu", vous devez:
1. Trouver où vous avez installé Walrus CLI
2. Ajouter ce dossier au PATH Windows

### 2. Configurer le wallet Sui

```bash
# Vérifier que Sui CLI est configuré
sui client active-address

# Vérifier les tokens
sui client gas
```

Vous devez avoir:
- ✅ SUI tokens (pour les transactions)
- ✅ WAL tokens (pour Walrus storage)

### 3. Obtenir des tokens WAL (si nécessaire)

```bash
walrus get-wal
```

---

## Vérification

### Test manuel d'upload

```bash
# Créer un fichier de test
echo "Test content" > test.txt

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

1. Copiez le `blobId` (commence par `wblb...`)
2. Allez sur: https://walrusscan.xyz (ou l'URL du scanneur Walrus)
3. Recherchez le blob ID
4. Vous devriez voir votre blob

---

## Dépannage

### Problème: "walrus n'est pas reconnu"

**Solution:**
1. Trouvez où est installé Walrus CLI
2. Ajoutez-le au PATH Windows:
   - Ouvrez "Variables d'environnement"
   - Modifiez la variable `PATH`
   - Ajoutez le chemin vers Walrus CLI
   - Redémarrez le terminal

### Problème: "Insufficient WAL tokens"

**Solution:**
```bash
walrus get-wal
```

### Problème: "Sui wallet not configured"

**Solution:**
```bash
sui client active-address
# Si vide, configurez votre wallet
```

---

## Après installation

1. **Redémarrez le serveur backend:**
   ```bash
   cd Backend
   npm run api:dev
   ```

2. **Vous devriez voir:**
   ```
   ✅ Walrus CLI detected. Using real Walrus storage.
   ```

3. **Testez l'upload:**
   - Via le frontend
   - Vérifiez les logs du backend
   - Vérifiez sur WalrusScan

---

## Commandes utiles

```bash
# Vérifier la version
walrus --version

# Voir les infos du cluster
walrus info

# Lister vos blobs
walrus list-blobs

# Vérifier le status d'un blob
walrus blob-status <BLOB_ID>

# Obtenir des tokens WAL
walrus get-wal
```

