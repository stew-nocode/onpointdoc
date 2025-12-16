# Analyse et Optimisations de Performance - Page /tâches

**Date**: 2025-12-15
**Contexte**: Analyse approfondie de la page /tâches suivant les optimisations de /activités
**Objectif**: Appliquer les mêmes optimisations pour améliorer la rapidité de chargement

---

## 1. État Actuel de l'Architecture

### Structure de la Page
- **Server Component**: `src/app/(main)/gestion/taches/page.tsx`
- **Service Principal**: `src/services/tasks/index.ts`
- **Hook de Chargement**: `src/hooks/tasks/use-tasks-infinite-load.ts`
- **KPIs**: `src/services/tasks/task-kpis.ts`
- **API Route**: `src/app/api/tasks/list/route.ts`

### Pattern Actuel (Bien Implémenté ✅)
✅ Utilisation de `noStore()` pour les données temps réel
✅ `getCachedCurrentUserProfileId()` pour éviter le rate limiting
✅ Parallélisation des requêtes indépendantes avec `Promise.all()`
✅ Lazy loading des KPIs avec `dynamic()` et `ssr: false`
✅ Pattern cohérent avec la page /activités

---

## 2. Analyse des Requêtes Supabase

### 2.1 Requête Principale (listTasksPaginated)

**Requête Actuelle**:
```typescript
.from('tasks')
.select(`
  id, title, description, due_date, is_planned, status,
  created_by, assigned_to, validated_by_manager, team_id,
  report_content, created_at, updated_at,
  created_user:profiles!tasks_created_by_fkey(id, full_name),
  assigned_user:profiles!tasks_assigned_to_fkey(id, full_name),
  ticket_task_link(
    ticket:tickets!ticket_task_link_ticket_id_fkey(
      id, title, ticket_type, status, jira_issue_key
    )
  ),
  activity_task_link(
    activity:activities!activity_task_link_activity_id_fkey(
      id, title, activity_type, status
    )
  )
`, { count: 'exact' })
```

**Problèmes Identifiés**:

#### 🔴 CRITIQUE: N+1 Queries Potentielles
- **ticket_task_link**: Chaque tâche peut avoir plusieurs tickets liés → JOIN multiple
- **activity_task_link**: Chaque tâche peut avoir plusieurs activités liées → JOIN multiple
- `report_content` chargé mais rarement affiché dans la liste

**Impact**: Pour 25 tâches avec en moyenne 2 tickets et 1 activité chacune:
- 25 tâches + 50 tickets + 25 activités = **100 lignes à joindre**
- Temps estimé: 150-400ms par requête

#### 🟡 MOYEN: Count Exact Coûteux
```typescript
{ count: 'exact' }
```
- Force PostgreSQL à compter TOUTES les lignes
- Pour une table avec 5,000+ tâches: **+40-100ms**

#### 🟡 MOYEN: `report_content` Inutilisé
- Chargé pour toutes les tâches mais affiché uniquement en détail
- **Impact**: +20-40ms de transfert réseau

### 2.2 Requêtes KPIs (getTaskKPIs)

**8 Requêtes COUNT en Parallèle**:
1. Tâches à faire (`myTasksTodo`)
2. Tâches terminées ce mois (`myTasksCompletedThisMonth`)
3. Tâches terminées mois dernier (`myTasksCompletedLastMonth`)
4. Tâches en retard (`tasksOverdue`)
5. Tâches en retard semaine dernière (`tasksOverdueLastWeek`)
6. Tâches en cours (`myTasksInProgress`)
7-8. Valeurs précédentes pour tendances (simulées)

**Problèmes**:

#### 🟡 MOYEN: 8 Requêtes COUNT
- Toutes exécutées en parallèle (bon)
- Mais 8 requêtes séparées au lieu d'une seule agrégée
- **Impact**: 8 × 15-25ms = **120-200ms**

#### 🟢 BON: Pas de Graphiques 7 Jours
- Contrairement à /activités, les graphiques sont simulés avec `generateChartData`
- Pas de 28 requêtes séquentielles ✅
- **Mais**: Données graphiques pas réelles (amélioration possible)

