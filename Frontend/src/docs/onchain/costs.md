# Coûts et optimisation

## Stratégies d'optimisation

### Batching

Plusieurs commits batchés dans une seule transaction :
- Réduction du nombre de transactions
- Partage des coûts fixes
- Optimisation du gas

### Ancrage adaptatif

Ancrage uniquement lorsque nécessaire :
- Réduction des ancrages inutiles
- Réponse immédiate aux problèmes
- Équilibre coût/sécurité

### Merkle-of-Merkle

Organisation hiérarchique des roots :
- Vérification efficace
- Preuve de plusieurs epochs avec un seul root
- Économie supplémentaire

## Estimation des coûts

### anchor_epoch

- Coût fixe : ~X SUI
- Coût par epoch batché : ~Y SUI
- Coût total pour N epochs : X + (N * Y)

### submit_snapshot

- Coût fixe : ~Z SUI
- Coût par nœud : ~W SUI
- Coût total pour M nœuds : Z + (M * W)

### record_receipt

- Coût par receipt : ~V SUI
- Peut être batché pour réduire les coûts

## Optimisations futures

- Compression des données
- Utilisation de storage objects Sui
- Mise en cache intelligente

