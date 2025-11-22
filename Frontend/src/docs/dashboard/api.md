# API Dashboard

## Endpoints

### Versions

```
GET /api/v1/datasets/:id/versions
GET /api/v1/datasets/:id/versions/:version
```

### Nœuds

```
GET /api/v1/nodes
GET /api/v1/nodes/:id
GET /api/v1/nodes/:id/history
```

### Snapshots

```
GET /api/v1/snapshots
GET /api/v1/snapshots/:epoch
```

### Receipts

```
GET /api/v1/receipts
GET /api/v1/receipts/:id
GET /api/v1/receipts?model_id=...
```

## Authentification

Utilise des tokens JWT pour l'authentification.

## Rate limiting

Limite de 100 requêtes par minute par défaut.

