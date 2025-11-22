# Performance

## Optimisations

### Batching

Batch les opérations pour réduire les coûts :
- Plusieurs epochs en une transaction
- Plusieurs receipts en une transaction

### Caching

Mise en cache des :
- Merkle roots
- Fingerprints
- Integrity scores

### Lazy loading

Chargement à la demande des :
- Manifests complets
- Historique des versions
- Snapshots

## Métriques

- **Latence d'ancrage** : < 5s
- **Génération de fingerprint** : < 100ms
- **Détection de divergence** : < 1s

## Monitoring

Utiliser les métriques pour :
- Identifier les goulots d'étranglement
- Optimiser les performances
- Planifier la scalabilité

