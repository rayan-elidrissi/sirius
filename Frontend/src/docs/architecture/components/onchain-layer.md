# On-chain Layer

La couche on-chain gère l'intégration avec la blockchain Sui pour l'ancrage et l'attestation.

## Types de transactions

### anchor_epoch

Publie le Merkle root d'un lot de commits (epochs batchés).

**Avantages** : Réduction des coûts en batchant plusieurs commits.

### submit_snapshot

Enregistre la cohérence inter-nœuds :
- k-of-n signatures
- Moyenne des `integrity_scores`
- État global du système

### record_receipt

Consigne les reçus de reproductibilité IA :
- Lien entre modèle, dataset, version
- Hyperparamètres
- Métriques de performance

## Propriétés

- **Public** : Toutes les transactions sont consultables
- **Vérifiable** : Base cryptographique pour la vérification
- **Immuable** : Une fois ancré, l'état ne peut être modifié

