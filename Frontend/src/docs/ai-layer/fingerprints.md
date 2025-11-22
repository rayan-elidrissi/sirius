# Fingerprints et surveillance

## Types de fingerprints

### Résumés statistiques

- Taille, nombre de lignes, distribution
- Calculs légers et rapides

### MinHash

- Signature probabiliste pour détecter similarité
- Efficace pour grandes quantités de données

### Bloom Filters

- Structure probabiliste pour tests d'appartenance
- Très léger en mémoire

### Embeddings quantisés

- Représentations compressées du contenu
- Permet comparaison sémantique

## Génération

Les fingerprints sont générés :
- **Localement** : Par chaque nœud de stockage
- **Par sondes** : Agents légers de surveillance
- **Sans transfert** : Aucune donnée brute n'est transférée

## Comparaison

L'IA compare les fingerprints entre nœuds pour détecter :
- Divergences de contenu
- Altérations malveillantes
- Incohérences de version

