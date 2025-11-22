# Réputation des nœuds

## Score de réputation

La réputation est calculée comme une moyenne glissante pondérée :
- Comportements récents plus importants
- Historique long terme pris en compte
- Décroissance temporelle des événements passés

## Facteurs

- **Intégrité** : Cohérence avec les autres nœuds
- **Disponibilité** : Temps de réponse et uptime
- **Fiabilité** : Nombre d'erreurs et corrections
- **Performance** : Vitesse de traitement

## Utilisation

- **Sélection** : Nœuds avec haute réputation privilégiés
- **Alertes** : Réputation faible = surveillance accrue
- **Gouvernance** : Influence sur les décisions d'ancrage

## Mise à jour

- Continue : Mise à jour à chaque interaction
- Périodique : Réévaluation à chaque epoch
- Événementielle : Ajustement après incidents

