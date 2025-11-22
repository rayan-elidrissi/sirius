# Snapshots et consensus

## Snapshot global

À chaque epoch, un snapshot est créé contenant :
- État de tous les nœuds
- Integrity scores
- Risk scores
- Liste des divergences détectées
- Réputations mises à jour

## Consensus k-of-n

Un agrégateur collecte :
- Signatures de k nœuds sur n
- Scores d'intégrité
- Fingerprints

Valide la cohérence et publie un snapshot unique.

## Contenu du snapshot

```json
{
  "epoch": 123,
  "timestamp": 1234567890,
  "nodes": [
    {
      "node_id": "0x...",
      "integrity_score": 0.95,
      "reputation": 0.92,
      "status": "healthy"
    },
    ...
  ],
  "divergences": [...],
  "mean_integrity": 0.93,
  "risk_score": 0.15,
  "signatures": ["0x...", ...]
}
```

## Ancrage

Le snapshot est ancré sur Sui via `submit_snapshot` pour :
- Immutabilité
- Vérification publique
- Audit historique

