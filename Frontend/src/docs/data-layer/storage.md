# Stockage Ceramic/IPLD

Pour une lecture rapide, les commits de version sont stockés dans Ceramic/IPLD.

## Avantages

- **Lecture rapide** : Accès sans passer par la blockchain
- **Décentralisé** : Stockage distribué
- **Vérifiable** : Contenu hashé et vérifiable

## Structure

Chaque commit contient :
- Le manifest complet
- Le Merkle root
- Les métadonnées
- La signature

## Synchronisation

- Les commits sont synchronisés avec les ancrages Sui
- En cas de divergence, l'ancrage Sui fait autorité
- Les nœuds peuvent reconstruire l'état depuis les ancrages

