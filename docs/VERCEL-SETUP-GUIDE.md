# Guide de Configuration Vercel Pro - OnpointDoc

## 🎯 Objectif

Configurer un workflow de déploiement professionnel avec Vercel :
- **Production** : Version stable validée
- **Staging** : Tests d'acceptation utilisateur (UAT)
- **Development** : Intégration continue
- **Preview** : Tests de features isolées

---

## 📋 Étape 1 : Créer les Branches

### 1.1 Créer la branche `develop`

```bash
# Depuis main
git checkout main
git pull origin main
git checkout -b develop
git push origin develop
```

### 1.2 Créer la branche `staging`

```bash
# Depuis develop
git checkout develop
git checkout -b staging
git push origin staging
```

### 1.3 Vérifier les branches

```bash
git branch -a
```

Vous devriez voir :
```
* main
  develop
  staging
  remotes/origin/main
  remotes/origin/develop
  remotes/origin/staging
```

---

## 🔧 Étape 2 : Configuration Vercel Dashboard

### 2.1 Accéder aux Settings

1. Aller sur https://vercel.com
2. Sélectionner le projet `onpointdoc`
3. Cliquer sur **Settings**

### 2.2 Configurer Git Integration

#### **Settings → Git**

**Production Branch :**
```
main
```

**Environment-Specific Branches :**
```
staging → Preview (staging environment)
develop → Preview (development environment)
```

**Preview Deployments :**
- ✅ Enable Automatic Preview Deployments
- ✅ Enable Comments on Pull Requests
- ✅ Enable Deployment Protection (optionnel)

### 2.3 Configurer les Domaines

#### **Settings → Domains**

**Production (main) :**
```
onpointdoc.vercel.app (primary)
```

**Staging :**
```
onpointdoc-staging.vercel.app
```
- Aller dans "Edit" du domaine staging
- Assigner à la branch `staging`

**Development :**
```
onpointdoc-dev.vercel.app
```
- Ajouter un nouveau domaine
- Assigner à la branch `develop`

### 2.4 Variables d'Environnement

#### **Settings → Environment Variables**

**Stratégie recommandée :**

| Variable | Production | Preview | Development |
|----------|-----------|---------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | prod DB | staging DB | dev DB |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | prod key | staging key | dev key |
| `SUPABASE_SERVICE_ROLE_KEY` | prod key | staging key | dev key |
| `NODE_ENV` | production | production | development |
| `NEXT_PUBLIC_APP_URL` | prod URL | staging URL | dev URL |

**Procédure :**

1. Cliquer sur **Add New**
2. Nom de la variable : `NEXT_PUBLIC_SUPABASE_URL`
3. Value (Production) : Votre URL Supabase production
4. Cocher les environnements :
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. Pour Preview et Development, cliquer "Edit" pour définir des valeurs différentes

**Exemple de configuration :**

```env
# Production
NEXT_PUBLIC_SUPABASE_URL=https://prod.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...prod

# Staging (Preview)
NEXT_PUBLIC_SUPABASE_URL=https://staging.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...staging

# Development (Preview)
NEXT_PUBLIC_SUPABASE_URL=https://dev.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...dev
```

---

## 🚀 Étape 3 : Tester le Workflow

### 3.1 Test Feature Branch (Preview)

```bash
# Créer une feature
git checkout develop
git pull origin develop
git checkout -b feature/test-deployment

# Faire un changement
echo "Test deployment" > test.txt
git add test.txt
git commit -m "test: deployment workflow"
git push origin feature/test-deployment
```

**Résultat attendu :**
- Vercel crée automatiquement un **Preview Deployment**
- URL unique générée : `onpointdoc-abc123.vercel.app`
- Commentaire automatique sur la PR avec le lien

### 3.2 Test Development

```bash
# Merger dans develop
git checkout develop
git merge feature/test-deployment
git push origin develop
```

**Résultat attendu :**
- Déploiement automatique sur `onpointdoc-dev.vercel.app`
- Build avec variables d'environnement Development

### 3.3 Test Staging

```bash
# Merger dans staging
git checkout staging
git merge develop
git push origin staging
```

**Résultat attendu :**
- Déploiement automatique sur `onpointdoc-staging.vercel.app`
- Build avec variables d'environnement Preview (Staging)

### 3.4 Test Production

```bash
# Créer PR: staging → main
# Via GitHub UI ou CLI:
gh pr create --base main --head staging --title "Release: vX.X.X"

# Après review et merge
# → Déploiement automatique sur onpointdoc.vercel.app
```

---

## 🔒 Étape 4 : Protection des Branches (GitHub)

### 4.1 Protéger `main`

1. GitHub → Repository → **Settings** → **Branches**
2. Cliquer **Add branch protection rule**
3. Branch name pattern : `main`
4. Activer :
   - ✅ Require a pull request before merging
     - Required approvals : **1**
   - ✅ Require status checks to pass before merging
     - Search for checks : `Vercel – onpointdoc`
   - ✅ Require conversation resolution before merging
   - ✅ Do not allow bypassing the above settings
   - ❌ Allow force pushes
   - ❌ Allow deletions
5. **Create**

### 4.2 Protéger `staging` (optionnel)

Même procédure mais avec :
- Required approvals : **0** (optionnel)
- Allow force pushes : ❌

### 4.3 Protéger `develop` (optionnel léger)

- ✅ Require status checks to pass before merging
- Pas de required approvals

---

## 📊 Étape 5 : Workflow Quotidien

### Développer une Feature

