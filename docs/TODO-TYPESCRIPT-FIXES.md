# 📝 TODO: Corrections TypeScript - Dettes Techniques

> **Date** : 2025-12-19
> **Priorité** : HAUTE
> **Effort estimé** : 6-8 heures
> **Guide complet** : Voir [TECHNICAL-DEBT-AUDIT-GUIDE.md](./TECHNICAL-DEBT-AUDIT-GUIDE.md)

---

## 🎯 Objectif

Réactiver `typescript.ignoreBuildErrors: false` dans `next.config.mjs` après avoir corrigé toutes les erreurs TypeScript.

---

## ✅ COMPLÉTÉS

### 1. Configuration Vercel ✅
- [x] Créer `.npmrc` avec `legacy-peer-deps=true`
- [x] Ajouter `overrides` dans `package.json` pour React 19

### 2. Next.js 16 Compatibility ✅
- [x] `revalidateTag()` avec 2 arguments (ajout de 'max')
  - [x] `src/app/(main)/gestion/activites/actions.ts:30`
  - [x] `src/app/(main)/gestion/activites/actions.ts:68`
  - [x] `src/app/(main)/gestion/taches/actions.ts:30`

### 3. Zod 4 Compatibility ✅
- [x] `error.errors` → `error.issues`
  - [x] `src/app/actions/dashboard-tickets-by-company.ts:59`
  - [x] `src/app/actions/dashboard-tickets-by-type.ts:59`
  - [x] `src/app/actions/dashboard.ts:55`
  - [x] `src/app/api/webhooks/brevo/route.ts:84`

### 4. SearchParams Optionnel ✅
- [x] Gérer `searchParams` undefined
  - [x] `src/app/(main)/gestion/activites/page.tsx:103`
  - [x] `src/app/(main)/gestion/tickets/page.tsx:201`

### 5. Import Manquants ✅
- [x] Ajouter `isApplicationError` aux imports
  - [x] `src/app/actions/dashboard-tickets-by-company.ts:6`
  - [x] `src/app/actions/dashboard-tickets-by-type.ts:6`

### 6. Types Period ✅
- [x] Caster les strings vers le type `Period`
  - [x] `src/app/api/dashboard/route.ts:88`
  - [x] `src/app/api/dashboard/route.ts:138`
  - [x] `src/app/api/dashboard/route.ts:153`

### 7. QuickFilter Type ✅
- [x] Ajouter 'all', 'bug_in_progress', 'req_in_progress' au schéma Zod
  - [x] `src/lib/validators/api-params.ts:15-25`
- [x] Décommenter la ligne dans `utils.ts`
  - [x] `src/app/actions/tickets/utils.ts:49`

### 8. Table Brevo ✅
- [x] Créer la migration SQL
  - [x] `supabase/migrations/20251219120000_create_brevo_email_events.sql`
- [x] Décommenter le code du webhook
  - [x] `src/app/api/webhooks/brevo/route.ts:104` (avec cast temporaire `as any`)

### 9. Nullable Handling ✅
- [x] Gérer `activity_type` nullable
  - [x] `src/components/activities/activities-infinite-scroll/activity-row.tsx:147`

### 10. API Handler Arguments ✅
- [x] Retirer le 2ème argument de `handleApiError`
  - [x] `src/app/api/companies/list/route.ts:56`

### 11. Undefined vs Null ✅
- [x] Ajouter `?? null` pour gérer optional chaining
  - [x] `src/app/api/admin/users/create/route.ts:74`

---

## ⚠️ À FAIRE - HAUTE PRIORITÉ

### 1. Table Brevo - Appliquer la Migration 🔴

**Fichier** : `supabase/migrations/20251219120000_create_brevo_email_events.sql`

**Actions** :
```bash
# Local
cd c:\Projects\OnpointDoc
supabase db push

# Production (via console Supabase)
# 1. Aller sur https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql
# 2. Copier-coller le contenu de la migration
# 3. Exécuter

# Régénérer les types
supabase gen types typescript --local > src/types/database.types.ts

# Puis retirer le cast (as any) dans le webhook
```

**Fichiers à modifier** après migration :
- [ ] `src/app/api/webhooks/brevo/route.ts:104` - Retirer `(supabase as any)`

---

### 2. TaskDueDateSection - Décider du Sort 🟠

