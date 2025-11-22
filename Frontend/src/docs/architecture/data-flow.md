# Flux de données

## Flux principal

1. **Stockage initial** : Les données sont stockées, générant des `blob_id`

2. **Création du manifest** : La Data Layer regroupe les blobs dans un manifest

3. **Calcul du Merkle root** : Empreinte globale calculée et liée à la version précédente

4. **Génération de fingerprints** : L'AI Layer génère des signatures légères

5. **Surveillance** : Comparaison des fingerprints entre nœuds

6. **Détection** : Si divergence détectée, calcul du `risk_score`

7. **Ancrage adaptatif** : Si seuil dépassé, ancrage sur Sui

8. **Snapshot** : Enregistrement de l'état global

9. **Visualisation** : Affichage dans le Dashboard

## Flux de reproductibilité

1. Exécution IA (entraînement/évaluation/inference)
2. Génération du receipt : `hash(model_id, code_hash, dataset_id, version_root, hyperparams, metrics)`
3. Enregistrement sur Sui via `record_receipt`
4. Visualisation dans le Dashboard

