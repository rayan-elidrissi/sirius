# 🧪 Test du Serveur - Diagnostic

## ⚠️ Problème
Le serveur démarre puis se termine immédiatement après avoir affiché les messages.

## 🔍 Test 1: Vérifier que le serveur reste actif

1. **Lancez le serveur:**
   ```bash
   npm run api:dev
   ```

2. **Observez les logs de debug:**
   - Vous devriez voir `🔍 Debug info:` avec les valeurs de `require.main`, `process.argv`, etc.
   - Vous devriez voir `🚀 Starting server...`
   - Vous devriez voir `💚 Process should stay alive. Event loop is active.`

3. **Vérifiez si le serveur répond:**
   Dans un **autre terminal**, testez:
   ```bash
   curl http://localhost:3000/health
   ```
   
   **Résultat attendu:**
   ```json
   {"status":"ok","service":"sirius-data-layer-api"}
   ```

## 🔍 Test 2: Vérifier les erreurs silencieuses

Si le serveur se termine immédiatement, il pourrait y avoir une erreur non capturée.

**Vérifiez dans les logs:**
- Y a-t-il des messages `❌ Uncaught Exception:` ?
- Y a-t-il des messages `❌ Unhandled Rejection:` ?
- Y a-t-il des erreurs TypeScript lors de la compilation ?

## 🔍 Test 3: Vérifier le port

Le port 3000 pourrait être déjà utilisé:

```bash
# Dans WSL
netstat -tuln | grep 3000
# ou
lsof -i :3000
```

Si le port est utilisé, changez `PORT` dans `.env` ou `server.ts`.

## 🔍 Test 4: Test manuel avec Node.js direct

Au lieu de `ts-node`, testez avec Node.js compilé:

```bash
# Compiler
npm run build

# Lancer le serveur compilé
npm run api:start
```

## 🔍 Test 5: Vérifier l'initialisation de WalrusService

L'initialisation de `WalrusService` dans `routes/walrus.ts` pourrait causer un problème.

**Temporairement, commentez cette ligne dans `Backend/src/api/routes/walrus.ts`:**
```typescript
// const walrusService = new WalrusService('testnet');
```

Et voyez si le serveur reste actif.

## ✅ Solution Attendu

Le serveur devrait:
1. Afficher tous les messages de démarrage
2. **Rester actif** (le terminal ne devrait PAS revenir au prompt)
3. Répondre aux requêtes HTTP sur `http://localhost:3000`

## 🐛 Si le problème persiste

Partagez:
1. **Tous les logs** du terminal quand vous lancez `npm run api:dev`
2. Le résultat de `curl http://localhost:3000/health` (si le serveur répond)
3. Le résultat de `netstat -tuln | grep 3000` (pour vérifier si le port est utilisé)