### 2.3 Index Disponibles

**Index Existants**:
```sql
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_tasks_team_id ON tasks(team_id);
```

**Index Manquants** (critique):
- ❌ `assigned_to` - utilisé dans TOUS les filtres "mine" et KPIs
- ❌ `status` - utilisé dans tous les quick filters
- ❌ `due_date` - utilisé pour tri et filtre "overdue"
- ❌ `created_at` - utilisé pour tri par défaut
- ❌ Composite `(assigned_to, status)` - combinaison très fréquente
- ❌ Composite `(due_date, status)` - pour filtre "overdue"

**Impact**: Full table scans sur les filtres → **×3-4 plus lent**

---

## 3. Comparaison avec /activités

| Aspect | /activités | /tâches | Différence |
|--------|-----------|---------|------------|
| **Structure de requête** | Similaire | Similaire | Identique ✅ |
| **Count exact** | ✅ Utilisé | ✅ Utilisé | Même problème |
| **KPIs COUNT** | 12 requêtes | 8 requêtes | **Moins critique** ✅ |
| **Graphiques 7 jours** | 28 requêtes réelles | Simulés | **Tâches mieux** ✅ |
| **Index status** | ✅ Manquant | ❌ Manquant | Même problème |
| **Index assigned_to** | N/A | ❌ Manquant | Critique pour tâches |
| **Index due_date** | N/A | ❌ Manquant | Critique pour tâches |

**Conclusion**: La page /tâches a **MOINS de requêtes** que /activités mais **manque d'index critiques**.

---

## 4. Propositions d'Optimisations

### 🚀 PRIORITÉ HAUTE

#### 4.1 Créer des Index Composites

```sql
-- Migration: 2025-12-15-optimize-tasks-indexes.sql

-- Index pour assigned_to (CRITIQUE - utilisé partout)
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to
ON tasks(assigned_to);

-- Index pour status (utilisé dans tous les quick filters)
CREATE INDEX IF NOT EXISTS idx_tasks_status
ON tasks(status);

-- Index pour due_date (utilisé pour tri et filtre overdue)
CREATE INDEX IF NOT EXISTS idx_tasks_due_date
ON tasks(due_date)
WHERE due_date IS NOT NULL;

-- Index pour created_at avec DESC (tri par défaut)
CREATE INDEX IF NOT EXISTS idx_tasks_created_at_desc
ON tasks(created_at DESC);

-- Index composite pour "mes tâches" filtrées par statut
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_status
ON tasks(assigned_to, status);

-- Index composite pour tâches en retard
CREATE INDEX IF NOT EXISTS idx_tasks_overdue
ON tasks(due_date, status)
WHERE due_date IS NOT NULL
  AND status NOT IN ('Termine', 'Annule');

-- Index pour updated_at (utilisé pour tâches terminées ce mois)
CREATE INDEX IF NOT EXISTS idx_tasks_updated_at
ON tasks(updated_at DESC);

-- Index composite pour tâches terminées ce mois
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_status_updated
ON tasks(assigned_to, status, updated_at DESC)
WHERE status = 'Termine';

-- Index sur ticket_task_link pour améliorer les JOINs
CREATE INDEX IF NOT EXISTS idx_ticket_task_link_task_id
ON ticket_task_link(task_id);

CREATE INDEX IF NOT EXISTS idx_ticket_task_link_ticket_id
ON ticket_task_link(ticket_id);

-- Index sur activity_task_link pour améliorer les JOINs
CREATE INDEX IF NOT EXISTS idx_activity_task_link_task_id
ON activity_task_link(task_id);

CREATE INDEX IF NOT EXISTS idx_activity_task_link_activity_id
ON activity_task_link(activity_id);
```

**Gain estimé**: -45% sur les requêtes filtrées (200ms → 110ms)

#### 4.2 Fonction PostgreSQL pour Agréger les KPIs

