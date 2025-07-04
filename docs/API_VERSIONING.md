# Stratégie de versioning de l'API

Ce document détaille la stratégie de versioning adoptée pour notre API REST.

## 1. Méthode de versioning

Nous utilisons la méthode de **versioning par URI** qui consiste à inclure le numéro de version directement dans le chemin de l'URL.

Exemple :
```
https://api.example.com/api/v1/users
```

## 2. Numéro de version actuel

La version actuelle de l'API est **v1.0.0**.

## 3. Compatibilité

### Compatibilité ascendante (backward compatibility)

- Les nouvelles versions de l'API sont conçues pour maintenir une compatibilité ascendante
- Les clients utilisant une version précédente peuvent continuer à utiliser cette version même après la sortie d'une nouvelle version
- Les anciennes routes non versionnées sont temporairement redirigées vers la v1 pour assurer la transition

### Compatibilité descendante (forward compatibility)

- Les nouvelles fonctionnalités sont introduites dans les nouvelles versions et ne sont pas disponibles dans les versions antérieures
- Les clients sont encouragés à adopter la dernière version pour bénéficier des nouvelles fonctionnalités

## 4. Cycle de vie des versions

- **Support** : Chaque version est supportée pendant au moins 12 mois après la sortie d'une nouvelle version majeure
- **Dépréciation** : Une version est marquée comme dépréciée au moins 6 mois avant sa fin de support
- **Fin de support** : Après la période de support, une version peut être retirée avec un préavis de 3 mois

## 5. Directives pour les développeurs

### Quand créer une nouvelle version

- **Version majeure (v2, v3)** : Changements non rétrocompatibles (breaking changes)
- **Version mineure (v1.1, v1.2)** : Ajouts de fonctionnalités rétrocompatibles
- **Patch (v1.0.1, v1.0.2)** : Corrections de bugs, sans changement fonctionnel

### Publication d'une nouvelle version

1. Documenter tous les changements dans un CHANGELOG
2. Mettre à jour la documentation API
3. Communiquer aux utilisateurs les changements et les avantages de la mise à jour
4. Prévoir une période de transition pour les versions majeures

## 6. Changelog

### v1.0.0 (Version initiale - 1er mai 2025)

- Implémentation des fonctionnalités de base :
  - Authentification avec JWT
  - Gestion des utilisateurs
  - Gestion des produits
  - Gestion des catégories
- Architecture MVC
- Documentation Swagger
- Tests unitaires