# Configuration des Protections de Branches GitHub

Ce document explique comment configurer les protections de branches sur GitHub pour favoriser le workflow de déploiement.

## 🎯 Objectif

Protéger les branches critiques (`main`, `staging`) pour garantir la qualité du code et éviter les erreurs en production.

## 📍 URL de Configuration

Aller sur : https://github.com/stew-nocode/onpointdoc/settings/branches

## 🔒 Protection de la branche `main` (Production)

### Étapes

1. Cliquer sur **"Add branch protection rule"**
2. **Branch name pattern** : `main`
3. Activer les options suivantes :

#### ✅ Require a pull request before merging

- **Required approvals** : `1` (minimum 1 review)
- **Dismiss stale pull request approvals when new commits are pushed** : ✅ Activé
- **Require review from Code Owners** : ⚠️ Optionnel (si CODEOWNERS existe)

#### ✅ Require status checks to pass before merging

Rechercher et cocher tous les checks Vercel :
- `Vercel` (build production)
- `ci / typecheck` (TypeScript check)
- `ci / lint` (ESLint)
- `ci / build` (Build Next.js)

**Optionnel** : Cocher "Require branches to be up to date before merging"

#### ✅ Require conversation resolution before merging

- ✅ Activé

#### ❌ Ne PAS activer

- ❌ Allow force pushes (DOIT rester désactivé)
- ❌ Allow deletions (DOIT rester désactivé)

#### ⚠️ Options additionnelles

- **Require linear history** : ⚠️ Optionnel (empêche les merge commits, force rebase)
- **Restrict who can push to matching branches** : ⚠️ Optionnel (limiter aux admins)

4. Cliquer sur **"Create"**

---

## ⚠️ Protection de la branche `staging` (Optionnel)

### Étapes

1. Cliquer sur **"Add branch protection rule"**
2. **Branch name pattern** : `staging`
3. Activer les options suivantes :

#### ✅ Require status checks to pass before merging

Cocher les mêmes checks que pour `main` :
- `Vercel` (build staging)
- `ci / typecheck`
- `ci / lint`
- `ci / build`

#### ⚠️ Require a pull request before merging

- **Required approvals** : `0` (pas obligatoire mais recommandé)
- **Optionnel** : Dismiss stale approvals activé

#### ❌ Ne PAS activer

- ❌ Allow force pushes (peut être activé pour staging si besoin)
- ❌ Allow deletions

4. Cliquer sur **"Create"**

---

## 🔍 Vérification

### Vérifier que la protection fonctionne

1. Créer une branche de test :
   ```bash
   git checkout -b test/branch-protection
   ```

2. Faire un commit :
   ```bash
   echo "test" > test.txt
   git add test.txt
   git commit -m "test: branch protection"
   git push origin test/branch-protection
   ```

3. Créer une PR vers `main` :
   - Aller sur GitHub → Pull Requests → New Pull Request
   - Base: `main` ← Compare: `test/branch-protection`
   - Créer la PR

4. Vérifier :
   - ✅ PR affiche "Merge blocked" sans review
   - ✅ Status checks s'affichent
   - ✅ Impossible de merger sans review
   - ✅ Impossible de force push sur `main`

---

## 📊 Résumé des Protections

| Branche | PR Requis | Approbations | Status Checks | Force Push | Suppression |
|---------|-----------|--------------|---------------|------------|-------------|
| `main` | ✅ Oui | 1 minimum | ✅ Oui | ❌ Non | ❌ Non |
| `staging` | ⚠️ Optionnel | 0 | ✅ Oui | ⚠️ Optionnel | ❌ Non |
| `develop` | ❌ Non | - | ✅ Oui (via CI) | ✅ Oui | ✅ Oui |

---

## 🚨 En cas de problème

### Si un status check échoue

1. Vérifier les logs dans **Actions** (tab GitHub)
2. Corriger les erreurs localement
3. Push → Les checks se relancent automatiquement

### Si besoin de bypasser temporairement

⚠️ **ATTENTION** : À utiliser uniquement en cas d'urgence absolue

1. Aller dans **Settings → Branches**
2. Modifier temporairement la règle (enlever les protections)
3. Faire le merge
4. **Remettre immédiatement** les protections

---

## 📚 Références

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
- [Workflow Vercel](.cursor/rules/deployment-workflow-vercel.mdc)
- [Branch Strategy](.github/BRANCH-STRATEGY.md)

