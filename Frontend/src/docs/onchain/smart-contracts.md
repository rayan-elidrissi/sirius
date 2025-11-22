# Smart Contracts

Les smart contracts Sui gèrent l'ancrage et l'attestation.

## Contrats principaux

### DatasetRegistry

Gère l'enregistrement et le suivi des datasets :
- Enregistrement des datasets
- Suivi des versions
- Ancrage des epochs

### SnapshotAggregator

Agrège et valide les snapshots :
- Collecte des signatures k-of-n
- Validation de cohérence
- Publication des snapshots

### ReproducibilityReceipts

Gère les reçus de reproductibilité :
- Enregistrement des receipts
- Vérification des liens
- Requêtes et audits

## Propriétés

- **Upgradeable** : Contrats pouvant être mis à jour
- **Gas efficient** : Optimisés pour réduire les coûts
- **Public** : Tous les états sont consultables

