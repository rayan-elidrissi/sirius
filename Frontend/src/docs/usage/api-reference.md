# API Reference

## Data Layer API

### createDataset(options)

Crée un nouveau dataset.

### createVersion(datasetId, options)

Crée une nouvelle version d'un dataset.

### getVersion(datasetId, versionRoot)

Récupère une version spécifique.

## AI Layer API

### startMonitoring()

Démarre la surveillance des nœuds.

### getIntegrityScores()

Récupère les scores d'intégrité de tous les nœuds.

### getReputations()

Récupère les réputations de tous les nœuds.

## On-chain API

### anchorEpoch(datasetId, epochs)

Ancre des epochs sur Sui.

### submitSnapshot(snapshot)

Soumet un snapshot sur Sui.

### recordReceipt(receipt)

Enregistre un receipt de reproductibilité.

