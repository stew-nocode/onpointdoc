# 🚀 Guide Simple : Déployer en Production

## ⚠️ IMPORTANT : Workflow Obligatoire

**Ce guide respecte le workflow de déploiement obligatoire défini dans `docs/WORKFLOW-DEPLOIEMENT-PRODUCTION.md`.**

**RÈGLES STRICTES :**
- ❌ **NE JAMAIS** pousser directement sur `main`
- ❌ **NE JAMAIS** pousser directement sur `staging`
- ✅ **TOUJOURS** tester sur DEV avant STAGING
- ✅ **TOUJOURS** tester sur STAGING avant PRODUCTION
- ✅ **TOUJOURS** créer une PR pour merger dans `main`

**Workflow obligatoire :** `feature/*` → `develop` → `staging` → `main`

---

## 📍 Situation Actuelle

- **Branche actuelle :** `fix/planning-calendar-visibility`
- **Contenu :** Corrections TypeScript strict mode ✅
- **Build validé :** 0 erreurs TypeScript ✅
- **Objectif :** Déployer ces corrections en production

---

## 🎯 Étapes pour Déployer (Workflow Obligatoire)

### Étape 1 : Merger dans `develop` et tester sur DEV

#### 1.1 : Créer une PR vers `develop`
1. Allez sur : https://github.com/stew-nocode/onpointdoc/compare/develop...fix/planning-calendar-visibility
2. Créez une PR avec base `develop` (pas `main` !)
3. Merger la PR dans `develop`

#### 1.2 : Vercel déploie automatiquement sur DEV
- Vercel déploie automatiquement sur : https://onpointdoc-dev.vercel.app
- Attendre 2-3 minutes pour le déploiement

#### 1.3 : Tester sur l'environnement DEV
1. Aller sur https://onpointdoc-dev.vercel.app
2. Tester que TOUT fonctionne correctement
3. Vérifier les fonctionnalités modifiées

**❌ Si des bugs sont détectés :**
- Corriger sur votre branche
- Re-merger dans `develop`
- Re-tester

---

### Étape 2 : Merger dans `staging` et tester sur STAGING

#### 2.1 : Merger `develop` dans `staging`
```bash
git checkout staging
git pull origin staging
git merge develop --no-ff
git push origin staging
```

#### 2.2 : Vercel déploie automatiquement sur STAGING
- Vercel déploie automatiquement sur : https://onpointdoc-staging.vercel.app
- Attendre 2-3 minutes pour le déploiement

#### 2.3 : Tester sur l'environnement STAGING
1. Aller sur https://onpointdoc-staging.vercel.app
2. **Tests approfondis** : Environnement le plus proche de la production
3. Vérifier :
   - Fonctionnalités ajoutées
   - Régression sur fonctionnalités existantes
   - Performance
   - Comportement avec données réelles

**❌ Si des problèmes sont détectés :**
- Corriger sur `develop`
- Re-merger `develop` → `staging`
- Re-tester

---

### Étape 3 : Créer une PR vers `main` (PRODUCTION)

#### 3.1 : Créer une PR vers `main`
1. Allez sur : https://github.com/stew-nocode/onpointdoc/compare/main...staging
2. Créez une PR avec :
   - **Base :** `main`
   - **Compare :** `staging`
   - **Titre :** `Release: [Description courte]`
   - **Description :** Inclure la liste des changements et les tests effectués

#### 3.2 : Review et merge de la PR
1. **Review de la PR** : Demander une review si nécessaire
2. **Attendre validation** : Ne pas merger sans validation
3. **Merger la PR** : Via GitHub UI (bouton "Merge pull request")
4. **Choisir** : "Create a merge commit" (pas de squash)

#### 3.3 : Vercel déploie automatiquement sur PRODUCTION
- Vercel déploie automatiquement sur : https://onpointdoc.vercel.app
- Attendre 2-3 minutes pour le déploiement

#### 3.4 : Vérifier la production
1. Aller sur https://onpointdoc.vercel.app
2. Tester les fonctionnalités déployées
3. Surveiller les logs Vercel pour erreurs

---

## ✅ Vérifications Avant Déploiement

### 1. Build Local Réussi
```bash
npm run build
```
**Résultat attendu :** ✅ Compiled successfully, 0 erreurs TypeScript

### 2. Tests Locaux (si vous en avez)
```bash
npm run lint
npm run typecheck
```

