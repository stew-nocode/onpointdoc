# Instructions pour créer la Pull Request

## ⚠️ IMPORTANT : Workflow Obligatoire

**Ce guide respecte le workflow de déploiement obligatoire.**

**RÈGLES STRICTES :**
- ❌ **NE JAMAIS** créer une PR directement vers `main`
- ✅ **TOUJOURS** créer une PR vers `develop` en premier
- ✅ **TOUJOURS** tester sur DEV avant STAGING
- ✅ **TOUJOURS** tester sur STAGING avant PRODUCTION

**Workflow obligatoire :** `feature/*` → `develop` → `staging` → `main`

---

## Étape 1 : PR vers `develop` (OBLIGATOIRE)

### Option 1 : Via l'interface GitHub (Recommandé)

1. **Ouvrez cette URL dans votre navigateur :**
   ```
   https://github.com/stew-nocode/onpointdoc/compare/develop...fix/planning-calendar-visibility
   ```

2. **Remplissez les informations :**
   - **Base :** `develop` ⚠️ (pas `main` !)
   - **Compare :** `fix/planning-calendar-visibility`
   - **Titre :** `🔧 Fix: TypeScript Strict Mode`
   - **Description :** Description des changements

3. **Cliquez sur "Create pull request"**

4. **Merger la PR dans `develop`**

5. **Tester sur DEV :** https://onpointdoc-dev.vercel.app

### Option 2 : Via GitHub CLI

```bash
gh pr create \
  --title "🔧 Fix: TypeScript Strict Mode" \
  --body "Description des changements" \
  --base develop \
  --head fix/planning-calendar-visibility
```

---

## Étape 2 : Merger `develop` → `staging` et tester

```bash
git checkout staging
git pull origin staging
git merge develop --no-ff
git push origin staging
```

**Tester sur STAGING :** https://onpointdoc-staging.vercel.app

---

## Étape 3 : PR vers `main` (PRODUCTION)

### Option 1 : Via l'interface GitHub

1. **Ouvrez cette URL dans votre navigateur :**
   ```
   https://github.com/stew-nocode/onpointdoc/compare/main...staging
   ```

2. **Remplissez les informations :**
   - **Base :** `main`
   - **Compare :** `staging`
   - **Titre :** `Release: [Description courte]`
   - **Description :** 
     ```
     ## Changements
     - Liste des changements principaux
     - Fonctionnalités ajoutées
     - Bugs corrigés
     
     ## Tests effectués
     - [x] Tests sur DEV
     - [x] Tests sur STAGING
     - [x] Build TypeScript : 0 erreurs
     - [x] Pas de régression
     ```

3. **Cliquez sur "Create pull request"**

4. **Review et merge de la PR** (review obligatoire)

### Option 2 : Via GitHub CLI

```bash
gh pr create \
  --title "Release: [Description courte]" \
  --body "## Changements
  - Liste des changements
  ## Tests effectués
  - [x] Tests sur DEV
  - [x] Tests sur STAGING" \
  --base main \
  --head staging
```

---

## Informations des PRs

### PR 1 : Vers `develop`
- **Repository :** stew-nocode/onpointdoc
- **Branche source :** fix/planning-calendar-visibility
- **Branche cible :** `develop` ⚠️
- **Titre :** 🔧 Fix: TypeScript Strict Mode

### PR 2 : Vers `main` (après tests)
- **Repository :** stew-nocode/onpointdoc
- **Branche source :** `staging`
- **Branche cible :** `main`
- **Titre :** Release: [Description courte]

## Statut actuel

✅ Branche poussée sur GitHub
✅ Fichier PR-DESCRIPTION.md ajouté et commité
✅ Build production validé (0 erreurs TypeScript)
✅ 52 pages générées avec succès


