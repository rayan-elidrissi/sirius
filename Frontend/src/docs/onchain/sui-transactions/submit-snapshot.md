# submit_snapshot

Enregistre la cohérence inter-nœuds et l'état global du système.

## Structure

```rust
pub struct SubmitSnapshot {
    pub epoch: u64,
    pub timestamp: u64,
    pub mean_integrity: f64,
    pub risk_score: f64,
    pub node_states: Vec<NodeState>,
    pub k_of_n_signatures: Vec<Signature>,
    pub merkle_root: Hash,
}
```

## Contenu

- **État des nœuds** : Integrity scores et réputations
- **Cohérence** : k-of-n signatures validant l'état
- **Métriques** : Moyennes et scores globaux
- **Merkle root** : Empreinte de l'état complet

## Consensus k-of-n

Requiert k signatures sur n nœuds pour valider :
- Résilience aux fautes
- Décision distribuée
- Pas de point de défaillance unique

## Fréquence

- À chaque epoch
- Après détection de divergence majeure
- Sur demande pour audit

