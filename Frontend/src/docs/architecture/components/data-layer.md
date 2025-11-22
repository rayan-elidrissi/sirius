# Data Layer

La Data Layer ajoute l'intégrité et le versionnement aux données stockées.

## Fonctionnalités principales

### Manifest

Regroupe les fichiers dans un manifest ordonné contenant :
- Liste des `blob_id`
- Métadonnées associées
- Ordre et structure du dataset

### Merkle Root

Calcule une empreinte globale (Merkle root) du manifest, permettant de vérifier l'intégrité de l'ensemble du dataset.

### Merkle Chain

Chaque version est liée à la précédente via `parent_root`, construisant une chaîne de versions vérifiable.

### Stockage

- **Commits signés** : Chaque version est signée cryptographiquement
- **Ceramic/IPLD** : Stockage pour lecture rapide
- **Ancrage Sui** : Ancrage périodique ou adaptatif sur la blockchain

## Avantages

- Identité immuable pour chaque dataset
- Historique vérifiable sans surcharge de gas
- Détection rapide des modifications

