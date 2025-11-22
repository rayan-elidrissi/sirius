# AI Layer

La couche IA fournit la surveillance, la détection de divergences et la gouvernance.

## Composants

### Fingerprints

Collecte de signatures légères :
- Résumés statistiques
- MinHash
- Bloom Filters
- Embeddings quantisés

Générées localement par les nœuds de stockage ou des sondes légères.

### Détection de divergences

- Compare les fingerprints entre nœuds
- Calcule un `risk_score` en cas de divergence
- Déclenche un ancrage adaptatif si le seuil est dépassé

### Scoring d'intégrité

- `integrity_score` pour chaque nœud
- Score de réputation dynamique (moyenne glissante pondérée)
- Enregistrement dans des snapshots globaux

## Avantages

- Surveillance continue sans transfert de données brutes
- Détection automatique des altérations
- Réputation basée sur l'historique

