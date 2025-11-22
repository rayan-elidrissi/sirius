# Détection de divergences

## Processus

1. **Collecte** : Rassemblement des fingerprints de tous les nœuds
2. **Comparaison** : Analyse des différences entre nœuds
3. **Évaluation** : Calcul du `risk_score`
4. **Décision** : Déclenchement d'ancrage si seuil dépassé

## Risk Score

Le `risk_score` est calculé en fonction de :
- Nombre de nœuds en divergence
- Amplitude des différences
- Historique des nœuds
- Criticité du dataset

## Seuils

- **Seuil bas** : Ancrage préventif
- **Seuil moyen** : Ancrage recommandé
- **Seuil haut** : Ancrage obligatoire

## Actions

Si le seuil est dépassé :
- Ancrage adaptatif déclenché
- Alertes envoyées
- Snapshot créé pour audit

