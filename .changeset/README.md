# Changesets

Ce dossier contient les changesets pour la gestion automatique du versioning et du changelog.

## Utilisation

### Ajouter un changeset

Après avoir fait des modifications, créez un changeset :

```bash
pnpm changeset
```

Suivez les instructions pour :
1. Sélectionner le type de changement (major/minor/patch)
2. Écrire un résumé du changement

### Créer une release

Pour créer une nouvelle version et mettre à jour le CHANGELOG :

```bash
pnpm version-packages
```

### Publier sur npm

```bash
pnpm release
```

## Types de versions

- **major** (1.0.0 → 2.0.0) : Breaking changes
- **minor** (1.0.0 → 1.1.0) : Nouvelles fonctionnalités
- **patch** (1.0.0 → 1.0.1) : Corrections de bugs
