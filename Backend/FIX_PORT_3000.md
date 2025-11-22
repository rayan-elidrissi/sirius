# 🔧 Fix: Port 3000 Already in Use

## 🔍 Étape 1: Trouver quel processus utilise le port 3000

Dans votre terminal WSL Ubuntu, exécutez:

```bash
# Option 1: Utiliser lsof (si installé)
lsof -i :3000

# Option 2: Utiliser netstat (toujours disponible)
netstat -tuln | grep 3000

# Option 3: Utiliser ss (moderne)
ss -tuln | grep 3000

# Option 4: Utiliser fuser (si installé)
fuser 3000/tcp
```

## 🛑 Étape 2: Tuer le processus

Une fois que vous avez trouvé le PID (Process ID), tuez-le:

```bash
# Remplacez <PID> par le numéro trouvé
kill <PID>

# Si ça ne marche pas, forcez:
kill -9 <PID>
```

## 🔄 OU: Changer le port du serveur

Si vous ne voulez pas tuer l'autre processus, changez le port:

### Option A: Via fichier .env

Créez/modifiez `Backend/.env`:
```env
PORT=3001
```

### Option B: Directement dans le code

Modifiez `Backend/src/api/server.ts` ligne 15:
```typescript
const PORT = process.env.PORT || 3001;  // Changé de 3000 à 3001
```

**⚠️ N'oubliez pas de mettre à jour le frontend aussi!** Dans `Frontend/src/services/api.ts`, changez l'URL de base.

## ✅ Étape 3: Relancer le serveur

```bash
cd /mnt/c/Users/byezz/Desktop/hackathon_walrus/hackathon_Walrus_ARA/Backend
npm run api:dev
```

Le serveur devrait maintenant démarrer et rester actif! 🎉

