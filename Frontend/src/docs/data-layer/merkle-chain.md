# Merkle Chain

La Merkle Chain construit un historique vérifiable des versions d'un dataset.

## Principe

Chaque version contient :
- Son propre Merkle root
- Le `parent_root` de la version précédente
- Une signature cryptographique

Cela crée une chaîne immuable et vérifiable.

## Vérification

Pour vérifier l'intégrité d'une version :
1. Vérifier le Merkle root contre les blobs
2. Vérifier la signature
3. Vérifier le lien avec la version précédente
4. Remonter la chaîne jusqu'à l'ancrage sur Sui

## Avantages

- **Traçabilité complète** : Historique complet du dataset
- **Détection de forks** : Divergences immédiatement visibles
- **Efficacité** : Pas besoin de stocker toutes les données, seulement les roots

