# Stratégie de Branches - OnpointDoc

## 🌳 Structure des Branches

### Branches Principales

#### 1. `main` (Production)
- **Environnement** : Production
- **URL** : https://onpointdoc.vercel.app
- **Protection** : Protégée, nécessite PR + review
- **Deploy** : Automatique sur merge
- **Règle** : Contient uniquement du code testé et validé

#### 2. `staging` (Pré-production)
- **Environnement** : Staging/UAT
- **URL** : https://onpointdoc-staging.vercel.app
- **Protection** : Semi-protégée
- **Deploy** : Automatique sur push
- **Règle** : Tests d'acceptation utilisateur (UAT)

#### 3. `develop` (Développement)
- **Environnement** : Développement
- **URL** : https://onpointdoc-dev.vercel.app
- **Protection** : Non protégée
- **Deploy** : Automatique sur push
- **Règle** : Intégration continue des features

### Branches Temporaires

#### Feature Branches (`feature/*`)
```
feature/add-user-management
feature/fix-dashboard-bug
feature/improve-performance
```
- **Base** : `develop`
- **Merge vers** : `develop` via PR
- **Deploy** : Preview automatique (URL unique)
- **Durée** : Supprimée après merge

#### Hotfix Branches (`hotfix/*`)
```
hotfix/critical-security-fix
hotfix/production-bug
```
- **Base** : `main`
- **Merge vers** : `main` ET `develop`
- **Deploy** : Preview puis production
- **Urgence** : Priorité absolue

## 🔄 Workflow Git Flow

### Développement Feature Normale

```bash
# 1. Créer feature depuis develop
git checkout develop
git pull origin develop
git checkout -b feature/my-new-feature

# 2. Développer et committer
git add .
git commit -m "feat: add new feature"

# 3. Push et créer PR vers develop
git push origin feature/my-new-feature
# Créer PR: feature/my-new-feature → develop

# 4. Review, merge, puis delete branch
```

### Release vers Staging

```bash
# 1. Merger develop dans staging
git checkout staging
git pull origin staging
git merge develop
git push origin staging

# 2. Tester sur https://onpointdoc-staging.vercel.app
```

### Release vers Production

```bash
# 1. Créer PR: staging → main
# 2. Review complète
# 3. Merge via GitHub
# 4. Deploy automatique en production
```

### Hotfix Urgent

```bash
# 1. Créer hotfix depuis main
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug

# 2. Fix et commit
git add .
git commit -m "fix: critical production bug"

# 3. Push
git push origin hotfix/critical-bug

# 4. Créer 2 PRs:
#    - hotfix/critical-bug → main (prioritaire)
#    - hotfix/critical-bug → develop (backport)

# 5. Merge main puis develop
```

## 🛡️ Protection des Branches

### main (Production)
- ✅ Require pull request reviews (minimum 1)
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Require conversation resolution
- ❌ Allow force pushes (JAMAIS)
- ❌ Allow deletions

### staging (Pré-production)
- ✅ Require pull request reviews (optionnel)
- ✅ Require status checks to pass
- ❌ Allow force pushes (avec précaution)

### develop (Développement)
- ✅ Require status checks to pass
- ✅ Allow force pushes (avec précaution)

## 📊 Tableau de Décision

| Action | Branch Source | Branch Cible | Review Requise | Tests Requis |
|--------|---------------|--------------|----------------|--------------|
| Nouvelle feature | `develop` | `feature/*` | Non | Oui |
| Intégrer feature | `feature/*` | `develop` | Optionnel | Oui |
| Préparer release | `develop` | `staging` | Non | Oui |
| Déployer production | `staging` | `main` | **OUI** | **OUI** |
| Hotfix urgent | `main` | `hotfix/*` | Non | Oui |
| Merger hotfix | `hotfix/*` | `main` + `develop` | **OUI** | **OUI** |

## 🎯 Conventions de Nommage

### Commits (Conventional Commits)
```
feat: nouvelle fonctionnalité
fix: correction de bug
docs: documentation
style: formatage
refactor: refactoring
test: tests
chore: maintenance
perf: performance
```

### Branches
```
feature/description-courte
fix/nom-du-bug
hotfix/urgence-description
release/v1.2.3
```

### Pull Requests
```
feat: Add user management system
fix: Fix dashboard rendering issue
hotfix: Critical security vulnerability patch
```

## 📝 Checklist Avant Merge Production

- [ ] Tous les tests passent (unit + integration)
- [ ] Build TypeScript sans erreurs
- [ ] Code review approuvée (minimum 1 reviewer)
- [ ] Testé sur staging avec succès
- [ ] Documentation mise à jour si nécessaire
- [ ] Pas de console.log ou debug code
- [ ] Variables d'environnement vérifiées
- [ ] Performance acceptable (Lighthouse > 80)
- [ ] Accessible (WCAG AA minimum)
- [ ] Changelog mis à jour

## 🚨 Procédure d'Urgence

### Rollback Production
```bash
# Option 1: Via Vercel CLI
vercel rollback [deployment-url]

# Option 2: Via Git
git checkout main
git revert HEAD
git push origin main
```

### Désactiver Feature Toggle
```bash
# Si feature flags activés
vercel env pull .env.production
# Modifier la variable
vercel env add FEATURE_X_ENABLED false production
```

## 📚 Ressources

- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Vercel Git Integration](https://vercel.com/docs/concepts/git)