```sql
-- Migration: 2025-12-15-add-tasks-stats-function.sql

CREATE OR REPLACE FUNCTION public.get_tasks_kpis(
  p_profile_id UUID,
  p_start_of_month TIMESTAMP WITH TIME ZONE,
  p_today DATE
)
RETURNS TABLE (
  tasks_todo BIGINT,
  tasks_completed_this_month BIGINT,
  tasks_overdue BIGINT,
  tasks_in_progress BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Tâches à faire
    COUNT(DISTINCT CASE
      WHEN t.assigned_to = p_profile_id
        AND t.status = 'A_faire'
      THEN t.id
    END) AS tasks_todo,
    -- Tâches terminées ce mois
    COUNT(DISTINCT CASE
      WHEN t.assigned_to = p_profile_id
        AND t.status = 'Termine'
        AND t.updated_at >= p_start_of_month
      THEN t.id
    END) AS tasks_completed_this_month,
    -- Tâches en retard
    COUNT(DISTINCT CASE
      WHEN t.assigned_to = p_profile_id
        AND t.due_date < p_today
        AND t.status NOT IN ('Termine', 'Annule')
      THEN t.id
    END) AS tasks_overdue,
    -- Tâches en cours
    COUNT(DISTINCT CASE
      WHEN t.assigned_to = p_profile_id
        AND t.status = 'En_cours'
      THEN t.id
    END) AS tasks_in_progress
  FROM tasks t
  WHERE t.assigned_to = p_profile_id;
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION public.get_tasks_kpis TO authenticated;
```

**Gain estimé**: 8 requêtes → **1 requête** = -87% (120ms → 15ms)

#### 4.3 Optimiser listTasksPaginated

**Changements**:
```typescript
// src/services/tasks/index.ts

.select(`
  id, title, description, due_date, is_planned, status,
  created_by, assigned_to, validated_by_manager, team_id,
  created_at, updated_at,
  created_user:profiles!tasks_created_by_fkey(id, full_name),
  assigned_user:profiles!tasks_assigned_to_fkey(id, full_name),
  ticket_task_link!inner(count),
  activity_task_link!inner(count)
`, { count: 'estimated' }) // estimated au lieu de exact
```

1. ✅ Retirer `report_content` (charger à la demande)
2. ✅ Utiliser `count: 'estimated'` au lieu de `'exact'`
3. ✅ Charger les counts au lieu des détails complets des relations

**Gain estimé**: -35% sur transfert (150ms → 100ms)

#### 4.4 Cache KPIs avec unstable_cache

```typescript
// src/lib/cache/tasks-kpis-cache.ts

import { unstable_cache } from 'next/cache';
import { getTaskKPIsOptimized } from '@/services/tasks/task-kpis-optimized';

export const getCachedTaskKPIs = unstable_cache(
  async (profileId: string | null) => {
    if (!profileId) return getEmptyKPIs();
    return await getTaskKPIsOptimized(profileId);
  },
  ['task-kpis'],
  {
    revalidate: 300, // 5 minutes
    tags: ['task-kpis']
  }
);
```

**Gain estimé**: Chargement instantané pour requêtes répétées (120ms → 10ms)

#### 4.5 Données Réelles pour les Graphiques

**Option A - Léger**: Garder `generateChartData` (données simulées)
- Avantage: Aucune requête supplémentaire
- Inconvénient: Pas de données réelles

**Option B - Précis**: Créer une fonction SQL pour les 7 derniers jours
```sql
CREATE OR REPLACE FUNCTION public.get_tasks_stats_7_days(
  p_profile_id UUID,
  p_start_date DATE
)
RETURNS TABLE (
  day_date DATE,
  todo_count BIGINT,
  completed_count BIGINT,
  overdue_count BIGINT,
  in_progress_count BIGINT
) AS $$
-- Similaire à get_activities_stats_7_days
-- ...
$$;
```

**Recommandation**: Option A pour l'instant (optimisation mineure vs complexité)

---

## 5. Résumé des Gains Estimés

