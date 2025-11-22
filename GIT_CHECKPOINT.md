# 🔒 Guide Git - Créer un Checkpoint (Breakpoint)

## 📍 **ÉTAPE 1: Créer le Checkpoint (Point de Sauvegarde)**

```bash
# 1. Voir ce qui a changé
git status

# 2. Ajouter tous les fichiers modifiés
git add .

# 3. Créer le checkpoint avec un message descriptif
git commit -m "Checkpoint: Frontend wallet integration complete - Working state"

# 4. (Optionnel) Voir l'historique pour confirmer
git log --oneline -5
```

---

## 🔄 **ÉTAPE 2: Si vous voulez revenir à ce checkpoint plus tard**

### **Option A: Annuler les modifications (garder les fichiers)**
```bash
# Voir tous les checkpoints
git log --oneline

# Revenir au dernier checkpoint (annule les modifications non commitées)
git reset --soft HEAD

# Ou revenir au checkpoint précédent (annule le dernier commit mais garde les fichiers)
git reset --soft HEAD~1
```

### **Option B: Revenir complètement à un checkpoint spécifique**
```bash
# Voir l'historique avec les hash
git log --oneline

# Revenir à un checkpoint spécifique (remplace TOUT par cet état)
git reset --hard <HASH_DU_CHECKPOINT>

# Exemple:
# git reset --hard abc1234
```

### **Option C: Créer une branche de sauvegarde (RECOMMANDÉ)**
```bash
# Créer une branche de sauvegarde avant de modifier
git checkout -b backup-before-changes

# Faire vos modifications...

# Si ça ne marche pas, revenir à la branche principale
git checkout data_layer_ali

# Supprimer les modifications en revenant au dernier commit
git reset --hard HEAD
```

---

## 🛡️ **MÉTHODE SÉCURISÉE (Recommandée)**

### **Créer une branche de sauvegarde:**
```bash
# 1. Créer une branche de sauvegarde
git checkout -b checkpoint-wallet-integration

# 2. Commiter tout
git add .
git commit -m "Checkpoint: Wallet integration working"

# 3. Revenir à votre branche principale
git checkout data_layer_ali

# 4. Maintenant vous pouvez modifier en sécurité
# Si ça casse, revenir à la branche de sauvegarde:
git checkout checkpoint-wallet-integration
```

---

## 📋 **Commandes Rapides de Référence**

| Action | Commande |
|--------|----------|
| Voir l'état | `git status` |
| Ajouter tout | `git add .` |
| Créer checkpoint | `git commit -m "Message"` |
| Voir l'historique | `git log --oneline` |
| Annuler modifications non commitées | `git restore .` |
| Revenir au dernier commit | `git reset --hard HEAD` |
| Revenir à un commit spécifique | `git reset --hard <HASH>` |
| Créer branche de sauvegarde | `git checkout -b backup-name` |

---

## ⚠️ **ATTENTION**

- `git reset --hard` **SUPPRIME** toutes les modifications non sauvegardées
- Toujours créer un checkpoint avant de faire des modifications importantes
- Utilisez `git log` pour voir les hash des checkpoints avant de revenir en arrière

