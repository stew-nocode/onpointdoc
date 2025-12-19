# Workflow de Déploiement OnpointDoc

## 📋 Vue d'ensemble

Ce document décrit le workflow de déploiement obligatoire pour OnpointDoc. **Tous les développeurs doivent suivre ce processus sans exception.**

## 🌳 Structure des branches

```
main (production)
  ↑
staging (pré-production)
  ↑
develop (développement)
  ↑
feature/* ou fix/* (branches de travail)
```

### Branches principales

- **`main`** : Production - Déployé sur https://onpointdoc.vercel.app
- **`staging`** : Pré-production - Déployé sur https://onpointdoc-staging.vercel.app
- **`develop`** : Développement - Déployé sur https://onpointdoc-dev.vercel.app

### Branches de travail

- **`feature/*`** : Nouvelles fonctionnalités (ex: `feature/user-authentication`)
- **`fix/*`** : Corrections de bugs (ex: `fix/dashboard-filters`)
- **`refactor/*`** : Refactoring de code (ex: `refactor/api-structure`)
- **`docs/*`** : Documentation (ex: `docs/api-documentation`)

## 🔄 Processus de déploiement complet

### Étape 1 : Créer une branche de travail

```bash
# Se placer sur develop
git checkout develop
git pull origin develop

# Créer une nouvelle branche depuis develop
git checkout -b feature/nom-de-la-fonctionnalite
# ou
git checkout -b fix/nom-du-bug
```

**❌ NE JAMAIS créer de branche directement depuis `main` ou `staging`**

### Étape 2 : Développer et tester

```bash
# Développer votre fonctionnalité
# ...

# Tester le build TypeScript
npm run build

# Vérifier qu'il n'y a AUCUNE erreur TypeScript
# Build doit afficher : "✓ Compiled successfully"
```

**✅ Règle stricte : 0 erreurs TypeScript tolérées**

### Étape 3 : Commiter les changements

```bash
# Ajouter les fichiers modifiés
git add .

# Créer un commit avec message conventionnel
git commit -m "type(scope): description

- Détail 1
- Détail 2
- Détail 3

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**Types de commit conventionnels :**
- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `refactor`: Refactoring de code
- `docs`: Documentation
- `style`: Formatage, style
- `test`: Ajout/modification de tests
- `chore`: Tâches maintenance

**Exemples :**
```
feat(dashboard): ajouter filtre par année
fix(api): corriger erreur 500 sur /api/tickets
refactor(auth): simplifier la logique de login
docs(workflow): ajouter guide de déploiement
```

### Étape 4 : Push et merge dans develop

```bash
# Push la branche vers GitHub
git push origin feature/nom-de-la-fonctionnalite

# Merger dans develop
git checkout develop
git merge feature/nom-de-la-fonctionnalite --no-ff
git push origin develop
```

**📌 Vercel déploie automatiquement sur : https://onpointdoc-dev.vercel.app**

### Étape 5 : Tester sur l'environnement DEV

1. Attendre que le déploiement Vercel soit terminé (≈ 2-3 min)
2. Vérifier le build Vercel :
   ```bash
   # Optionnel : Vérifier le statut du déploiement
   vercel --yes
   ```
3. Tester manuellement sur https://onpointdoc-dev.vercel.app
4. Vérifier que TOUT fonctionne correctement

**❌ Si des bugs sont détectés :**
- Retourner à l'étape 2
- Corriger les bugs
- Re-tester

### Étape 6 : Merger dans staging

```bash
# Une fois validé sur DEV
git checkout staging
git pull origin staging
git merge develop --no-ff
git push origin staging
```

**📌 Vercel déploie automatiquement sur : https://onpointdoc-staging.vercel.app**

### Étape 7 : Tester sur l'environnement STAGING

1. Attendre le déploiement Vercel (≈ 2-3 min)
2. Tester manuellement sur https://onpointdoc-staging.vercel.app
3. **Tests approfondis** : Environnement le plus proche de la production
4. Vérifier :
   - Fonctionnalités ajoutées
   - Régression sur fonctionnalités existantes
   - Performance
   - Comportement avec données réelles

**❌ Si des problèmes sont détectés :**
- Corriger sur `develop`
- Re-merger `develop` → `staging`
- Re-tester

### Étape 8 : Créer une Pull Request vers main

**⚠️ IMPORTANT : NE JAMAIS merger directement dans `main`**

```bash
# Via GitHub UI ou CLI
gh pr create --base main --head staging \
  --title "Release: [Description courte]" \
  --body "## Changements

- Liste des changements principaux
- Fonctionnalités ajoutées
- Bugs corrigés

## Tests effectués

- [x] Tests sur DEV
- [x] Tests sur STAGING
- [x] Build TypeScript : 0 erreurs
- [x] Pas de régression

## Déploiement

