# 🧪 Test Manuel Walrus CLI - Diagnostic

## ⚠️ PROBLÈME ACTUEL

Les blobs ne sont pas visibles sur walruscan.com/testnet et il semble que les commandes Walrus ne soient pas exécutées.

## 🔍 Diagnostic Étape par Étape

### 1. Vérifier que Walrus CLI fonctionne dans WSL

```bash
# Dans WSL (pas PowerShell)
walrus --version
```

**Résultat attendu:**
```
walrus 1.36.1-782ce5c43884
```

### 2. Vérifier la configuration testnet

```bash
# Dans WSL
walrus info
```

**Résultat attendu pour TESTNET:**
```
Epoch duration: 1day  ← CRITIQUE: Doit être "1day" pour testnet
```

**Si vous voyez "7days" → Vous êtes sur MAINNET!**

### 3. Test manuel d'upload

```bash
# Dans WSL, créer un fichier de test
echo "Test blob for Sirius" > /tmp/test-sirius.txt

# Upload vers Walrus TESTNET
walrus store /tmp/test-sirius.txt
```

**📝 IMPORTANT: Copiez TOUTE la sortie ici!**

La sortie devrait ressembler à quelque chose comme:
```
Storing blob...
Successfully stored blob with ID: wblb...
```

OU

```
Blob ID: 7fpuSXijNCial7uNFrfjj9zA7O_0zL3WkY-bQ32sph8
```

### 4. Vérifier le blob sur walruscan

Une fois que vous avez le blob ID, allez sur:
```
https://walruscan.com/testnet/blob/<BLOB_ID>
```

**⚠️ Notez bien: `/testnet/blob/` et non `/blob/`**

### 5. Vérifier depuis Windows (comme le backend le fait)

```powershell
# Depuis PowerShell Windows
wsl walrus --version
wsl walrus info
wsl walrus store /tmp/test-sirius.txt
```

**📝 Copiez TOUTE la sortie de `wsl walrus store`**

---

## 🐛 Problèmes Possibles

### Problème 1: Walrus CLI pas dans le PATH WSL

**Symptôme:** `wsl walrus --version` ne fonctionne pas

**Solution:**
```bash
# Dans WSL, trouver où est walrus
which walrus

# Si vide, ajouter au PATH dans ~/.bashrc
export PATH=$PATH:/chemin/vers/walrus
```

### Problème 2: Configuration mainnet au lieu de testnet

**Symptôme:** `walrus info` montre "Epoch duration: 7days"

**Solution:**
```bash
# Dans WSL
rm ~/.config/walrus/client_config.yaml
curl --create-dirs https://docs.wal.app/setup/client_config.yaml -o ~/.config/walrus/client_config.yaml
walrus info  # Vérifier que ça montre "1day"
```

### Problème 3: Blob ID format différent

**Symptôme:** Le blob ID extrait ne fonctionne pas sur walruscan

**Solution:** Les logs du backend montreront le format exact. Partagez-les!

---

## 📋 Checklist

- [ ] `walrus --version` fonctionne dans WSL
- [ ] `walrus info` montre "Epoch duration: 1day" (testnet)
- [ ] `wsl walrus --version` fonctionne depuis PowerShell
- [ ] `wsl walrus store <file>` fonctionne et retourne un blob ID
- [ ] Le blob ID fonctionne sur `walruscan.com/testnet/blob/<ID>`

---

## 🔄 Après Diagnostic

Une fois que vous avez testé manuellement:

1. **Partagez la sortie complète de `walrus store`** - Je pourrai ajuster le parsing
2. **Partagez les logs du backend** quand vous uploadez via le frontend
3. **Indiquez si le blob apparaît sur walruscan.com/testnet** après upload manuel

---

**Testez ces commandes et partagez les résultats!** 🔍

