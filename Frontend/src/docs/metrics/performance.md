# Indicateurs de performance

## Mean Integrity Score

Cohérence moyenne des nœuds par epoch.

**Calcul** :
```
mean_integrity = sum(integrity_scores) / count(nodes)
```

**Objectif** : > 0.9

## Risk Score moyen

Taux de forks détectés / total d'epochs.

**Calcul** :
```
risk_score_avg = count(forks) / count(epochs)
```

**Objectif** : < 0.1

## Coût d'ancrage réduit

Nombre moyen de commits par transaction.

**Calcul** :
```
cost_reduction = count(commits) / count(transactions)
```

**Objectif** : > 5

## Reproducibility pass rate

Proportion de reçus validés.

**Calcul** :
```
pass_rate = count(valid_receipts) / count(total_receipts)
```

**Objectif** : > 0.95

## Time-to-anchor

Délai moyen entre fork détecté et ancrage effectif.

**Objectif** : < 30s

