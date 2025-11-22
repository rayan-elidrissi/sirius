# Scoring d'intégrité

## Integrity Score

Chaque nœud reçoit un `integrity_score` basé sur :
- Cohérence avec les autres nœuds
- Historique de fiabilité
- Temps de réponse
- Qualité des fingerprints

## Calcul

```
integrity_score = f(
  cohérence_actuelle,
  historique,
  performance,
  réputation
)
```

## Utilisation

- **Décision d'ancrage** : Nœuds avec score faible déclenchent ancrage
- **Réputation** : Contribue au score de réputation global
- **Alertes** : Score faible = alerte automatique

## Mise à jour

Le score est mis à jour :
- À chaque epoch
- Après détection de divergence
- Après vérification d'intégrité

