# Exemples d'utilisation

## Exemple 1 : Créer un dataset versionné

```javascript
const { DataLayer } = require('@sirius/data-layer');

const dataLayer = new DataLayer(config);

// Créer un nouveau dataset
const dataset = await dataLayer.createDataset({
  name: 'my-dataset',
  description: 'Example dataset'
});

// Ajouter des blobs
const blobIds = await storage.uploadFiles(['file1.csv', 'file2.csv']);

// Créer une version
const version = await dataLayer.createVersion(dataset.id, {
  blobs: blobIds,
  metadata: { source: 'manual' }
});

console.log('Version created:', version.merkle_root);
```

## Exemple 2 : Générer un receipt de reproductibilité

```javascript
const { Onchain } = require('@sirius/onchain');

const receipt = await Onchain.recordReceipt({
  model_id: '0x...',
  code_hash: '0x...',
  dataset_id: dataset.id,
  version_root: version.merkle_root,
  hyperparams: { learning_rate: 0.001 },
  metrics: { accuracy: 0.95 }
});

console.log('Receipt recorded:', receipt.receipt_id);
```

## Exemple 3 : Surveiller les nœuds

```javascript
const { AILayer } = require('@sirius/ai-layer');

const aiLayer = new AILayer(config);

// Démarrer la surveillance
aiLayer.startMonitoring();

// Écouter les alertes
aiLayer.on('divergence', (data) => {
  console.log('Divergence detected:', data);
});

aiLayer.on('anchor', (data) => {
  console.log('Anchoring triggered:', data);
});
```