| Optimisation | Gain | Effort | Priorité |
|--------------|------|--------|----------|
| **Index composites** | -45% (90ms) | Faible | 🚀 Haute |
| **Fonction SQL KPIs** | -87% (105ms) | Faible | 🚀 Haute |
| **count estimated + retrait colonnes** | -35% (50ms) | Faible | 🚀 Haute |
| **Cache KPIs (unstable_cache)** | -92% (110ms) | Faible | 🚀 Haute |
| **Graphiques réels 7 jours** | +40ms | Moyen | 💡 Bonus |

**Gain Total Combiné (Sans graphiques réels)**:
- Temps de chargement initial: **600ms → 240ms** (-60%)
- Chargement KPIs: **120ms → 10ms** (-92% avec cache)
- Chargement page suivante: **150ms → 75ms** (-50%)

**Comparaison avec /activités**:
- Moins de requêtes KPIs (8 vs 12) ✅
- Pas de graphiques 7 jours (économie de 28 requêtes) ✅
- Mais manque d'index sur colonnes critiques (assigned_to, due_date) ❌

---

## 6. Plan d'Implémentation Recommandé

### Phase 1: Quick Wins (1 jour)
1. ✅ Créer les index composites (migration SQL)
2. ✅ Implémenter `count: 'estimated'`
3. ✅ Retirer `report_content` de la liste
4. ✅ Ajouter cache avec `unstable_cache` pour KPIs

### Phase 2: Optimisations SQL (1 jour)
5. ✅ Créer fonction PostgreSQL `get_tasks_kpis`
6. ✅ Refactoriser `getTaskKPIs` pour utiliser la fonction
7. ✅ Ajouter tests unitaires

### Phase 3: Bonus (optionnel)
8. 💡 Créer `get_tasks_stats_7_days` pour données réelles
9. 💡 Monitorer avec Sentry Performance

---

## 7. Différences Clés avec /activités

### Avantages des Tâches:
✅ **Moins de KPIs** (8 vs 12 requêtes)
✅ **Graphiques simulés** (pas de 28 requêtes séquentielles)
✅ **Structure plus simple** (pas de participants)
✅ **Moins de relations N:M**

### Inconvénients des Tâches:
❌ **Pas d'index sur `assigned_to`** (colonne la plus utilisée)
❌ **Pas d'index sur `due_date`** (critique pour filtre overdue)
❌ **Pas d'index composite** `(assigned_to, status)`

### Recommandation:
**Appliquer les optimisations d'index en PRIORITÉ**, car l'impact sera immédiat et significatif (-45% sur toutes les requêtes).

---

## 8. Métriques à Suivre

### Avant Optimisation (Baseline)
- [ ] Time to First Byte (TTFB): ___ ms
- [ ] Largest Contentful Paint (LCP): ___ ms
- [ ] Requêtes Supabase par page load: ~12
- [ ] Temps total de chargement: ~600ms

### Après Optimisation (Cible)
- [ ] TTFB: <150ms (-40%)
- [ ] LCP: <800ms (-55%)
- [ ] Requêtes Supabase: ~3 (-75%)
- [ ] Temps total: <240ms (-60%)

---

## 9. Code Prêt à Implémenter

### Migration 1: Index Composites
Fichier: `supabase/migrations/2025-12-15-optimize-tasks-indexes.sql`
*(Voir section 4.1)*

### Migration 2: Fonction KPIs
Fichier: `supabase/migrations/2025-12-15-add-tasks-stats-function.sql`
*(Voir section 4.2)*

### Service Optimisé
Fichier: `src/services/tasks/task-kpis-optimized.ts`
```typescript
export async function getTaskKPIsOptimized(profileId: string | null) {
  if (!profileId) return getEmptyKPIs();

  const supabase = await createSupabaseServerClient();
  const startOfMonth = getStartOfMonth();
  const today = getTodayDate();

  // 1 seule requête au lieu de 8
  const { data, error } = await supabase.rpc('get_tasks_kpis', {
    p_profile_id: profileId,
    p_start_of_month: startOfMonth,
    p_today: today
  });

  // ... transformer et retourner
}
```

### Cache
Fichier: `src/lib/cache/tasks-kpis-cache.ts`
*(Voir section 4.4)*

---

**Prochaine Étape**: Créer les migrations et services optimisés pour /tâches.
