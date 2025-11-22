# 🎬 Guide de Démo : Sirius Frontend

## ✅ Le Serveur Tourne Déjà!

Le serveur dev devrait être démarré. Vérifiez votre terminal, vous devriez voir:

```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

---

## 🎯 WORKFLOW COMPLET (Étape par Étape)

### ÉTAPE 1 : Page d'Accueil (Existante)

**URL:** `http://localhost:5173/`

**Ce que vous voyez:**
- Votre page Home originale
- Le bouton **"Use Sir"** (existant)

**Action:** 👉 Cliquez sur "Use Sir"

---

### ÉTAPE 2 : Landing Sirius (Nouvelle!)

**URL:** `http://localhost:5173/sirius` (redirection automatique)

**Ce que vous voyez:**
```
🌟 SIRIUS

[Badge: Powered by Walrus & Sui]

Trust & Traceability for
Distributed Storage

Cryptographic integrity, verifiable history...

[🔐 Connect Wallet to Start]  ← GROS BOUTON

Connect your Sui wallet • No installation required

[3 Feature Cards: Merkle Roots, Signatures, Version Chain]

[Stats: 99.9% Uptime, ~$0.002, < 5s, 100% Verifiable]
```

**Action:** 👉 Cliquez sur "Connect Wallet to Start"

---

### ÉTAPE 3 : Modal Connexion Wallet

**Ce qui s'ouvre:**
```
┌────────────────────────────────┐
│  Connect Wallet         [✕]    │
├────────────────────────────────┤
│                                │
│  Choose how to connect:        │
│                                │
│  [🦊 Sui Wallet]               │
│  Most popular • Secure         │
│  [Connect]                     │
│                                │
│  [🔷 Suiet Wallet]             │
│  Open source...                │
│  [Connect]                     │
│                                │
│  [✨ Ethos Wallet]              │
│  Email-based...                │
│  [Connect]                     │
│                                │
│  ─── Or connect with ───       │
│                                │
│  [G Sign in with Google]       │
│  (zkLogin)                     │
│                                │
│  🔒 Keys stay in wallet        │
└────────────────────────────────┘
```

**Action:** 👉 Cliquez sur n'importe quel wallet (ex: "Sui Wallet")

**Résultat:**
- Toast: "Wallet connected successfully!" ✅
- Modal se ferme
- **Redirection automatique vers `/dashboard`**

---

### ÉTAPE 4 : Dashboard (Vide)

**URL:** `http://localhost:5173/dashboard`

**Ce que vous voyez:**
```
┌──────────────────────────────────────┐
│  🌟 Sirius  [Docs] [About]           │
│                      👤 0x635c3e...   │
│                      [Disconnect ▼]  │
├──────────────────────────────────────┤
│                                      │
│  My Projects      [+ New Project]   │
│                                      │
│  ┌────────────────────────────────┐ │
│  │  📦 No projects yet            │ │
│  │                                 │ │
│  │  Create your first project to  │ │
│  │  start versioning your data    │ │
│  │                                 │ │
│  │  [Create My First Project]     │ │
│  └────────────────────────────────┘ │
│                                      │
│  💡 Quick Actions:                  │
│  • Tutorial  • Demo  • Docs         │
└──────────────────────────────────────┘
```

**Remarquez:**
- Header avec **WalletInfo** (votre adresse)
- Dropdown au clic (Copy address, Disconnect)
- Empty state bien designé

**Action:** 👉 Cliquez sur "Create My First Project" OU "+ New Project"

---

### ÉTAPE 5 : Modal Création Projet

**Ce qui s'ouvre:**
```
┌────────────────────────────────────┐
│  Create New Project         [✕]   │
├────────────────────────────────────┤
│                                    │
│  Project Name *                    │
│  [_________________________]       │
│                                    │
│  Description                       │
│  [_________________________]       │
│  [_________________________]       │
│                                    │
│  Category                          │
│  [🔬 Scientific Research  ▼]      │
│                                    │
│  Security Level                    │
│  ○ Standard                        │
│  ● Enhanced (Recommended)          │
│  ○ Maximum                         │
│                                    │
│  [Cancel]     [Create Project]    │
└────────────────────────────────────┘
```

**Action:** 
1. 👉 Entrez un nom (ex: "Test Project")
2. 👉 (Optionnel) Description
3. 👉 Choisissez Enhanced (déjà sélectionné)
4. 👉 Cliquez "Create Project"

**Résultat:**
- Toast: "Project 'Test Project' created!" ✅
- Modal se ferme
- **Redirection automatique vers `/project/:id`**

