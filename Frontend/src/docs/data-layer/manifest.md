# Manifest et versionnement

## Structure du manifest

Un manifest regroupe les fichiers dans une structure ordonnée :

```json
{
  "version": 1,
  "dataset_id": "0x...",
  "blobs": [
    {
      "blob_id": "0x...",
      "path": "data/file1.csv",
      "size": 1024,
      "metadata": {...}
    },
    ...
  ],
  "merkle_root": "0x...",
  "parent_root": "0x...",
  "timestamp": 1234567890,
  "signature": "0x..."
}
```

## Versionnement

Chaque version :
- Contient la liste complète des `blob_id`
- Calcule un Merkle root global
- Référence la version précédente via `parent_root`
- Est signée cryptographiquement

## Stockage

- **Ceramic/IPLD** : Pour lecture rapide
- **Ancrage Sui** : Pour immutabilité et vérification

