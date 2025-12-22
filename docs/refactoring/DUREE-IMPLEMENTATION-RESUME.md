# Résumé d'implémentation : Logique de durée pour tâches et activités

**Date** : 2025-01-23  
**Statut** : ✅ Complété

## Vue d'ensemble

Implémentation complète de la logique de durée pour permettre la comparaison entre durées estimées et réelles dans les reportings, améliorant ainsi les estimations futures.

## Modifications de la base de données

### Migration SQL
- **Fichier** : `supabase/migrations/20250123000000_add_actual_duration_hours_to_tasks_and_activities.sql`
- **Statut** : ✅ Appliquée avec succès

### Tables modifiées

#### Table `tasks`
- ✅ Ajout de `actual_duration_hours` (NUMERIC, nullable)
- ✅ Index partiel créé : `idx_tasks_actual_duration_hours` (WHERE actual_duration_hours IS NOT NULL)

#### Table `activities`
- ✅ Ajout de `estimated_duration_hours` (NUMERIC, nullable)
- ✅ Ajout de `actual_duration_hours` (NUMERIC, nullable)
- ✅ Index partiels créés :
  - `idx_activities_estimated_duration_hours` (WHERE estimated_duration_hours IS NOT NULL)
  - `idx_activities_actual_duration_hours` (WHERE actual_duration_hours IS NOT NULL)

## Modifications du code

### Validators Zod

#### `src/lib/validators/task.ts`
- ✅ `actualDurationHours` ajouté dans `createTaskSchema` (optionnel, nombre positif)
- ✅ `actualDurationHours` ajouté dans `updateTaskSchema` (optionnel, nombre positif)

#### `src/lib/validators/activity.ts`
- ✅ `estimatedDurationHours` ajouté dans `createActivitySchema` (optionnel, nombre positif)
- ✅ `actualDurationHours` ajouté dans `createActivitySchema` (optionnel, nombre positif)
- ✅ `estimatedDurationHours` ajouté dans `updateActivitySchema` (optionnel, nombre positif)
- ✅ `actualDurationHours` ajouté dans `updateActivitySchema` (optionnel, nombre positif)

### Services

#### `src/services/tasks/index.ts`
- ✅ `createTask` : Gère `actual_duration_hours`
- ✅ `updateTask` : Fonction créée pour gérer tous les champs incluant `actual_duration_hours`

#### `src/services/activities/index.ts`
- ✅ `createActivity` : Gère `estimated_duration_hours` et `actual_duration_hours`
- ✅ `updateActivity` : Gère `estimated_duration_hours` et `actual_duration_hours`

### Services de planning

#### `src/services/activities/get-workload-for-date.ts` (NOUVEAU)
- ✅ Service pour calculer la charge de travail des activités pour une date donnée
- ✅ Logique de calcul de durée :
  - Priorité 1 : `estimated_duration_hours` si disponible
  - Priorité 2 : Calcul depuis `planned_end - planned_start` si les dates sont présentes
- ✅ Filtre par `planned_start` dans la journée
- ✅ Exclut les activités annulées

#### `src/services/planning/calculate-total-workload.ts` (NOUVEAU)
- ✅ Service pour combiner la charge des tâches et activités
- ✅ Réutilise `getWorkloadForDate` (tâches) et `getActivityWorkloadForDate` (activités)
- ✅ Retourne un résultat consolidé avec détails par type

## Logique de calcul de durée

### Pour le planning (futur)

#### Tâches
- Utilise `estimated_duration_hours` directement

#### Activités
1. Utilise `estimated_duration_hours` si disponible (prioritaire)
2. Sinon, calcule depuis `planned_end - planned_start` (en heures)

### Pour le reporting (complété)

#### Tâches
- Utilise `actual_duration_hours` si disponible
- Sinon, utilise `estimated_duration_hours` en fallback

#### Activités
- Utilise `actual_duration_hours` si disponible
- Sinon, utilise `estimated_duration_hours` si disponible
- Sinon, calcule depuis `planned_end - planned_start`

## Validation et tests

- ✅ TypeScript compile sans erreurs (`npm run typecheck`)
- ✅ Aucune erreur de linter détectée
- ✅ Migration SQL appliquée avec succès
- ✅ Types TypeScript régénérés depuis Supabase
- ✅ Tous les exports validés

## Prochaines étapes (optionnelles)

### UI/UX (à faire progressivement)

1. **Section de complétion dans les formulaires**
   - Ajouter un champ pour `actualDurationHours` dans le formulaire de tâche (visible quand `status === 'Termine'`)
   - Ajouter un champ pour `actualDurationHours` dans le formulaire d'activité (visible quand `status === 'Termine'`)
   - Ajouter un champ pour `estimatedDurationHours` dans le formulaire d'activité (section planification)

2. **Affichage dans les listes**
   - Afficher la durée réelle vs estimée dans les tableaux de tâches/activités
   - Indicateurs visuels pour les écarts entre estimé et réel

3. **Reportings**
   - Créer des graphiques de comparaison estimé vs réel
   - Statistiques d'amélioration des estimations au fil du temps

### Optimisations (si nécessaire)

1. **Filtrage par participant dans `getActivityWorkloadForDate`**
   - Ajouter une jointure SQL avec `activity_participants` pour un filtrage efficace par participant
   - Actuellement, le filtrage n'est pas implémenté (TODO dans le code)

## Fichiers créés/modifiés

### Nouveaux fichiers
- `supabase/migrations/20250123000000_add_actual_duration_hours_to_tasks_and_activities.sql`
- `src/services/activities/get-workload-for-date.ts`
- `src/services/planning/calculate-total-workload.ts`
- `docs/refactoring/DUREE-IMPLEMENTATION-RESUME.md` (ce fichier)

### Fichiers modifiés
- `src/lib/validators/task.ts`
- `src/lib/validators/activity.ts`
- `src/services/tasks/index.ts`
- `src/services/activities/index.ts`

## Notes techniques

- Tous les champs de durée sont optionnels (NULL autorisé) pour ne pas casser les données existantes
- Les index partiels optimisent les requêtes de planning et reporting
- La logique respecte les principes Clean Code (SOLID, DRY, KISS)
- Gestion d'erreur systématique avec `handleSupabaseError` et `createError`
- Validation Zod avec `safeParse()` pour une gestion d'erreur propre



