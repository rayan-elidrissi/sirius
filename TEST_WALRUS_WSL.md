# 🧪 Test Walrus CLI depuis Windows/WSL

## ⚠️ Problème Actuel

Le backend ne détecte pas le CLI Walrus via WSL, même si vous avez dit que `walrus --version` fonctionne dans WSL.

## 🔍 Diagnostic Étape par Étape

### Étape 1: Tester depuis WSL directement

Dans votre terminal WSL Ubuntu:
```bash
walrus --version
```

**Résultat attendu:**
```
walrus 1.36.1-782ce5c43884
```

### Étape 2: Tester depuis Windows via WSL

Dans PowerShell Windows (PAS dans WSL):
```powershell
wsl walrus --version
```

**Résultat attendu:**
```
walrus 1.36.1-782ce5c43884
```

**⚠️ Si cette commande échoue, c'est le problème!**

### Étape 3: Vérifier le PATH dans WSL

Dans WSL, vérifiez où est installé Walrus:
```bash
which walrus
```

Cela devrait retourner quelque chose comme:
```
/usr/local/bin/walrus
# ou
/home/byezz/.local/bin/walrus
# ou
/home/byezz/go/bin/walrus
```

### Étape 4: Vérifier que WSL est accessible depuis Windows

Dans PowerShell Windows:
```powershell
wsl echo "WSL is working"
```

Cela devrait afficher:
```
WSL is working
```

### Étape 5: Tester avec le chemin complet

Si `wsl walrus --version` ne fonctionne pas, essayez avec le chemin complet:

Dans PowerShell Windows:
```powershell
# Remplacez /path/to/walrus par le résultat de "which walrus" dans WSL
wsl /usr/local/bin/walrus --version
```

## 🔧 Solutions Possibles

### Solution 1: Ajouter Walrus au PATH WSL

Dans WSL, éditez `~/.bashrc` ou `~/.profile`:
```bash
# Trouvez où est walrus
which walrus

# Ajoutez au PATH (remplacez /path/to/walrus par le vrai chemin)
export PATH=$PATH:/path/to/walrus

# Rechargez
source ~/.bashrc
```

### Solution 2: Créer un lien symbolique

Si Walrus est dans un répertoire non-standard:
```bash
# Dans WSL
sudo ln -s /path/to/walrus /usr/local/bin/walrus
```

### Solution 3: Utiliser le chemin complet dans le code

Si rien ne fonctionne, on peut modifier le code pour utiliser le chemin complet.

## 📋 Checklist

- [ ] `walrus --version` fonctionne dans WSL
- [ ] `wsl walrus --version` fonctionne depuis PowerShell Windows
- [ ] `which walrus` retourne un chemin dans WSL
- [ ] Le chemin est dans le PATH WSL

## 🆘 Partagez ces informations

1. **Le résultat de `wsl walrus --version` depuis PowerShell Windows**
2. **Le résultat de `which walrus` dans WSL**
3. **Le résultat de `echo $PATH` dans WSL** (pour voir les chemins)

Ces informations permettront de corriger le problème!