### 3. Vérifier les Fichiers Modifiés
```bash
git status
```
Assurez-vous qu'il n'y a pas de fichiers sensibles (`.env.local`, tokens, etc.)

---

## 🔍 Après le Déploiement

### Vérifier le Déploiement Vercel

1. **Aller sur Vercel Dashboard**
   - https://vercel.com/dashboard
   - Trouvez votre projet `onpointdoc`

2. **Vérifier le Build**
   - Regardez la dernière "Deployment"
   - Statut doit être ✅ "Ready"

3. **Tester l'Application**
   - Cliquez sur le lien de déploiement
   - Testez que tout fonctionne

### Vérifier les Logs

Si quelque chose ne va pas :
1. Allez sur Vercel Dashboard
2. Cliquez sur la dernière deployment
3. Regardez les "Build Logs" pour voir les erreurs

---

## 🚨 En Cas de Problème

### Le Build Échoue sur Vercel

1. **Vérifier les logs Vercel**
   - Allez sur Vercel Dashboard → Votre projet → Build Logs

2. **Vérifier les Variables d'Environnement**
   - Vercel Dashboard → Settings → Environment Variables
   - Assurez-vous que toutes les variables nécessaires sont configurées

3. **Tester Localement**
   ```bash
   npm run build
   ```
   Si ça échoue localement, ça échouera sur Vercel

### Rollback (Retour en Arrière)

Si le déploiement cause des problèmes :

1. **Sur Vercel :**
   - Allez sur votre projet
   - Trouvez une ancienne deployment qui fonctionnait
   - Cliquez sur "..." → "Promote to Production"

2. **Sur GitHub :**
   - Revenir à un commit précédent si nécessaire

---

## 📝 Résumé des Commandes (Workflow Complet)

```bash
# 1. Vérifier que tout est OK
npm run build

# 2. Merger dans develop (via PR GitHub recommandé)
# Créer PR : develop ← fix/planning-calendar-visibility
# Merger la PR

# 3. Tester sur DEV : https://onpointdoc-dev.vercel.app
# Attendre 2-3 min, tester manuellement

# 4. Merger develop dans staging
git checkout staging
git pull origin staging
git merge develop --no-ff
git push origin staging

# 5. Tester sur STAGING : https://onpointdoc-staging.vercel.app
# Attendre 2-3 min, tests approfondis

# 6. Créer PR vers main (via GitHub)
# Base: main, Compare: staging
# Review et merge de la PR

# 7. Vercel déploie automatiquement sur PRODUCTION ! 🎉
# https://onpointdoc.vercel.app
```

---

## 🎯 Recommandation

**Suivez TOUJOURS le workflow obligatoire :**
- ✅ Créer une PR vers `develop` (pas `main`)
- ✅ Tester sur DEV avant de continuer
- ✅ Merger `develop` → `staging` et tester
- ✅ Créer une PR `staging` → `main` pour production
- ✅ Review obligatoire avant merge en production

**Pourquoi ce workflow ?**
- ✅ Détection précoce des bugs (DEV)
- ✅ Tests approfondis dans un environnement proche de la prod (STAGING)
- ✅ Sécurité et stabilité en production
- ✅ Conformité aux règles du projet

---

## ❓ Questions Fréquentes

### Q: Puis-je merger directement dans `main` ?
**R:** ❌ **NON**. C'est strictement interdit. Vous devez passer par `develop` → `staging` → `main`.

### Q: Puis-je sauter l'étape STAGING ?
**R:** ❌ **NON**. Les tests sur STAGING sont obligatoires avant la production.

### Q: Vercel va-t-il déployer automatiquement ?
**R:** Oui, Vercel déploie automatiquement sur :
- `develop` → https://onpointdoc-dev.vercel.app
- `staging` → https://onpointdoc-staging.vercel.app
- `main` → https://onpointdoc.vercel.app

### Q: Combien de temps prend le déploiement ?
**R:** Généralement 2-3 minutes pour un build Next.js sur chaque environnement.

### Q: Puis-je annuler un déploiement ?
**R:** Oui, via Vercel Dashboard → Promouvoir une ancienne version.

### Q: Que faire en cas de bug critique en production ?
**R:** Utiliser la procédure d'urgence (Hotfix) décrite dans `docs/WORKFLOW-DEPLOIEMENT-PRODUCTION.md`.

---

**Besoin d'aide ?** Dites-moi à quelle étape vous êtes bloqué ! 🚀


