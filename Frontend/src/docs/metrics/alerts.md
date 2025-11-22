# Alertes

## Types d'alertes

### Divergence détectée

Déclenchée quand :
- Fingerprints divergent entre nœuds
- Risk score dépasse le seuil

### Intégrité faible

Déclenchée quand :
- Integrity score < 0.7
- Plusieurs nœuds en erreur

### Ancrage échoué

Déclenchée quand :
- Transaction Sui échoue
- Timeout d'ancrage

## Configuration

Configurer les alertes dans `config.json` :

```json
{
  "alerts": {
    "divergence": {
      "enabled": true,
      "threshold": 0.6
    },
    "integrity": {
      "enabled": true,
      "threshold": 0.7
    }
  }
}
```

## Notifications

Alertes envoyées via :
- Email
- Slack
- Webhook
- Dashboard

