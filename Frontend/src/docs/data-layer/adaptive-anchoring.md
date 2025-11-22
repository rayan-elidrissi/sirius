# Ancrage adaptatif

L'ancrage adaptatif réduit les coûts on-chain en n'ancrant que lorsque nécessaire.

## Déclencheurs

L'ancrage se produit :

1. **À intervalles fixes** : Toutes les N minutes (epoch)
2. **En cas d'alerte** : Si un `risk_score` dépasse un seuil
3. **Détection de fork** : Si divergence détectée entre nœuds

## Stratégie

### Batch d'epochs

Plusieurs commits peuvent être batchés dans une seule transaction `anchor_epoch`, réduisant les coûts.

### Merkle-of-Merkle

Les Merkle roots des epochs sont eux-mêmes organisés en Merkle tree, permettant une vérification efficace.

## Avantages

- **Réduction des coûts** : Moins de transactions on-chain
- **Meilleure cohérence** : Ancrage immédiat en cas de problème
- **Flexibilité** : Adaptation automatique selon les conditions

