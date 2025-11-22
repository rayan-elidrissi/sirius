# 🔧 Guide de Dépannage - Sirius Data Layer

## ❌ Erreur: "Failed to fetch" lors de la création de projet

### Cause
Le frontend ne peut pas communiquer avec le backend. Causes possibles:
1. Backend non démarré
2. Port incorrect dans le frontend
3. CORS mal configuré
4. Backend sur un autre port

### ✅ Solution

#### 1. Vérifier que le backend est démarré

Dans votre terminal WSL Ubuntu:
```bash
# Vérifier que le serveur écoute sur le port 3001
curl http://localhost:3001/health
```

**Résultat attendu:**
```json
{"status":"ok","service":"sirius-data-layer-api"}
```

Si vous obtenez une erreur de connexion, le backend n'est pas démarré. Lancez-le:
```bash
cd /mnt/c/Users/byezz/Desktop/hackathon_walrus/hackathon_Walrus_ARA/Backend
npm run api:dev
```

#### 2. Vérifier la configuration du frontend

Le frontend doit pointer vers le bon port. Vérifiez:

**Fichier: `Frontend/.env`**
```env
VITE_API_URL=http://localhost:3001/api
```

**OU dans le code: `Frontend/src/services/api.ts`**
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
```

#### 3. Redémarrer le frontend

Après avoir modifié `.env`, redémarrez le serveur de développement:
```bash
# Arrêter le serveur (Ctrl+C)
# Puis relancer
cd Frontend
npm run dev
```

#### 4. Vérifier CORS

Le backend doit autoriser les requêtes depuis `http://localhost:5173` (port par défaut de Vite).

**Fichier: `Backend/.env`**
```env
FRONTEND_URL=http://localhost:5173
```

**OU dans le code: `Backend/src/api/server.ts`**
```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
```

### 🔍 Diagnostic

#### Test 1: Vérifier la connexion backend
```bash
curl http://localhost:3001/health
```

#### Test 2: Vérifier depuis le frontend
Ouvrez la console du navigateur (F12) et testez:
```javascript
fetch('http://localhost:3001/api/datasets')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

#### Test 3: Vérifier les logs du backend
Quand vous créez un projet, regardez les logs du backend. Vous devriez voir:
```
POST /api/datasets
```

Si vous ne voyez rien, la requête n'arrive pas au backend (problème de CORS ou d'URL).

---

## ❌ Erreur: "Port 3000 is already in use"

### Solution
Changez le port dans `Backend/.env`:
```env
PORT=3001
```

Et mettez à jour le frontend pour pointer vers le port 3001.

---

## ❌ Erreur: "Walrus CLI not found"

### Solution
Assurez-vous que Walrus CLI est installé dans WSL:
```bash
# Dans WSL
walrus --version
```

Si ce n'est pas installé, suivez: `WSL_WALRUS_SETUP.md`

---

## ❌ Erreur: Blob non visible sur walruscan.com/testnet

### Causes possibles
1. Walrus CLI configuré pour mainnet au lieu de testnet
2. Blob ID mal parsé
3. Blob pas encore propagé sur le réseau

### Solution
1. Vérifier la configuration testnet:
   ```bash
   walrus info
   ```
   Doit montrer: `Epoch duration: 1day` (testnet)

2. Vérifier les logs du backend lors de l'upload - vous devriez voir le blob ID extrait

3. Attendre quelques secondes après l'upload pour que le blob soit propagé

---

## 📋 Checklist de Démarrage

- [ ] Backend démarré sur le port 3001
- [ ] Frontend configuré pour pointer vers `http://localhost:3001/api`
- [ ] CORS configuré correctement
- [ ] Walrus CLI installé et configuré pour testnet
- [ ] Base de données initialisée (`npm run db:init`)

---

## 🆘 Besoin d'aide?

Partagez:
1. Les logs du backend (terminal WSL)
2. Les erreurs de la console du navigateur (F12)
3. Le résultat de `curl http://localhost:3001/health`

