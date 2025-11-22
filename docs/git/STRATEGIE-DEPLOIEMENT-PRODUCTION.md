# 🚀 Stratégie de Déploiement en Production

## 🎯 Branche `main` = Version Production

### ✅ **Oui, `main` est votre branche de production**

**Principe fondamental** :
- ✅ `main` = Code stable et testé = Déployé en production
- ✅ Branches de fonctionnalités = Travail en cours = Non déployé
- ✅ Quand vous fusionnez dans `main` → Déploiement automatique en production (si configuré)

## 📊 Architecture de Déploiement

### 🏗️ Flux Normal

```
refactor/clean-code (votre branche de travail)
  │
  └─> Tests et vérifications
      │
      └─> Fusion dans main
          │
          └─> Déploiement automatique en production 🚀
```

### 🎯 Ce qui se passe quand vous fusionnez dans `main`

#### **Avec Vercel (recommandé pour Next.js)**

Vercel détecte automatiquement les changements sur `main` :

1. ✅ Vous fusionnez `refactor/clean-code` dans `main`
2. ✅ Vous poussez sur GitHub : `git push origin main`
3. ✅ Vercel détecte le push sur `main`
4. ✅ Vercel build automatiquement le projet
5. ✅ Vercel déploie en production si le build réussit
6. ✅ Vos utilisateurs voient la nouvelle version

#### **Sans configuration automatique**

Si Vercel n'est pas configuré :
- Vous devez déployer manuellement après chaque fusion dans `main`
- Ou configurer Vercel pour se connecter à votre GitHub

## 🔒 Protection de la Branche `main`

### ⚠️ **Règle d'Or : NE JAMAIS travailler directement sur `main`**

**Pourquoi ?** :
- ❌ Risque de casser la production
- ❌ Pas de possibilité de tester avant déploiement
- ❌ Pas de retour en arrière facile

**La bonne pratique** :
- ✅ Toujours travailler sur des branches séparées
- ✅ Tester avant de fusionner
- ✅ Fusionner seulement quand c'est stable

### 📋 Checklist Avant de Fusionner dans `main`

#### **1. Vérifications Techniques**

```bash
# Vérifier que le build fonctionne
npm run build

# Vérifier qu'il n'y a pas d'erreurs TypeScript
npm run typecheck

# Vérifier qu'il n'y a pas d'erreurs de lint
npm run lint
```

#### **2. Tests Manuels**

- ✅ Tester les fonctionnalités modifiées
- ✅ Vérifier que rien n'est cassé
- ✅ Vérifier sur différents navigateurs (si possible)

#### **3. Validation du Code**

- ✅ Code respecte Clean Code
- ✅ Types explicites partout
- ✅ Gestion d'erreur appropriée
- ✅ Documentation à jour

## 🎯 Workflow Recommandé pour Production

### **Étape par étape**

```bash
# 1. Vous êtes sur votre branche de travail
git checkout refactor/clean-code

# 2. Vérifier que tout est sauvegardé
git status
git add .
git commit -m "refactor: Clean Code - Finalisation"
git push

# 3. Vérifier que le build fonctionne
npm run build
npm run typecheck

# 4. Si OK, aller sur main
git checkout main

# 5. Mettre à jour main
git pull origin main

# 6. Fusionner votre branche
git merge refactor/clean-code

# 7. Vérifier que le build fonctionne sur main
npm run build

# 8. Si OK, pousser sur GitHub
git push origin main

# 9. Vercel déploie automatiquement (si configuré) 🚀
```

### **En cas de problème après déploiement**

Si quelque chose ne va pas en production :

```bash
# Revenir en arrière (rollback)
git checkout main
git revert HEAD  # Annule le dernier commit
git push origin main

# Ou revenir à un commit spécifique
git checkout main
git reset --hard <commit-hash>
git push --force origin main  # ⚠️ Attention : force push
```

## 🔧 Configuration Vercel (Recommandé)

### **Comment configurer Vercel pour déploiement automatique**

1. **Créer un compte Vercel** : https://vercel.com

2. **Connecter votre projet GitHub** :
   - Aller sur Vercel Dashboard
   - Cliquer sur "New Project"
   - Sélectionner votre repository GitHub `stew-nocode/onpointdoc`

3. **Configurer le déploiement** :
   - **Framework Preset** : Next.js
   - **Root Directory** : `./` (racine du projet)
   - **Branch** : `main` (production)
   - **Build Command** : `npm run build`
   - **Output Directory** : `.next`

4. **Variables d'environnement** :
   - Ajouter toutes les variables nécessaires dans Vercel
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `JIRA_URL`, `JIRA_TOKEN`, etc.

5. **Déployer** :
   - Vercel déploiera automatiquement sur chaque push dans `main`
   - Vous recevrez une URL : `https://onpointdoc.vercel.app`

### **Branches de prévisualisation**

Vercel peut aussi créer des prévisualisations pour chaque branche :
- ✅ `refactor/clean-code` → `https://onpointdoc-git-refactor-clean-code.vercel.app`
- ✅ Permet de tester avant de fusionner dans `main`

## 🎯 Bonnes Pratiques pour Production

### **1. Ne jamais commit directement sur `main`**

```bash
# ❌ MAUVAIS
git checkout main
# ... modifier des fichiers ...
git commit -m "fix: correction"
git push

# ✅ BON
git checkout -b fix/bug-critique
# ... modifier des fichiers ...
git commit -m "fix: correction"
git push
git checkout main
git merge fix/bug-critique
git push
```

### **2. Toujours tester avant de fusionner**

```bash
# Tester sur votre branche
git checkout refactor/clean-code
npm run build
npm run typecheck

# Si OK, fusionner
git checkout main
git merge refactor/clean-code
```

### **3. Messages de commit clairs**

```bash
# ✅ BON
git commit -m "refactor: Clean Code - Refactoring analysis-formatter et use-text-reveal"
git commit -m "feat: Ajout de l'analyse IA via N8N"
git commit -m "fix: Correction bug sérialisation tickets"

# ❌ MAUVAIS
git commit -m "modifications"
git commit -m "fix"
git commit -m "update"
```

### **4. Utiliser des branches de fonctionnalités**

```bash
# Pour une nouvelle fonctionnalité
git checkout -b feat/nouvelle-fonctionnalite

# Pour un refactoring
git checkout -b refactor/clean-code

# Pour une correction de bug
git checkout -b fix/bug-critique
```

## 📊 Résumé en 5 Points

1. **`main` = Production** : Tout ce qui est dans `main` est déployé en production
2. **Ne jamais travailler directement sur `main`** : Toujours utiliser des branches
3. **Tester avant de fusionner** : Vérifier que le build fonctionne
4. **Messages de commit clairs** : Expliquer ce qui a changé
5. **Vercel déploie automatiquement** : Si configuré, chaque push dans `main` = déploiement

## 🆘 En cas de problème

### **Si la production est cassée** :

1. **Ne pas paniquer** ⚠️
2. **Revenir en arrière** :
   ```bash
   git checkout main
   git revert HEAD
   git push origin main
   ```
3. **Vercel redéploiera automatiquement** avec la version précédente

### **Si le build échoue** :

1. **Vérifier localement** :
   ```bash
   npm run build
   ```
2. **Corriger les erreurs**
3. **Recommencer le processus**

---

**Date de création** : 2025-01-21
**Dernière mise à jour** : 2025-01-21

