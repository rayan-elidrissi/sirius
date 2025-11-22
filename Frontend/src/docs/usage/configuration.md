# Configuration

## Fichier de configuration

Le fichier principal de configuration est `config.json` :

```json
{
  "storage": {
    "rpc_url": "https://storage.example.com",
    "network": "testnet"
  },
  "sui": {
    "rpc_url": "https://fullnode.testnet.sui.io:443",
    "package_id": "0x...",
    "gas_budget": 100000000
  },
  "data_layer": {
    "epoch_duration": 300,
    "ceramic_url": "https://ceramic.example.com"
  },
  "ai_layer": {
    "risk_threshold_low": 0.3,
    "risk_threshold_medium": 0.6,
    "risk_threshold_high": 0.9,
    "fingerprint_types": ["minhash", "bloom", "stats"]
  },
  "onchain": {
    "batch_size": 10,
    "anchor_interval": 3600
  }
}
```

## Paramètres clés

### Epoch duration

Durée d'un epoch en secondes. Défaut : 300 (5 minutes).

### Risk thresholds

Seuils pour déclencher l'ancrage adaptatif.

### Batch size

Nombre d'epochs à batcher dans une transaction.
