# Corrections pour Déploiement - 22 Décembre 2025

## Résumé
Correction de 13 erreurs TypeScript détectées par GitHub Actions pour permettre le déploiement sur develop.

## Erreurs Corrigées

### 1. ✅ Propriété `actualDurationHours` manquante dans UpdateTaskInput
**Fichier**: `src/lib/validators/task.ts`
**Solution**: Ajout de `actualDurationHours: z.number().positive().optional()` au schéma `updateTaskSchema`

### 2. ✅ Propriété `actualDurationHours` manquante dans UpdateActivityInput
**Fichier**: `src/lib/validators/activity.ts`
**Solution**: Ajout de `actualDurationHours: z.number().positive().optional()` au schéma `updateActivitySchema`

### 3. ✅ Fonction `updateTask` non exportée
**Fichier**: `src/services/tasks/index.ts`
**Solution**: Création complète de la fonction `updateTask` avec gestion des liens tickets/activités et export
- Gestion de tous les champs optionnels
- Mise à jour des liens avec tickets et activités
- Gestion d'erreurs avec Supabase

### 4. ✅ Propriété `includeOld` manquante dans DashboardFiltersInput (3 occurrences)
**Fichier**: `src/types/dashboard-filters.ts`
**Solution**:
- Ajout de `includeOld?: boolean` au type `DashboardFiltersInput`
- Ajout de `includeOld: true` dans `buildDefaultDashboardFilters()`

### 5. ✅ Import `PlanningItem` non trouvé
**Fichier**: `src/components/planning/types.ts`
**Solution**: Ajout d'un alias de type `export type PlanningItem = MockPlanningItem;`

### 6. ✅ Propriété `createdBy` manquante dans MockPlanningActivity
**Fichier**: `src/components/planning/types.ts`
**Solution**: Ajout de la propriété optionnelle `createdBy` au type `MockPlanningActivity`

### 7. ✅ Propriétés `startDate` et `estimatedDurationHours` manquantes dans MockPlanningTask
**Fichier**: `src/components/planning/types.ts`
**Solution**: Ajout de deux propriétés optionnelles au type `MockPlanningTask`:
- `startDate?: string | null`
- `estimatedDurationHours?: number | null`

### 8. ✅ Module `./dashboard-filters-bar` non trouvé
**Statut**: Fichier existe déjà à l'emplacement correct
**Action**: Aucune modification nécessaire

### 9. ✅ Module `./planning-item-card` non trouvé
**Statut**: Fichier existe déjà à l'emplacement correct
**Action**: Aucune modification nécessaire

### 10. ✅ displayName manquant dans useChartTooltip
**Fichier**: `src/hooks/charts/useChartTooltip.tsx`
**Solution**: Ajout de `Component.displayName = 'ChartTooltip';` au composant memoizé

### 11. ✅ Type récursif excessivement profond dans use-supabase-query
**Fichier**: `src/hooks/supabase/use-supabase-query.ts`
**Solution**: Utilisation de `any` avec eslint-disable pour contourner le problème d'inférence de types récursifs

## Tests de Validation

### Build TypeScript
```bash
npm run build
```
**Résultat**: ✅ Succès - Compilation TypeScript sans erreurs

### Linting
```bash
npm run lint
```
**Résultat**: ✅ Succès - 0 erreurs, 7 warnings (non bloquants)

Les warnings restants sont liés à:
- Optimisations React Compiler (components created during render)
- Compatibilité React Hook Form
- Directive eslint-disable inutilisée

Ces warnings ne bloquent pas le déploiement.

## Fichiers Modifiés

1. `src/lib/validators/task.ts` - Ajout actualDurationHours
2. `src/lib/validators/activity.ts` - Ajout actualDurationHours
3. `src/services/tasks/index.ts` - Création fonction updateTask
4. `src/types/dashboard-filters.ts` - Ajout includeOld
5. `src/components/planning/types.ts` - Ajouts createdBy, startDate, estimatedDurationHours, alias PlanningItem
6. `src/hooks/charts/useChartTooltip.tsx` - Ajout displayName
7. `src/hooks/supabase/use-supabase-query.ts` - Fix types récursifs

## Prochaines Étapes

1. ✅ Commit des corrections
2. ✅ Push sur develop
3. ⏳ Vérifier que GitHub Actions passe
4. ⏳ Déployer sur staging si nécessaire

## Notes Techniques

### updateTask
La nouvelle fonction `updateTask` suit le même pattern que `createTask`:
- Validation via Zod (UpdateTaskInput)
- Gestion des champs optionnels
- Mise à jour des liens avec tickets/activités
- Gestion d'erreurs avec handleSupabaseError

### Types Planning
Les types MockPlanning* sont temporaires et seront remplacés par les vrais types Supabase lors de la connexion finale. L'alias `PlanningItem` facilite cette transition future.

### includeOld
Le paramètre `includeOld` permet de filtrer les anciennes données dans les graphiques d'évolution. Valeur par défaut: `true` pour maintenir le comportement actuel.
