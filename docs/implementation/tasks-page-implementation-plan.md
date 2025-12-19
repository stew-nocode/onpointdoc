# Plan d'implémentation - Page Tâches

## 🎯 Objectif
Créer la page de gestion des tâches (`/gestion/taches`) en suivant le pattern établi pour les activités, avec adaptation aux spécificités des tâches.

## 📋 Étapes d'implémentation

### ✅ ÉTAPE 1 - Types TypeScript (FONDATION)
**Objectif** : Définir les types pour les tâches avec relations

**Fichiers à créer** :
- `src/types/task-with-relations.ts`
- `src/types/task-filters.ts`

**Points clés** :
- Utiliser `Tables<'tasks'>` pour le type de base
- Ajouter `assigned_user` (relation directe 1:1, pas array)
- Relations N:M : `linked_tickets`, `linked_activities`
- Statuts : `'A_faire' | 'En_cours' | 'Termine' | 'Annule' | 'Bloque'`

**Tests** :
- ✅ Compilation TypeScript sans erreurs
- ✅ Types exportés correctement dans `src/types/index.ts`

---

### ✅ ÉTAPE 2 - Validation Zod
**Objectif** : Créer les schémas de validation pour création/mise à jour

**Fichiers à créer/modifier** :
- `src/lib/validators/task.ts`

**Points clés** :
- Statuts depuis l'enum Supabase
- `due_date` optionnel (timestamp)
- `assigned_to` optionnel (UUID)
- `description` optionnel
- `is_planned` boolean

**Tests** :
- ✅ Validation d'une tâche valide passe
- ✅ Validation d'une tâche invalide échoue avec messages appropriés

---

### ✅ ÉTAPE 3 - Transformer
**Objectif** : Transformer les données brutes Supabase en types typés

**Fichiers à créer** :
- `src/services/tasks/utils/task-transformer.ts`

**Points clés** :
- Normaliser `assigned_user` (peut être null ou objet unique)
- Normaliser `linked_tickets` (array via `ticket_task_link`)
- Normaliser `linked_activities` (array via `activity_task_link`)
- Gérer les cas edge (null, undefined, single object vs array)

**Tests** :
- ✅ Transformation avec toutes les relations présentes
- ✅ Transformation avec relations absentes
- ✅ Gestion des cas null/undefined

---

### ✅ ÉTAPE 4 - Service de base
**Objectif** : Créer `listTasksPaginated` avec pagination, recherche et filtres

**Fichiers à créer/modifier** :
- `src/services/tasks/index.ts` (étendre le fichier existant)

**Fonctionnalités** :
- Pagination (offset/limit)
- Recherche textuelle (titre, description)
- Filtres par statut
- Filtre "mine" (assigned_to = currentUser)
- Filtre "overdue" (due_date < today ET status != Termine/Annule)
- Tri par date de création (DESC par défaut)

**Tests** :
- ✅ Pagination fonctionne
- ✅ Recherche fonctionne
- ✅ Filtres appliquent les bonnes conditions SQL
- ✅ Gestion d'erreur avec `handleSupabaseError`

---

### ✅ ÉTAPE 5 - API Route
**Objectif** : Créer la route API pour le chargement côté client

**Fichiers à créer** :
- `src/app/api/tasks/list/route.ts`

**Fonctionnalités** :
- Route GET avec query params (offset, limit, search, quickFilter)
- Appel à `listTasksPaginated`
- Gestion d'erreur avec `handleApiError`

**Tests** :
- ✅ Route répond avec les données correctes
- ✅ Gestion d'erreur appropriée
- ✅ Paramètres URL correctement parsés

---

### ✅ ÉTAPE 6 - Hook Infinite Load
**Objectif** : Gérer le chargement infini côté client

**Fichiers à créer** :
- `src/hooks/tasks/use-tasks-infinite-load.ts`

**Fonctionnalités** :
- Appel API avec AbortController
- Gestion du state (tasks, hasMore, isLoading, error)
- Restauration du scroll (sessionStorage)
- Débouncing de la recherche

**Tests** :
- ✅ Chargement initial fonctionne
- ✅ Chargement de plus de tâches fonctionne
- ✅ Recherche déclenche le rechargement
- ✅ Filtres déclenchent le rechargement

---

### ✅ ÉTAPE 7 - Composants Search & Filters
**Objectif** : Créer la barre de recherche et les filtres rapides

**Fichiers à créer** :
- `src/components/tasks/tasks-search-bar.tsx`
- `src/components/tasks/tasks-quick-filters.tsx`

**Filtres à implémenter** :
- `all` : toutes les tâches
- `mine` : mes tâches (assigned_to)
- `todo` : statut = 'A_faire'
- `in_progress` : statut = 'En_cours'
- `blocked` : statut = 'Bloque'
- `completed` : statut = 'Termine'
- `overdue` : due_date < today ET status != Termine/Annule

