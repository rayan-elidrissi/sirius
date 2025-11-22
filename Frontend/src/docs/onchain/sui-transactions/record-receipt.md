# record_receipt

Consigne les reçus de reproductibilité IA, liant modèles et versions de données.

## Structure

```rust
pub struct RecordReceipt {
    pub receipt_id: Hash,
    pub model_id: ObjectID,
    pub code_hash: Hash,
    pub dataset_id: ObjectID,
    pub version_root: Hash,
    pub hyperparams: Vec<u8>,  // Serialized
    pub metrics: Vec<u8>,       // Serialized
    pub timestamp: u64,
}
```

## Receipt Hash

Le `receipt_id` est calculé comme :

```
receipt_id = hash(
    model_id,
    code_hash,
    dataset_id,
    version_root,
    hyperparams,
    metrics
)
```

## Utilisation

Généré lors de :
- **Entraînement** : Lien modèle → données d'entraînement
- **Évaluation** : Lien modèle → données de test
- **Inference** : Lien modèle → données d'inférence

## Reproductibilité

Permet de :
- Vérifier exactement quelles données ont été utilisées
- Reproduire les résultats
- Auditer les expériences IA

## Vérification

Tout acteur peut :
- Vérifier le receipt sur Sui
- Reconstruire l'état exact
- Valider la reproductibilité

