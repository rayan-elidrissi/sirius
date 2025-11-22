# 🔍 Diagnostic Immédiat - Failed to Fetch

## ⚠️ Problème
"Failed to fetch" = Le frontend ne peut pas communiquer avec le backend.

## 🔍 Étape 1: Vérifier que le backend est démarré

Dans votre terminal WSL Ubuntu où vous avez lancé le backend, vous devriez voir:
```
🚀 Sirius Data Layer API running on http://localhost:3001
✅ Server is listening and ready to accept requests...
```

**Si vous ne voyez PAS ces messages, le backend n'est pas démarré!**

Lancez-le:
```bash
cd /mnt/c/Users/byezz/Desktop/hackathon_walrus/hackathon_Walrus_ARA/Backend
npm run api:dev
```

## 🔍 Étape 2: Tester la connexion backend

Dans un **NOUVEAU terminal WSL**, testez:

```bash
curl http://localhost:3001/health
```

**Résultat attendu:**
```json
{"status":"ok","service":"sirius-data-layer-api"}
```

**Si vous obtenez une erreur:**
- `Connection refused` → Backend pas démarré
- `Connection timed out` → Problème de réseau/firewall
- `404 Not Found` → Route incorrecte

## 🔍 Étape 3: Vérifier le port du backend

Vérifiez dans `Backend/.env`:
```env
PORT=3001
```

Si le fichier n'existe pas ou a un autre port, créez-le:
```bash
cd /mnt/c/Users/byezz/Desktop/hackathon_walrus/hackathon_Walrus_ARA/Backend
cat > .env << 'EOF'
PORT=3001
FRONTEND_URL=http://localhost:5173
WALRUS_NETWORK=testnet
EOF
```

## 🔍 Étape 4: Vérifier la configuration frontend

Vérifiez dans `Frontend/.env`:
```env
VITE_API_URL=http://localhost:3001/api
```

Si le fichier n'existe pas, créez-le:
```bash
cd /mnt/c/Users/byezz/Desktop/hackathon_walrus/hackathon_Walrus_ARA/Frontend
cat > .env << 'EOF'
VITE_API_URL=http://localhost:3001/api
EOF
```

**⚠️ IMPORTANT:** Après avoir créé/modifié `.env`, vous DEVEZ redémarrer le serveur frontend!

```bash
# Arrêtez le serveur (Ctrl+C)
# Puis relancez
npm run dev
```

## 🔍 Étape 5: Vérifier les logs du backend

Quand vous essayez de créer un projet dans le frontend, regardez les logs du backend.

**Vous devriez voir:**
```
POST /api/datasets
```

**Si vous ne voyez RIEN dans les logs du backend:**
- La requête n'arrive pas au backend
- Problème de CORS ou d'URL incorrecte

## 🔍 Étape 6: Vérifier la console du navigateur

1. Ouvrez le frontend dans votre navigateur
2. Appuyez sur **F12** pour ouvrir les DevTools
3. Allez dans l'onglet **Console**
4. Essayez de créer un projet
5. Regardez les erreurs dans la console

**Erreurs possibles:**
- `Failed to fetch` → Backend inaccessible
- `CORS policy` → Problème de CORS
- `Network error` → Backend pas démarré

## 🔍 Étape 7: Test manuel depuis le navigateur

Dans la console du navigateur (F12), testez:

```javascript
fetch('http://localhost:3001/api/datasets')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

**Si ça fonctionne:** Le backend est accessible, problème dans le code frontend.
**Si ça échoue:** Le backend n'est pas accessible depuis le navigateur (CORS ou backend pas démarré).

---

## ✅ Checklist Rapide

- [ ] Backend démarré et affiche "Server is listening" sur le port 3001
- [ ] `curl http://localhost:3001/health` retourne `{"status":"ok"}`
- [ ] `Frontend/.env` existe avec `VITE_API_URL=http://localhost:3001/api`
- [ ] Frontend redémarré après création/modification du `.env`
- [ ] Console du navigateur (F12) ouverte pour voir les erreurs
- [ ] Logs du backend visibles quand vous créez un projet

---

## 🆘 Partagez ces informations

1. **Les logs du backend** (terminal WSL où tourne le backend)
2. **Les erreurs de la console du navigateur** (F12 → Console)
3. **Le résultat de `curl http://localhost:3001/health`**
4. **Le contenu de `Backend/.env`** (sans secrets)
5. **Le contenu de `Frontend/.env`**