**Tests** :
- ✅ Recherche synchronise avec l'URL
- ✅ Filtres synchronisent avec l'URL
- ✅ Changement de filtre réinitialise la pagination

---

### ✅ ÉTAPE 8 - Composant Table
**Objectif** : Créer l'en-tête et les lignes du tableau

**Fichiers à créer** :
- `src/components/tasks/tasks-infinite-scroll/tasks-table-header.tsx`
- `src/components/tasks/tasks-infinite-scroll/task-row.tsx`
- `src/lib/utils/task-column-preferences.ts`
- `src/components/tasks/tasks-columns-config-dialog.tsx`

**Colonnes à afficher** :
1. Titre (requis)
2. Statut
3. Assigné (assigned_user)
4. Date d'échéance (due_date)
5. Créateur (created_user)
6. Tickets liés (linked_tickets)
7. Activités liées (linked_activities)
8. Date de création

**Tests** :
- ✅ Toutes les colonnes s'affichent
- ✅ Colonnes masquables via configuration
- ✅ Sélection multiple fonctionne
- ✅ Badges de statut affichés correctement

---

### ✅ ÉTAPE 9 - Infinite Scroll
**Objectif** : Intégrer tous les composants dans le scroll infini

**Fichiers à créer** :
- `src/components/tasks/tasks-infinite-scroll/tasks-infinite-scroll.tsx`
- `src/components/tasks/tasks-infinite-scroll/load-more-button.tsx`
- `src/hooks/tasks/use-task-selection.ts`
- `src/components/tasks/bulk-actions-bar.tsx`

**Fonctionnalités** :
- Intégration de tous les composants précédents
- Sélection multiple
- Bouton "Voir plus"
- Restauration du scroll

**Tests** :
- ✅ Toutes les fonctionnalités intégrées fonctionnent
- ✅ Sélection multiple fonctionne
- ✅ Scroll infini fonctionne
- ✅ Performance acceptable (pas de lag)

---

### ✅ ÉTAPE 10 - KPIs
**Objectif** : Créer les KPIs pour les tâches

**Fichiers à créer** :
- `src/services/tasks/task-kpis.ts`
- `src/components/tasks/tasks-kpi-section.tsx`
- `src/components/tasks/tasks-kpi-section-lazy.tsx`

**KPIs à implémenter** :
1. Mes tâches à faire (vs hier)
2. Mes tâches terminées aujourd'hui (vs hier)
3. Mes tâches en cours (vs hier)
4. Mes tâches bloquées (vs hier)

**Requêtes Supabase** :
- Filtrer par `assigned_to = currentUser`
- Compter par statut
- Comparer avec la veille/période précédente
- Données pour graphiques 7 jours

**Tests** :
- ✅ KPIs calculent correctement les valeurs
- ✅ Tendances calculent correctement
- ✅ Graphiques affichent les données 7 jours
- ✅ Gestion du cas utilisateur non connecté

---

### ✅ ÉTAPE 11 - Page principale
**Objectif** : Créer la page complète avec intégration

**Fichiers à créer** :
- `src/app/(main)/gestion/taches/page.tsx`
- `src/app/(main)/gestion/taches/actions.ts`

**Fonctionnalités** :
- Chargement initial server-side
- Intégration de tous les composants
- Gestion d'erreur
- Layout avec `PageLayoutWithFilters`

**Tests** :
- ✅ Page se charge correctement
- ✅ Toutes les fonctionnalités sont accessibles
- ✅ Gestion d'erreur fonctionne
- ✅ Performance initiale acceptable

---

### ✅ ÉTAPE 12 - Tests et validation
**Objectif** : Validation complète et création de données de test

**Actions** :
- Créer 5-10 tâches de test avec différents statuts
- Tester tous les filtres
- Tester la recherche
- Tester les KPIs
- Tester la sélection multiple
- Vérifier les performances

**Validation** :
- ✅ Tous les filtres fonctionnent
- ✅ Recherche fonctionne
- ✅ KPIs affichent des valeurs correctes
- ✅ Pas d'erreurs dans la console
- ✅ Code suit les principes Clean Code

---

## 🔄 Méthodologie
- **Une étape à la fois** : Valider et tester chaque étape avant de passer à la suivante
- **Clean Code** : Composants < 100 lignes, fonctions < 20 lignes
- **TypeScript strict** : Typage explicite partout
- **Tests manuels** : Vérifier chaque fonctionnalité après implémentation
- **Pattern cohérent** : Réutiliser les patterns des activités

## 📝 Notes importantes
- **Différences avec activités** :
  - `assigned_to` (1:1) vs `participants` (N:M)
  - `due_date` (date unique) vs `planned_start/planned_end` (période)
  - Statut `'Bloque'` spécifique aux tâches
  - Pas de `activity_type`, pas de `location_mode`

- **Relations N:M** :
  - `ticket_task_link` : tasks ↔ tickets
  - `activity_task_link` : tasks ↔ activities

