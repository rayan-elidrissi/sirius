# anchor_epoch

Ancre le Merkle root d'un lot de commits (epochs batchés) sur la blockchain Sui.

## Structure

```rust
pub struct AnchorEpoch {
    pub dataset_id: ObjectID,
    pub merkle_root: Hash,
    pub epoch_range: (u64, u64),  // (start, end)
    pub parent_root: Option<Hash>,
    pub timestamp: u64,
}
```

## Batching

Plusieurs epochs peuvent être batchés dans une seule transaction pour réduire les coûts :
- Réduction du nombre de transactions
- Optimisation du gas
- Maintien de la vérifiabilité

## Merkle-of-Merkle

Les Merkle roots des epochs sont organisés en Merkle tree :
- Vérification efficace
- Preuve de tous les epochs avec un seul root
- Économie de gas supplémentaire

## Utilisation

Déclenché :
- À intervalles fixes (epoch)
- En cas d'alerte (divergence détectée)
- Sur demande (ancrage manuel)

