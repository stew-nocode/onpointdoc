# Commandes Rapides - Vercel & Git

## 🚀 Workflow Quotidien

### Créer une nouvelle feature

```bash
# Depuis develop
git checkout develop
git pull origin develop
git checkout -b feature/nom-de-la-feature

# Développer...
# Commit et push
git add .
git commit -m "feat: description"
git push origin feature/nom-de-la-feature

# Créer PR vers develop (via GitHub UI ou CLI)
```

### Tester en local

```bash
# Build local
npm run build

# Dev server
npm run dev

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

### Merger dans develop (après PR)

```bash
git checkout develop
git pull origin develop
# → Deploy auto sur onpointdoc-dev.vercel.app
```

### Préparer release pour staging

```bash
git checkout staging
git pull origin staging
git merge develop
git push origin staging
# → Deploy auto sur onpointdoc-staging.vercel.app
```

### Déployer en production

```bash
# Créer PR: staging → main sur GitHub
# Après review et merge:
# → Deploy auto sur onpointdoc.vercel.app
```

---

## 🔧 Commandes Vercel

### Lister les déploiements

```bash
# Tous
vercel ls

# Production uniquement
vercel ls --prod

# 20 derniers
vercel ls | head -20
```

### Inspecter un déploiement

```bash
vercel inspect [URL]

# Avec logs
vercel logs [URL]

# Logs en temps réel
vercel logs [URL] --follow
```

### Déployer manuellement

```bash
# Preview (branch actuelle)
vercel

# Production (force)
vercel --prod

# Avec confirmation automatique
vercel --prod --yes
```

### Variables d'environnement

```bash
# Lister
vercel env ls

# Télécharger localement
vercel env pull .env.local

# Ajouter
vercel env add [NOM_VARIABLE] [environnement]

# Supprimer
vercel env rm [NOM_VARIABLE] [environnement]
```

### Rollback

```bash
# Via CLI
vercel promote [old-deployment-url]

# Via Dashboard
# https://vercel.com → Deployments → ⋯ → Promote
```

---

## 🐛 Hotfix Urgent

```bash
# 1. Depuis main
git checkout main
git pull origin main
git checkout -b hotfix/description-bug

# 2. Fix
# ... code ...
git add .
git commit -m "fix: bug critique"

# 3. Push
git push origin hotfix/description-bug

# 4. PR hotfix → main (urgent!)
# 5. Après merge, backport dans develop:
git checkout develop
git merge hotfix/description-bug
git push origin develop
```

---

## 📊 Monitoring

### Voir le statut build

```bash
# Via Vercel
vercel ls | head -5

# Via Git
git log --oneline -5
```

### Vérifier les erreurs

```bash
# Logs du dernier déploiement
vercel logs [URL] | grep -i error

# Logs en temps réel
vercel logs [URL] --follow
```

---

## ⚡ Raccourcis

### Commandes Git courantes

```bash
# Status
git status -sb

# Diff
git diff --stat

# Log compact
git log --oneline --graph -10

# Branches
git branch -a

# Nettoyer branches locales
git branch --merged | grep -v "\*" | xargs -n 1 git branch -d
```

### Aliases recommandés

Ajouter dans `~/.gitconfig` ou `~/.zshrc`:

```bash
# Git aliases
alias gs='git status -sb'
alias gp='git pull origin $(git branch --show-current)'
alias gps='git push origin $(git branch --show-current)'
alias gl='git log --oneline --graph -10'
alias gb='git branch -a'

# Vercel aliases
alias vl='vercel ls | head -10'
alias vp='vercel --prod --yes'
alias vi='vercel inspect'
alias vlogs='vercel logs'
```

---

## 🎯 Checklist Avant Merge Production

```bash
# 1. Build local
npm run build
# ✅ Success?

# 2. Type check
npx tsc --noEmit
# ✅ No errors?

# 3. Lint
npm run lint
# ✅ No warnings?

# 4. Tests (si configurés)
npm test
# ✅ All pass?

# 5. Testé sur staging
# ✅ User acceptance OK?

# 6. Documentation
# ✅ Updated?

# 7. Changelog
# ✅ Updated?
```

---

## 📚 Liens Utiles

- **Vercel Dashboard** : https://vercel.com/kouassis-projects-e812985e/onpointdoc
- **GitHub Repo** : https://github.com/stew-nocode/onpointdoc
- **Production** : https://onpointdoc.vercel.app
- **Staging** : https://onpointdoc-staging.vercel.app
- **Dev** : https://onpointdoc-dev.vercel.app

---

## 🆘 En Cas de Problème

### Build échoue

```bash
# 1. Vérifier les logs
vercel logs [URL]

# 2. Reproduire localement
npm run build

# 3. Type check
npx tsc --noEmit
```

### Variables d'env manquantes

```bash
# Télécharger depuis Vercel
vercel env pull .env.local

# Vérifier
cat .env.local

# Ajouter si manquante
vercel env add [NOM] production
```

### Rollback urgent

```bash
# Option 1: Promote ancien deploy
vercel ls --prod
vercel promote [old-url]

# Option 2: Revert git
git revert HEAD
git push origin main
```
