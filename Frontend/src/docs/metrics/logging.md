# Logging

## Niveaux de log

- **ERROR** : Erreurs critiques
- **WARN** : Avertissements
- **INFO** : Informations générales
- **DEBUG** : Détails de débogage

## Format

Logs au format JSON :

```json
{
  "timestamp": "2024-01-01T00:00:00Z",
  "level": "INFO",
  "module": "data-layer",
  "message": "Version created",
  "data": {
    "dataset_id": "0x...",
    "version_root": "0x..."
  }
}
```

## Rotation

Logs rotatés quotidiennement, conservés 30 jours.

## Analyse

Utiliser des outils comme :
- ELK Stack
- Grafana Loki
- CloudWatch

