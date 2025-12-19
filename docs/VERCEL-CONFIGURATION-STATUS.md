# Configuration Vercel - Statut Actuel

## ✅ Déploiements Réussis

### Production (main)
- **URL**: https://onpointdoc.vercel.app
- **Branche**: `main`
- **Statut**: ✅ Déployé (21 minutes ago)
- **Build**: 0 erreurs TypeScript, 52 pages générées

### Staging
- **URL**: https://onpointdoc-gtasv79y7-kouassis-projects-e812985e.vercel.app
- **Branche**: `staging`
- **Statut**: ✅ Déployé avec succès
- **Build**: 0 erreurs TypeScript, 52 pages générées

### Development
- **URL**: https://onpointdoc-k7kibw70x-kouassis-projects-e812985e.vercel.app
- **Branche**: `develop`
- **Statut**: ✅ Déployé avec succès
- **Build**: 0 erreurs TypeScript, 52 pages générées

---

## ⚠️ Configuration Restante (Dashboard Vercel)

Les tâches suivantes doivent être effectuées via le **Dashboard Vercel** car elles nécessitent une interface web ou des permissions spéciales.

### 1. Configuration des Domaines Personnalisés

**Aller sur**: https://vercel.com/kouassis-projects-e812985e/onpointdoc/settings/domains

#### Actions à effectuer:

1. **Ajouter domaine staging**:
   - Cliquer sur "Add"
   - Entrer: `onpointdoc-staging` (Vercel ajoutera automatiquement `.vercel.app`)
   - Après création, cliquer sur "Edit" → Assigner à la branche `staging`
   - **Résultat attendu**: `https://onpointdoc-staging.vercel.app` → branche `staging`

2. **Ajouter domaine development**:
   - Cliquer sur "Add"
   - Entrer: `onpointdoc-dev` (Vercel ajoutera automatiquement `.vercel.app`)
   - Après création, cliquer sur "Edit" → Assigner à la branche `develop`
   - **Résultat attendu**: `https://onpointdoc-dev.vercel.app` → branche `develop`

---

### 2. Configuration des Variables d'Environnement

**Aller sur**: https://vercel.com/kouassis-projects-e812985e/onpointdoc/settings/environment-variables

Les variables suivantes doivent être configurées avec des valeurs **différentes** pour chaque environnement:

#### Variables Critiques (Supabase)

| Variable | Production | Preview (Staging) | Development |
|----------|-----------|-------------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de la DB production | URL de la DB staging (si différente) | URL de la DB dev (si différente) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anon production | Clé anon staging | Clé anon dev |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service production | Clé service staging | Clé service dev |
| `SUPABASE_ACCESS_TOKEN` | Token production | Token staging | Token dev |

**Recommandation actuelle**:
- Si vous avez **une seule base de données Supabase** pour tous les environnements, utilisez les **mêmes valeurs** partout
- Si vous avez des **bases de données séparées** (recommandé pour la production), utilisez des valeurs différentes

#### Variables d'Application

| Variable | Production | Preview | Development |
|----------|-----------|---------|-------------|
| `NEXT_PUBLIC_APP_URL` | `https://onpointdoc.vercel.app` | `https://onpointdoc-staging.vercel.app` | `https://onpointdoc-dev.vercel.app` |
| `SUPPORT_DEFAULT_PRODUCT_ID` | ID production | Même valeur | Même valeur |
| `SUPPORT_DEFAULT_MODULE_ID` | ID production | Même valeur | Même valeur |

#### Variables Externes (même valeur partout)

Ces variables peuvent utiliser les **mêmes valeurs** pour tous les environnements:

- `N8N_WEBHOOK_BASE_URL`
- `N8N_API_KEY`
- `N8N_ANALYSIS_WEBHOOK_URL`
- `JIRA_BASE_URL`
- `JIRA_API_EMAIL`
- `JIRA_API_TOKEN`
- `JIRA_PROJECT_KEY`
- `JIRA_SUPABASE_CUSTOMFIELD_ID`
- `GITHUB_TOKEN`
- `BREVO_API_KEY`
- `BREVO_API_URL`
- `BREVO_DEFAULT_SENDER_NAME`
- `BREVO_DEFAULT_SENDER_EMAIL`

#### Procédure pour chaque variable:

1. Cliquer sur **"Add New"**
2. **Name**: Nom de la variable (ex: `NEXT_PUBLIC_SUPABASE_URL`)
3. **Value**: Valeur pour Production
4. **Environments**: Cocher `Production`, `Preview`, `Development`
5. Cliquer sur **"Save"**
6. Si besoin de valeurs différentes pour Preview/Development:
   - Cliquer sur l'icône "⋯" à côté de la variable
   - Cliquer sur "Override for Preview"
   - Entrer la valeur spécifique pour Preview
   - Répéter pour Development si nécessaire