Cette PR déploiera sur production : https://onpointdoc.vercel.app"
```

### Étape 9 : Review et merge de la PR

1. **Review de la PR** : Demander une review si nécessaire
2. **Attendre validation** : Ne pas merger sans validation
3. **Merger la PR** : Via GitHub UI (bouton "Merge pull request")
4. **Choisir** : "Create a merge commit" (pas de squash)

**📌 Vercel déploie automatiquement sur : https://onpointdoc.vercel.app**

### Étape 10 : Vérifier la production

1. Attendre le déploiement Vercel (≈ 2-3 min)
2. Vérifier sur https://onpointdoc.vercel.app
3. Tester les fonctionnalités déployées
4. Surveiller les logs Vercel pour erreurs

```bash
# Optionnel : Vérifier que la production est accessible
curl -I https://onpointdoc.vercel.app
```

## 🚨 Règles strictes

### ❌ INTERDICTIONS ABSOLUES

1. **NE JAMAIS** pousser directement sur `main`
2. **NE JAMAIS** pousser directement sur `staging`
3. **NE JAMAIS** merger une branche avec erreurs TypeScript
4. **NE JAMAIS** merger sans avoir testé sur DEV et STAGING
5. **NE JAMAIS** utiliser `git push --force` sur `main`, `staging`, ou `develop`
6. **NE JAMAIS** merger une PR sans review (sauf urgence validée)

### ✅ OBLIGATIONS

1. **TOUJOURS** créer une branche depuis `develop`
2. **TOUJOURS** tester avec `npm run build` avant de commit
3. **TOUJOURS** suivre la convention de commit
4. **TOUJOURS** tester sur DEV avant STAGING
5. **TOUJOURS** tester sur STAGING avant PRODUCTION
6. **TOUJOURS** créer une PR pour merger dans `main`

## 🔥 Procédure d'urgence (Hotfix)

En cas de bug critique en production :

```bash
# 1. Créer une branche hotfix depuis main
git checkout main
git pull origin main
git checkout -b hotfix/description-bug-critique

# 2. Corriger le bug
# ...

# 3. Tester le build
npm run build

# 4. Commit
git add .
git commit -m "hotfix: corriger [bug critique]

Description du bug et de la correction

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# 5. Push
git push origin hotfix/description-bug-critique

# 6. Créer PR vers main (review rapide)
gh pr create --base main --head hotfix/description-bug-critique \
  --title "HOTFIX: [Description]" \
  --label "hotfix,urgent"

# 7. Après merge, reporter dans develop et staging
git checkout develop
git pull origin main
git push origin develop

git checkout staging
git pull origin main
git push origin staging
```

## 📊 Checklist avant déploiement en production

- [ ] Build TypeScript : `npm run build` → 0 erreurs
- [ ] Tests manuels sur DEV : ✅ Tous passent
- [ ] Tests manuels sur STAGING : ✅ Tous passent
- [ ] Pas de régression détectée
- [ ] Variables d'environnement configurées
- [ ] Documentation à jour si nécessaire
- [ ] PR créée avec description détaillée
- [ ] Review effectuée (si applicable)
- [ ] Backup vérifié (si modification DB)

## 🔍 Vérification des déploiements Vercel

```bash
# Vérifier le statut de tous les environnements
curl -I https://onpointdoc-dev.vercel.app
curl -I https://onpointdoc-staging.vercel.app
curl -I https://onpointdoc.vercel.app

# Vérifier les déploiements récents
vercel ls --yes

# Voir les logs du déploiement actuel
# (Sur le dashboard Vercel)
```

## 📝 Résumé du workflow en une image

```
┌─────────────────┐
│ Créer branche   │
│ depuis develop  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Développer +    │
│ npm run build   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Commit + Push   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Merge → develop │
│ Test sur DEV    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Merge → staging │
│ Test sur STAGING│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Créer PR →      │
│ main            │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Review + Merge  │
│ PR              │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ✅ PRODUCTION   │
│ onpointdoc.app  │
└─────────────────┘
```

## 🎯 Bonnes pratiques

### Commits

- **Atomiques** : Un commit = une modification logique
- **Descriptifs** : Message clair et détaillé
- **Conventionnels** : Suivre `type(scope): description`
- **Testés** : Toujours `npm run build` avant commit

### Branches

- **Nommage clair** : `feature/`, `fix/`, `refactor/`, `docs/`
- **Courte durée de vie** : Merger rapidement dans develop
- **Supprimer après merge** : Nettoyer les branches obsolètes
- **Synchroniser régulièrement** : `git pull origin develop`

### Tests

- **Systématiques** : Tester CHAQUE environnement
- **Complets** : Fonctionnalités + régression
- **Manuels ET automatiques** : Si tests automatisés disponibles
- **Documentation** : Noter les scénarios de test effectués

### Communication

- **PRs détaillées** : Description complète des changements
- **Commits informatifs** : Contexte et raison des modifications
- **Alertes** : Prévenir l'équipe des déploiements importants
- **Documentation** : Mettre à jour la doc si nécessaire

## 📞 Support

En cas de problème avec le workflow :

1. Consulter ce document
2. Vérifier les logs Vercel
3. Consulter [GUIDE-DEPLOIEMENT-PRODUCTION.md](../GUIDE-DEPLOIEMENT-PRODUCTION.md)
4. Contacter l'équipe technique

## 📚 Ressources

- [Vercel Dashboard](https://vercel.com/dashboard)
- [GitHub Repository](https://github.com/stew-nocode/onpointdoc)
- [Convention de Commit](.github/COMMIT_CONVENTION.md)
- [Guide TypeScript](docs/TYPESCRIPT-QUICK-RULES.md)

---

**Version** : 1.0
**Dernière mise à jour** : 2025-12-19
**Responsable** : Équipe OnpointDoc

