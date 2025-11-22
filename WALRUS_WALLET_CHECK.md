# 🔍 Vérification Wallet Walrus

## ⚠️ Problème

Vous avez 0.18 WAL dans votre wallet Sui, mais Walrus dit qu'il ne trouve pas assez de WAL coins.

## 🔍 Diagnostic

### 1. Vérifier que Walrus utilise le bon wallet

Dans WSL, vérifiez la configuration du wallet Sui utilisée par Walrus :

```bash
# Vérifier la configuration Walrus
cat ~/.config/walrus/client_config.yaml

# Vérifier la configuration Sui
cat ~/.sui/sui_config/client.yaml
```

### 2. Vérifier l'adresse active

Assurez-vous que l'adresse Sui active est celle qui a les WAL coins :

```bash
# Votre adresse actuelle
sui client active-address

# Votre adresse avec WAL coins (d'après votre output)
# 0x635c3e8edf5fb402b229932cdf5c1ea26a49866f430ceb67547271fccd14c897
```

### 3. Vérifier le coût de stockage

Le coût dépend de :
- La taille du fichier
- Le nombre d'epochs (durée de stockage)

**Solution temporaire :** J'ai modifié le code pour utiliser `--epochs 1` au lieu de `--epochs 50`, ce qui réduit considérablement le coût.

### 4. Si le problème persiste

Essayez de stocker un fichier très petit (quelques bytes) pour tester :

```bash
# Dans WSL
echo "test" > /tmp/test.txt
walrus store --epochs 1 /tmp/test.txt
```

Si ça fonctionne avec un petit fichier, le problème est le coût pour les fichiers plus grands.

## 💡 Solutions

1. **Réduire les epochs** : ✅ Déjà fait (1 epoch au lieu de 50)
2. **Obtenir plus de WAL coins** : Via faucet ou communauté
3. **Vérifier la configuration wallet** : S'assurer que Walrus utilise le bon wallet

---

**Note :** Avec `--epochs 1`, le blob sera stocké pendant 1 jour (1 epoch). C'est suffisant pour tester, et vous pourrez augmenter plus tard si nécessaire.