---

### 3. Configuration Git Integration

**Aller sur**: https://vercel.com/kouassis-projects-e812985e/onpointdoc/settings/git

#### Vérifications à effectuer:

- ✅ **Production Branch**: Doit être `main`
- ✅ **Automatic Preview Deployments**: Doit être `On`
- ✅ **Deploy Comments**: Activé (optionnel mais utile)
- ✅ **Ignored Build Step**: Laisser vide (ou utiliser pour éviter certains déploiements)

**Branching Configuration**:
- Les branches `staging` et `develop` devraient être détectées automatiquement
- Vérifier qu'elles apparaissent dans la liste des branches disponibles

---

### 4. Protection des Déploiements (Optionnel)

**Aller sur**: https://vercel.com/kouassis-projects-e812985e/onpointdoc/settings/deployment-protection

**Options recommandées**:
- **Staging**: Activer "Vercel Authentication" ou "Password Protection" pour éviter l'accès public
- **Development**: Optionnel, peut rester ouvert pour les tests internes
- **Production**: Laisser public (ou protéger selon vos besoins)

---

## 📊 Résumé de la Configuration Actuelle

### ✅ Terminé

- [x] Branches Git créées (`main`, `staging`, `develop`)
- [x] Documentation complète créée
- [x] Premier déploiement staging réussi
- [x] Premier déploiement development réussi
- [x] Build TypeScript à 0 erreur sur tous les environnements
- [x] 52 pages générées avec succès

### ⏳ À Faire Manuellement (Dashboard Vercel)

- [ ] Ajouter domaine `onpointdoc-staging.vercel.app` → branche `staging`
- [ ] Ajouter domaine `onpointdoc-dev.vercel.app` → branche `develop`
- [ ] Configurer toutes les variables d'environnement (voir tableau ci-dessus)
- [ ] Vérifier Git Integration settings
- [ ] (Optionnel) Activer Deployment Protection pour staging

---

## 🎯 Utilisation du Workflow une fois Configuré

### Workflow de Développement

```bash
# 1. Créer une feature
git checkout develop
git pull origin develop
git checkout -b feature/ma-feature

# 2. Développer et commit
git add .
git commit -m "feat: ma nouvelle feature"

# 3. Push → Crée automatiquement un Preview Deployment
git push origin feature/ma-feature

# 4. Créer PR vers develop → Merger
# → Deploy automatique sur onpointdoc-dev.vercel.app
```

### Workflow de Release

```bash
# 1. Merger develop dans staging
git checkout staging
git pull origin staging
git merge develop
git push origin staging
# → Deploy automatique sur onpointdoc-staging.vercel.app

# 2. Tester sur staging (UAT)
# → Valider les features avec l'équipe

# 3. Si OK, créer PR staging → main
# 4. Merger la PR
# → Deploy automatique sur onpointdoc.vercel.app (production)
```

---

## 📚 Liens Utiles

### Déploiements Actuels
- **Production**: https://onpointdoc.vercel.app
- **Staging**: https://onpointdoc-gtasv79y7-kouassis-projects-e812985e.vercel.app (temporaire)
- **Development**: https://onpointdoc-k7kibw70x-kouassis-projects-e812985e.vercel.app (temporaire)

### Dashboard Vercel
- **Projet**: https://vercel.com/kouassis-projects-e812985e/onpointdoc
- **Deployments**: https://vercel.com/kouassis-projects-e812985e/onpointdoc/deployments
- **Settings**: https://vercel.com/kouassis-projects-e812985e/onpointdoc/settings

### Documentation Projet
- [Branch Strategy](.github/BRANCH-STRATEGY.md)
- [Vercel Setup Guide](VERCEL-SETUP-GUIDE.md)
- [Quick Commands](QUICK-COMMANDS.md)
- [Workflow Summary](VERCEL-WORKFLOW-SUMMARY.md)

---

## ⚡ Commandes Rapides Vercel

```bash
# Voir tous les déploiements
vercel ls

# Voir les logs d'un déploiement
vercel logs [URL]

# Redéployer un environnement
git push origin staging  # Pour staging
git push origin develop  # Pour development
git push origin main     # Pour production (via PR!)

# Rollback production (via CLI)
vercel ls --prod
vercel promote [old-deployment-url]
```

---

**Dernière mise à jour**: 2025-12-19
**Statut**: ⚠️ Configuration partielle - Variables d'environnement et domaines à configurer via Dashboard
