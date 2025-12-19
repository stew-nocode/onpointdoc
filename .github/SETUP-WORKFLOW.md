# Guide de Configuration Complète du Workflow Git/GitHub

Ce document décrit toutes les étapes pour configurer le workflow Git/GitHub/Vercel optimisé.

## 📋 Checklist de Configuration

### ✅ Phase 1 : GitHub (À faire maintenant)

- [ ] **Protection des branches**
  - [ ] Protéger `main` (PR obligatoire, 1 review, status checks)
  - [ ] Protéger `staging` (optionnel, status checks)
  - [ ] Voir : [.github/workflows/branch-protection-setup.md](.github/workflows/branch-protection-setup.md)

- [ ] **GitHub Actions**
  - [ ] Vérifier que le workflow CI se déclenche sur les PRs
  - [ ] Aller sur : https://github.com/stew-nocode/onpointdoc/actions
  - [ ] Tester avec une PR de test

- [ ] **Templates PR**
  - [ ] Le template PR est automatiquement utilisé lors de la création d'une PR
  - [ ] Vérifier : Créer une PR test → Le template doit apparaître

### ✅ Phase 2 : Vercel Dashboard (À faire maintenant)

- [ ] **Domaines personnalisés**
  - [ ] Assigner `onpointdoc-staging.vercel.app` → branch `staging`
  - [ ] Assigner `onpointdoc-dev.vercel.app` → branch `develop`
  - [ ] Voir : [docs/VERCEL-CONFIGURATION-STATUS.md](../docs/VERCEL-CONFIGURATION-STATUS.md)

- [ ] **Variables d'environnement**
  - [ ] Configurer pour Production, Preview, Development
  - [ ] Supabase, N8N, JIRA, Brevo

### ✅ Phase 3 : Git Local (Optionnel mais recommandé)

- [ ] **Git hooks (optionnel)**
  - [ ] Installer Husky : `npm install --save-dev husky`
  - [ ] Configurer pre-commit hook : `npx husky add .husky/pre-commit "npm run precommit"`
  - [ ] Configurer commit-msg hook pour validation conventional commits (avec commitlint)

- [ ] **Scripts npm**
  - [ ] Les nouveaux scripts sont disponibles :
    - `npm run validate` : Vérifie TypeScript, lint et build
    - `npm run branch:develop` : Switch vers develop et pull
    - `npm run branch:staging` : Switch vers staging et pull
    - `npm run branch:main` : Switch vers main et pull

## 🚀 Utilisation du Workflow

### Workflow Quotidien

#### 1. Développer une Feature

```bash
# Aller sur develop
npm run branch:develop

# Créer feature branch
git checkout -b feature/ma-feature

# Développer + commits (avec conventional commits)
git add .
git commit -m "feat(tickets): ajout filtre par statut"

# Push → Preview auto Vercel
git push origin feature/ma-feature

# Créer PR sur GitHub (template PR s'affiche automatiquement)
# → URL : https://github.com/stew-nocode/onpointdoc/compare/develop...feature/ma-feature

# Vérifier que GitHub Actions passent
# → URL : https://github.com/stew-nocode/onpointdoc/actions

# Après review, merger PR
# → Deploy auto sur onpointdoc-dev.vercel.app
```

#### 2. Préparer une Release

```bash
# Merger develop → staging
npm run branch:staging
git merge develop
git push origin staging

# Tester sur onpointdoc-staging.vercel.app (UAT)

# Si OK, créer PR staging → main
# → URL : https://github.com/stew-nocode/onpointdoc/compare/main...staging

# Review + Approbation (obligatoire pour main)
# Merge → Deploy production automatique
```

#### 3. Hotfix Urgent

```bash
# Partir de main
npm run branch:main
git checkout -b hotfix/bug-critique

# Fix rapide
git add .
git commit -m "fix(api): correction bug critique authentification"
git push origin hotfix/bug-critique

# Créer PR vers main (priorité haute)
# Review express + Merge
# → Deploy production immédiat

# Backport dans develop
npm run branch:develop
git merge hotfix/bug-critique
git push origin develop
```

## 🔍 Vérification du Setup

### Test 1 : Protection des Branches

```bash
# Créer branche test
git checkout -b test/protection
echo "test" > test.txt
git add test.txt
git commit -m "test: vérification protection"
git push origin test/protection
```

**Sur GitHub** :
1. Créer PR `test/protection` → `main`
2. Vérifier :
   - ✅ PR affiche "Merge blocked" sans review
   - ✅ Status checks s'affichent
   - ✅ Impossible de merger

### Test 2 : GitHub Actions

1. Créer une PR quelconque
2. Aller sur l'onglet **"Checks"** de la PR
3. Vérifier que les jobs s'exécutent :
   - ✅ `typecheck` (TypeScript check)
   - ✅ `lint` (ESLint)
   - ✅ `build` (Build Next.js)

### Test 3 : Template PR

1. Créer une PR
2. Vérifier que le template `.github/PULL_REQUEST_TEMPLATE.md` apparaît automatiquement

### Test 4 : Vercel Previews

1. Créer une feature branch
2. Push → Vérifier qu'un preview deployment est créé
3. URL preview apparaît dans la PR GitHub (intégration Vercel)

## 📊 Résumé des Protections

| Branche | Protection | PR Requis | Reviews | Status Checks | Force Push |
|---------|-----------|-----------|---------|---------------|------------|
| `main` | ✅ Complète | ✅ Oui | 1 min | ✅ Oui | ❌ Non |
| `staging` | ⚠️ Partielle | ⚠️ Optionnel | 0 | ✅ Oui | ⚠️ Optionnel |
| `develop` | ❌ Aucune | ❌ Non | - | ✅ Oui (CI) | ✅ Oui |

## 🚨 Dépannage

### GitHub Actions ne se déclenchent pas

1. Vérifier le fichier `.github/workflows/ci.yml` existe
2. Vérifier la syntaxe YAML (utiliser [YAML Lint](https://www.yamllint.com/))
3. Vérifier les permissions du repository (Settings → Actions → General)

### Status checks ne s'affichent pas

1. Vérifier que les workflows GitHub Actions sont activés
2. Vérifier que Vercel est connecté au repository
3. Attendre quelques minutes (première exécution peut être lente)

### Impossible de merger sur main

1. Vérifier que tous les status checks sont ✅ verts
2. Vérifier qu'au moins 1 review est approuvée
3. Vérifier qu'aucune conversation n'est "unresolved"

## 📚 Documentation Complète

- [Branch Strategy](.github/BRANCH-STRATEGY.md) - Stratégie des branches
- [Commit Convention](.github/COMMIT_CONVENTION.md) - Convention de commits
- [Branch Protection Setup](.github/workflows/branch-protection-setup.md) - Configuration protections
- [Workflow Vercel](.cursor/rules/deployment-workflow-vercel.mdc) - Workflow déploiement
- [Vercel Configuration](docs/VERCEL-CONFIGURATION-STATUS.md) - Configuration Vercel

---

**Statut** : ✅ Configuration automatique terminée - Configuration manuelle GitHub/Vercel requise
**Dernière mise à jour** : 2025-12-19

