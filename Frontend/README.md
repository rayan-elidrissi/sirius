# Front Walrus

Application React moderne avec TypeScript et Tailwind CSS.

## 🚀 Démarrage rapide

### Installation

```bash
npm install
```

### Développement

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview

```bash
npm run preview
```

## 📁 Structure du projet

```
front-walrus/
├── components/              # Composants réutilisables (Header, UseSirButton)
│   ├── Header.tsx
│   └── UseSirButton.tsx
├── src/
│   ├── components/          # Composants React réutilisables
│   │   ├── Button.tsx
│   │   └── LoadingSpinner.tsx
│   ├── pages/              # Pages de l'application
│   │   ├── Home.tsx
│   │   ├── About.tsx
│   │   └── Docs.tsx
│   ├── hooks/              # Hooks React personnalisés
│   │   ├── useLocalStorage.ts
│   │   └── useDebounce.ts
│   ├── utils/              # Fonctions utilitaires
│   │   ├── cn.ts           # Utility pour classes Tailwind
│   │   └── formatDate.ts
│   ├── services/           # Services API
│   │   └── api.ts
│   ├── context/            # Contextes React
│   │   └── AppContext.tsx
│   ├── types/              # Définitions TypeScript
│   │   └── index.ts
│   ├── constants/          # Constantes de l'application
│   │   └── index.ts
│   ├── config/             # Configuration
│   │   └── index.ts
│   ├── assets/             # Images, fonts, etc.
│   ├── App.tsx             # Composant principal avec routing
│   ├── main.tsx            # Point d'entrée
│   ├── index.css           # Styles globaux Tailwind
│   └── vite-env.d.ts       # Types pour variables d'environnement
├── index.html              # Template HTML
├── package.json            # Dépendances et scripts
├── tsconfig.json           # Configuration TypeScript
├── tsconfig.node.json      # Configuration TypeScript pour Node
├── vite.config.ts          # Configuration Vite
├── tailwind.config.js      # Configuration Tailwind CSS
├── postcss.config.js       # Configuration PostCSS
├── .eslintrc.cjs           # Configuration ESLint
└── .gitignore              # Fichiers ignorés par Git
```

## 🛠️ Technologies

- **React 18** - Bibliothèque UI
- **TypeScript** - Typage statique
- **Vite** - Build tool
- **Tailwind CSS** - Framework CSS
- **React Router** - Routing

## 📝 Scripts disponibles

- `npm run dev` - Lance le serveur de développement
- `npm run build` - Build pour la production
- `npm run preview` - Preview du build de production
- `npm run lint` - Lint le code

# front-walrus
