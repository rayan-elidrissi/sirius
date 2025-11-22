# Développement de modules

## Structure d'un module

```
my-module/
├── src/
│   ├── index.ts
│   ├── types.ts
│   └── utils.ts
├── tests/
│   └── index.test.ts
├── package.json
└── tsconfig.json
```

## Interface standard

```typescript
export interface Module {
  name: string;
  version: string;
  initialize(config: Config): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
}
```

## Exemple

```typescript
export class MyModule implements Module {
  name = 'my-module';
  version = '1.0.0';

  async initialize(config: Config) {
    // Initialisation
  }

  async start() {
    // Démarrage
  }

  async stop() {
    // Arrêt
  }
}
```