---

### ÉTAPE 6 : Page Projet (Détails)

**URL:** `http://localhost:5173/project/project-xxxxx`

**Ce que vous voyez:**
```
┌──────────────────────────────────────────┐
│  🌟 Sirius > Test Project                │
│  [< Back]                  👤 0x635c3e... │
├──────────────────────────────────────────┤
│  Files: 0 • Versions: 0 • Security: Enh. │
├──────────────────────────────────────────┤
│  [Files] [Versions] [Activity]  ← TABS   │
├──────────────────────────────────────────┤
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  📤 Drop files here                │ │
│  │     or click to browse             │ │
│  │                                     │ │
│  │  All file types • Max 10 GB        │ │
│  │                                     │ │
│  │  [Select Files]                    │ │
│  │                                     │ │
│  │  Files stored on Walrus            │ │
│  └────────────────────────────────────┘ │
│                                          │
│  No files yet. Upload to begin.         │
└──────────────────────────────────────────┘
```

**Testez:**
1. 👉 Cliquez sur l'uploader ou drag & drop
2. La zone devient verte quand vous drag
3. Upload simule un délai puis success
4. Files apparaissent en dessous

---

### ÉTAPE 7 : Tab Versions

**Action:** 👉 Cliquez sur l'onglet "Versions"

**Ce que vous voyez:**
```
┌──────────────────────────────────────────┐
│  [Files] [Versions] [Activity]           │
├──────────────────────────────────────────┤
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  🔖 No versions yet                │ │
│  │                                     │ │
│  │  Upload files and create your      │ │
│  │  first version to begin tracking   │ │
│  │  history                            │ │
│  └────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

---

## 🎨 EXPLOREZ L'INTERFACE

### Header Wallet Info

**Cliquez sur `0x635c3e...` en haut à droite:**
```
┌────────────────────────────┐
│  Connected with            │
│  Sui Wallet                │
│  0x635c3e8edf5fb402b22...  │
│                            │
│  [Copy Address]            │
│  [Disconnect]              │
└────────────────────────────┘
```

### Navigation

**Testez tous les liens:**
- ✅ "Back" → Retour au dashboard
- ✅ "Docs" → Page docs existante
- ✅ "About" → Page about existante
- ✅ Disconnect → Déconnexion + redirect /sirius

---

## 🎯 FLOW COMPLET VISUEL

```
HOME
 ↓ [Use Sir]
SIRIUS LANDING
 ↓ [Connect Wallet]
MODAL WALLETS
 ↓ [Choisir wallet]
DASHBOARD (Vide)
 ↓ [New Project]
MODAL CREATE
 ↓ [Submit]
PROJECT DETAILS
 ├─ Tab Files
 │   ├─ Uploader
 │   └─ Files List
 ├─ Tab Versions
 │   └─ Versions List (avec chain viz)
 └─ Tab Activity
```

---

## 🎨 DESIGN HIGHLIGHTS

### Couleurs
- **Background:** `#161923` (bleu foncé)
- **Cards:** `#0f172a` (encore plus foncé)
- **Borders:** `#334155` (gris)
- **Accent:** `#97F0E5` (cyan brillant)
- **Hover:** Brightness 110%

### Animations
- ✅ Backdrop blur sur modals
- ✅ Transitions smooth (200ms)
- ✅ Hover effects sur tous les boutons
- ✅ Loading spinners
- ✅ Toasts notifications

### Responsive
- ✅ Mobile-friendly
- ✅ Grid adaptatif
- ✅ Modals centrés
- ✅ Scroll smooth

---

## 🎉 C'EST PRÊT!

**Votre frontend Sirius fonctionne maintenant!**

**Testez tout:**
1. ✅ Connexion wallet (mock)
2. ✅ Création projet
3. ✅ Navigation entre pages
4. ✅ Modals open/close
5. ✅ Tabs switching
6. ✅ UI responsive
7. ✅ Toasts notifications

**Tout est visuel et interactif!** 🎨✨

---

## 📝 Notes

**Mock Data:**
- Wallet connexion simulée (address hardcodée)
- Projets stockés en state local (pas de backend)
- Upload simulé (pas de vrai Walrus)
- Tout fonctionne pour VOIR le workflow

**Pour Production:**
- Ajouter vraies API backend
- Connecter vrais wallets Sui
- Intégrer vrai Walrus
- Mais le UI est PRÊT! 🚀

---

**Explorez l'interface et profitez de votre nouveau système Sirius!** 🌟