```bash
# 1. Créer feature depuis develop
git checkout develop
git pull origin develop
git checkout -b feature/ma-nouvelle-feature

# 2. Développer
# ... code ...

# 3. Commit
git add .
git commit -m "feat: add nouvelle feature"

# 4. Push et créer PR
git push origin feature/ma-nouvelle-feature

# 5. Vercel crée automatiquement un Preview
# → Tester sur l'URL preview générée

# 6. Créer PR vers develop sur GitHub
gh pr create --base develop --head feature/ma-nouvelle-feature

# 7. Merger dans develop
# → Deploy automatique sur onpointdoc-dev.vercel.app
```

### Préparer une Release

```bash
# 1. Merger develop dans staging
git checkout staging
git pull origin staging
git merge develop
git push origin staging

# 2. Vercel deploy automatiquement sur staging
# → Tester sur onpointdoc-staging.vercel.app

# 3. Tests d'acceptation utilisateur (UAT)
# → Valider les features avec l'équipe

# 4. Si OK, créer PR staging → main
gh pr create --base main --head staging --title "Release: v1.2.0"

# 5. Review et merge
# → Deploy automatique en production !
```

### Hotfix Urgent

```bash
# 1. Créer hotfix depuis main
git checkout main
git pull origin main
git checkout -b hotfix/bug-critique

# 2. Fix rapide
# ... code ...
git add .
git commit -m "fix: bug critique en production"

# 3. Push
git push origin hotfix/bug-critique

# 4. Créer PR hotfix → main (urgent)
gh pr create --base main --head hotfix/bug-critique --title "URGENT: Fix bug critique"

# 5. Review express et merge
# → Deploy automatique en production

# 6. Backport dans develop
git checkout develop
git merge hotfix/bug-critique
git push origin develop
```

---

## 🔍 Étape 6 : Monitoring et Rollback

### 6.1 Voir les Déploiements

```bash
# Liste tous les déploiements
vercel ls

# Filtrer par environnement
vercel ls --prod
vercel ls --environment preview
```

### 6.2 Inspecter un Déploiement

```bash
# Détails complets
vercel inspect [deployment-url]

# Voir les logs
vercel logs [deployment-url]

# Voir les logs en temps réel
vercel logs [deployment-url] --follow
```

### 6.3 Rollback Production

**Option 1 : Via Vercel CLI**
```bash
# Lister les déploiements production récents
vercel ls --prod

# Promouvoir un ancien déploiement
vercel promote [old-deployment-url]
```

**Option 2 : Via Vercel Dashboard**
1. Aller sur https://vercel.com/[project]/deployments
2. Trouver le bon déploiement
3. Cliquer sur **⋯** → **Promote to Production**

**Option 3 : Via Git Revert**
```bash
git checkout main
git revert HEAD
git push origin main
# → Nouveau déploiement avec le code précédent
```

---

## 📈 Étape 7 : Optimisations Avancées

### 7.1 Deployment Protection

**Settings → Deployment Protection**

Activer la protection pour éviter les déploiements accidentels :
- Password protection
- Vercel Authentication
- Custom authentication

### 7.2 Build Cache

**Déjà configuré par défaut**, mais vérifier :
- Settings → General → Build & Development Settings
- ✅ Cache build outputs

### 7.3 Analytics & Monitoring

**Settings → Analytics**
- ✅ Enable Web Analytics
- ✅ Enable Web Vitals

**Monitoring via Vercel :**
```bash
# Voir les metrics
vercel inspect [deployment-url] --metrics
```

### 7.4 Edge Functions (optionnel)

Si besoin de edge computing :
- Middleware Next.js déployé automatiquement
- Edge API routes avec `export const runtime = 'edge'`

---

## 🎯 Checklist de Configuration Finale

### GitHub
- [ ] Branche `develop` créée et pushée
- [ ] Branche `staging` créée et pushée
- [ ] Protection activée sur `main` (required PR + 1 approval)
- [ ] Protection optionnelle sur `staging`
- [ ] Status checks configurés (Vercel)

### Vercel
- [ ] Production branch = `main`
- [ ] Domaine `onpointdoc-staging.vercel.app` assigné à `staging`
- [ ] Domaine `onpointdoc-dev.vercel.app` assigné à `develop`
- [ ] Preview deployments activés
- [ ] Variables d'environnement configurées par environnement
- [ ] Analytics activé

### Documentation
- [ ] `.github/BRANCH-STRATEGY.md` lu et compris
- [ ] `docs/VERCEL-SETUP-GUIDE.md` lu et appliqué
- [ ] Équipe formée au workflow

---

## 🆘 Troubleshooting

### Problème : Déploiement bloqué

```bash
# Vérifier le statut
vercel ls

# Voir les logs d'erreur
vercel logs [deployment-url]

# Forcer un nouveau déploiement
vercel --force
```

### Problème : Variables d'environnement manquantes

```bash
# Télécharger les variables localement
vercel env pull .env.local

# Vérifier qu'elles sont bien définies
vercel env ls
```

### Problème : Branch non détectée par Vercel

1. Vercel Dashboard → Settings → Git
2. Vérifier que la branche est dans "Include" et pas "Exclude"
3. Push un commit vide pour forcer la détection :
```bash
git commit --allow-empty -m "chore: trigger vercel"
git push origin [branch]
```

---

## 📚 Ressources

- [Vercel Git Integration](https://vercel.com/docs/deployments/git)
- [Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Deployment Protection](https://vercel.com/docs/security/deployment-protection)
- [Preview Deployments](https://vercel.com/docs/deployments/preview-deployments)

---

**Dernière mise à jour** : 2025-12-19
**Version** : 1.0.0