**Fichier** : `src/components/forms/task-form/sections/task-due-date-section.tsx`

**Problème** : Le champ `dueDate` n'existe pas dans `CreateTaskInput`

**Options** :
1. **Ajouter `dueDate` au schéma** (recommandé si besoin fonctionnel)
   - [ ] Ajouter `dueDate` à `src/lib/validators/task.ts`
   - [ ] Créer migration SQL pour ajouter la colonne `due_date` à la table `tasks`
   - [ ] Régénérer les types Supabase
   - [ ] Réactiver le composant

2. **Retirer le composant** (si fonctionnalité abandonnée)
   - [ ] Supprimer le fichier `task-due-date-section.tsx`
   - [ ] Retirer l'import dans `TaskForm`
   - [ ] Mettre à jour la documentation

**Décision à prendre** : Vérifier avec l'équipe produit

---

### 3. TasksInfiniteScroll - Paramètre Sort 🟠

**Fichier** : `src/components/tasks/tasks-infinite-scroll/tasks-infinite-scroll.tsx:84`

**Problème** : Le paramètre `sort` n'est pas dans `UseTasksInfiniteLoadProps`

**Actions** :
- [ ] Vérifier le hook `useTasksInfiniteLoad` dans `src/hooks/use-tasks-infinite-load.ts`
- [ ] Soit ajouter `sort` au type `UseTasksInfiniteLoadProps`
- [ ] Soit confirmer que le tri n'est pas supporté et retirer le paramètre

---

### 4. Badge Variants - Remplacer 'secondary' 🟡

**Recherche** :
```bash
grep -r "variant=\"secondary\"" src/
```

**Actions** :
- [ ] Trouver tous les `<Badge variant="secondary" />`
- [ ] Remplacer par `variant="default"` ou `variant="outline"`
- [ ] Vérifier visuellement le rendu

---

### 5. Autres Erreurs TypeScript 🟡

**Fichiers identifiés avec erreurs** (lors du dernier build) :
- [ ] `src/components/tasks/task-selection/...` (ligne 64-65)
- [ ] Autres à identifier lors du prochain build strict

**Process** :
1. Réactiver TypeScript strict temporairement
2. Lancer `npm run build` et capturer toutes les erreurs
3. Trier par priorité (critiques vs warnings)
4. Corriger une par une

---

## 📋 Checklist de Validation Finale

### Avant de Réactiver TypeScript Strict
- [ ] Tous les TODOs "HAUTE PRIORITÉ" ci-dessus sont terminés
- [ ] Migration Brevo appliquée en local ET en production
- [ ] Types Supabase régénérés
- [ ] Décision prise sur TaskDueDateSection
- [ ] Paramètre `sort` dans TasksInfiniteScroll corrigé

### Réactivation TypeScript Strict
- [ ] Éditer `next.config.mjs`
- [ ] Retirer les lignes 25-29 (typescript.ignoreBuildErrors)
- [ ] Lancer `npm run build`
- [ ] Corriger les erreurs une par une
- [ ] Build 100% réussi sans warnings

### Validation
- [ ] `npm run build` → 0 erreurs
- [ ] `npm run typecheck` → 0 erreurs
- [ ] `npm run lint` → 0 warnings
- [ ] Tests locaux OK
- [ ] Déploiement Vercel réussi
- [ ] Tests fonctionnels en production

---

## 🔧 Scripts Utiles

```bash
# Audit complet
bash scripts/audit-technical-debt.sh

# Vérifier types Supabase
bash scripts/check-supabase-types.sh

# Build avec rapport
bash scripts/build-with-report.sh

# Chercher tous les TODOs techniques
grep -rn "TODO.*Fix\|TODO.*URGENT" src/ docs/

# Chercher les casts dangereux
grep -rn " as any\| as unknown" src/ --include="*.ts" --include="*.tsx"
```

---

## 📚 Références

- [Guide d'Audit Complet](./TECHNICAL-DEBT-AUDIT-GUIDE.md)
- [Rapport d'Erreurs Original](./TECHNICAL-DEBT-AUDIT-GUIDE.md#dettes-techniques-critiques)
- [Next.js 16 Migration](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [Zod 4 Changelog](https://zod.dev/CHANGELOG)

---

**Prochaine étape recommandée** : Commencer par la section "À FAIRE - HAUTE PRIORITÉ" #1 (Migration Brevo)
