# Analyse et Optimisations de Performance - Page /activités

**Date**: 2025-12-15
**Contexte**: Analyse approfondie de la page /activités avec MCP Context7 et Supabase MCP
**Objectif**: Identifier et proposer des optimisations pour améliorer la rapidité de chargement

---

## 1. État Actuel de l'Architecture

### Structure de la Page
- **Server Component**: `src/app/(main)/gestion/activites/page.tsx`
- **Service Principal**: `src/services/activities/index.ts`
- **Hook de Chargement**: `src/hooks/activities/use-activities-infinite-load.ts`
- **KPIs**: `src/services/activities/activity-kpis.ts`
- **API Route**: `src/app/api/activities/list/route.ts`

### Pattern Actuel (Correctement Implémenté)
✅ Utilisation de `noStore()` pour les données temps réel
✅ `getCachedCurrentUserProfileId()` pour éviter le rate limiting
✅ Parallélisation des requêtes indépendantes avec `Promise.all()`
✅ Lazy loading des KPIs avec `dynamic()` et `ssr: false`
✅ Hook de retry avec timeout pour la résilience réseau
✅ Pagination infinie avec fusion intelligente (évite doublons)

---

## 2. Analyse des Requêtes Supabase

### 2.1 Requête Principale (listActivitiesPaginated)

**Requête Actuelle**:
```typescript
.from('activities')
.select(`
  id, title, activity_type, planned_start, planned_end,
  location_mode, report_content, created_by, status,
  validated_by_manager, team_id, created_at, updated_at,
  created_user:profiles!activities_created_by_fkey(id, full_name),
  activity_participants(
    user_id, role, is_invited_external,
    user:profiles!activity_participants_user_id_fkey(id, full_name)
  ),
  ticket_activity_link(
    ticket:tickets!ticket_activity_link_ticket_id_fkey(
      id, title, ticket_type, status, jira_issue_key
    )
  )
`, { count: 'exact' })
```

**Problèmes Identifiés**:

#### 🔴 CRITIQUE: N+1 Queries Potentielles
- **activity_participants**: Chaque activité peut avoir plusieurs participants → JOIN multiple
- **ticket_activity_link**: Chaque activité peut avoir plusieurs tickets liés → JOIN multiple
- Ces relations sont chargées pour TOUTES les activités, même si non affichées

**Impact**: Pour 25 activités avec en moyenne 3 participants et 2 tickets chacune:
- 25 activités + 75 participants + 50 tickets = **150 lignes à joindre et transformer**
- Temps estimé: 200-500ms par requête

#### 🟡 MOYEN: Count Exact Coûteux
```typescript
{ count: 'exact' }
```
- Force PostgreSQL à compter TOUTES les lignes avant de retourner les résultats
- Pour une table avec 10,000+ activités: **+50-150ms**

#### 🟡 MOYEN: Colonnes Inutilisées
- `report_content` est chargé mais rarement affiché dans la liste (seulement en détail)
- `location_mode` idem
- **Impact**: +30-50ms de transfert réseau

### 2.2 Requêtes KPIs (getActivityKPIs)

**12 Requêtes en Parallèle**:
1. Activités planifiées ce mois (count)
2. Activités planifiées mois dernier (count)
3. Activités terminées ce mois (count)
4. Activités terminées mois dernier (count)
5. Activités à venir cette semaine (count + participants)
6. Activités à venir semaine dernière (count + participants)
7. Activités en cours aujourd'hui (count + participants)
8. Activités en cours hier (count + participants)
9-12. 4 requêtes pour données des 7 derniers jours (7 counts chacune = **28 counts**)

**Problèmes**:

#### 🔴 CRITIQUE: 40+ Requêtes Séquentielles pour les Graphiques
```typescript
// Pour CHAQUE jour des 7 derniers jours (ligne 475-495)
for (let i = 6; i >= 0; i--) {
  const { count } = await supabase
    .from('activities')
    .select('*', { count: 'exact', head: true })
    .eq('created_by', profileId)
    .eq('status', 'Planifie')
    .gte('created_at', startOfDay.toISOString())
    .lte('created_at', endOfDay.toISOString());
  data.push(count || 0);
}
```

**Impact Total**: 4 graphiques × 7 jours = **28 requêtes COUNT séquentielles**
**Temps estimé**: 28 × 20ms = **560ms minimum** juste pour les graphiques

#### 🟡 MOYEN: Requêtes Participants Dupliquées
- `getUpcomingActivitiesThisWeek` et `getUpcomingActivitiesLastWeek` requêtent les mêmes participants
- Idem pour `getMyInProgressActivitiesToday` et `getMyInProgressActivitiesYesterday`
- **4 requêtes de participants** qui pourraient être 1 seule

### 2.3 Index Disponibles

**Index Existants** (identifiés dans les migrations):
```sql
CREATE INDEX idx_activities_created_by ON activities(created_by);
CREATE INDEX idx_activities_team_id ON activities(team_id);
```

**Index Manquants** (critique):
- ❌ `status` - utilisé dans TOUS les filtres KPIs
- ❌ `created_at` - utilisé pour tri et filtres temporels
- ❌ `planned_start` - utilisé pour activités à venir
- ❌ Composite `(created_by, status, created_at)` - combinaison très fréquente
- ❌ `activity_participants(user_id)` - utilisé dans les KPIs

**Impact**: Full table scans sur les filtres → **×3-5 plus lent**

---

## 3. Analyse des Composants Client

### 3.1 ActivitiesInfiniteScroll
✅ Utilise `useStableSearchParams` pour éviter re-renders
✅ Refs pour optimiser les performances (`activitiesLengthRef`, `hasMoreRef`)
✅ `useLayoutEffect` pour restauration du scroll
✅ `flushSync` pour mises à jour synchrones

### 3.2 ActivitiesKPISectionLazy
✅ Lazy loading avec `dynamic()`
✅ `ssr: false` approprié (données utilisateur)
✅ Loader squelette pendant le chargement

**Problème Potentiel**:
- Les KPIs sont chargés APRÈS le chargement initial de la page
- L'utilisateur voit d'abord les loaders, puis les données → **Perceived Performance**

---

## 4. Propositions d'Optimisations

### 🚀 PRIORITÉ HAUTE

#### 4.1 Créer des Index Composites
```sql
-- Migration: 2025-12-15-optimize-activities-indexes.sql

-- Index pour la liste paginée (order by created_at DESC)
CREATE INDEX idx_activities_created_at_desc
ON activities(created_at DESC);

-- Index pour filtres par statut
CREATE INDEX idx_activities_status
ON activities(status);

-- Index composite pour "mes activités planifiées ce mois"
CREATE INDEX idx_activities_created_by_status_created_at
ON activities(created_by, status, created_at DESC);

-- Index pour activités à venir
CREATE INDEX idx_activities_planned_start
ON activities(planned_start)
WHERE planned_start IS NOT NULL;

-- Index sur activity_participants pour KPIs
CREATE INDEX idx_activity_participants_user_id
ON activity_participants(user_id);

-- Index pour recherche textuelle
CREATE INDEX idx_activities_title_gin
ON activities USING gin(to_tsvector('french', title));
```

**Gain estimé**: -40% sur les requêtes filtrées (200ms → 120ms)

#### 4.2 Optimiser les Requêtes KPIs avec Agrégation SQL

**Problème**: 28 requêtes COUNT séquentielles pour les graphiques
**Solution**: 1 seule requête avec GROUP BY

```typescript
// Nouveau service: src/services/activities/activity-kpis-optimized.ts

/**
 * Récupère toutes les données des 7 derniers jours en 1 seule requête
 */
async function getAllActivitiesLast7DaysAggregated(
  supabase: SupabaseClient,
  profileId: string
): Promise<{
  plannedData: number[];
  completedData: number[];
  upcomingData: number[];
  inProgressData: number[];
}> {
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  // Requête SQL avec GROUP BY pour agréger par jour
  const { data, error } = await supabase.rpc('get_activities_stats_7_days', {
    p_profile_id: profileId,
    p_start_date: sevenDaysAgo.toISOString()
  });

  if (error) throw error;

  // Transformer les résultats en 4 tableaux de 7 valeurs
  // ... transformation ...

  return { plannedData, completedData, upcomingData, inProgressData };
}
```

**Fonction PostgreSQL à créer**:
```sql
-- Migration: 2025-12-15-add-activities-stats-function.sql

CREATE OR REPLACE FUNCTION get_activities_stats_7_days(
  p_profile_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
  day_date DATE,
  planned_count BIGINT,
  completed_count BIGINT,
  upcoming_count BIGINT,
  in_progress_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH days AS (
    SELECT generate_series(
      p_start_date::date,
      (p_start_date + interval '6 days')::date,
      interval '1 day'
    )::date AS day_date
  )
  SELECT
    d.day_date,
    COUNT(DISTINCT CASE
      WHEN a.created_by = p_profile_id
        AND a.status = 'Planifie'
        AND a.created_at::date = d.day_date
      THEN a.id
    END) AS planned_count,
    COUNT(DISTINCT CASE
      WHEN a.created_by = p_profile_id
        AND a.status = 'Termine'
        AND a.created_at::date = d.day_date
      THEN a.id
    END) AS completed_count,
    COUNT(DISTINCT CASE
      WHEN (a.created_by = p_profile_id OR ap.user_id = p_profile_id)
        AND a.status NOT IN ('Termine', 'Annule')
        AND a.planned_start IS NOT NULL
        AND a.planned_start::date = d.day_date
      THEN a.id
    END) AS upcoming_count,
    COUNT(DISTINCT CASE
      WHEN (a.created_by = p_profile_id OR ap.user_id = p_profile_id)
        AND a.status = 'En_cours'
        AND a.updated_at::date = d.day_date
      THEN a.id
    END) AS in_progress_count
  FROM days d
  LEFT JOIN activities a ON a.created_at >= p_start_date
  LEFT JOIN activity_participants ap ON ap.activity_id = a.id
  GROUP BY d.day_date
  ORDER BY d.day_date;
END;
$$ LANGUAGE plpgsql STABLE;
```

**Gain estimé**: 28 requêtes → **1 requête** = -95% de temps (560ms → 30ms)

#### 4.3 Alléger la Requête Principale - Colonnes Lazy

**Solution**: Charger `report_content` uniquement à la demande

```typescript
// listActivitiesPaginated - Version optimisée
.select(`
  id, title, activity_type, planned_start, planned_end,
  created_by, status, validated_by_manager, team_id,
  created_at, updated_at,
  created_user:profiles!activities_created_by_fkey(id, full_name),
  activity_participants!inner(count),
  ticket_activity_link!inner(count)
`, { count: 'estimated' }) // estimated au lieu de exact
```

**Changements**:
1. Retirer `report_content` et `location_mode` de la liste
2. Utiliser `count` agrégé au lieu de charger tous les détails
3. `count: 'estimated'` au lieu de `'exact'` (beaucoup plus rapide)

**Nouvelle API pour les détails**:
```typescript
// GET /api/activities/[id]/participants
// GET /api/activities/[id]/tickets
```

**Gain estimé**: -30% sur transfert (250ms → 175ms)

#### 4.4 Mettre les KPIs en Cache Côté Serveur

**Solution**: Cache Redis ou Upstash avec revalidation

```typescript
// src/lib/cache/activities-kpis-cache.ts
import { unstable_cache } from 'next/cache';

export const getCachedActivityKPIs = unstable_cache(
  async (profileId: string) => {
    return await getActivityKPIs(profileId);
  },
  ['activity-kpis'],
  {
    revalidate: 300, // 5 minutes
    tags: ['activity-kpis']
  }
);
```

**Revalidation**:
```typescript
// Dans createActivity, updateActivity
import { revalidateTag } from 'next/cache';

revalidateTag('activity-kpis');
```

**Gain estimé**: Chargement instantané pour requêtes répétées (600ms → 10ms)

### 🎯 PRIORITÉ MOYENNE

#### 4.5 Préchargement avec React Suspense

**Pattern**: Démarrer le chargement des KPIs en parallèle de la page

```typescript
// src/app/(main)/gestion/activites/page.tsx
import { Suspense } from 'react';

export default async function ActivitiesPage({ searchParams }: ActivitiesPageProps) {
  // Démarrer les requêtes en parallèle
  const [currentProfileId, participants] = await Promise.all([
    getCachedCurrentUserProfileId(),
    listBasicProfiles(),
  ]);

  // Précharger les KPIs (pas d'await)
  const kpisPromise = getActivityKPIs(currentProfileId);
  const activitiesPromise = loadInitialActivities(/*...*/);

  return (
    <PageLayoutWithFilters
      kpis={
        <Suspense fallback={<KPIsLoader />}>
          <ActivitiesKPISectionAsync kpisPromise={kpisPromise} />
        </Suspense>
      }
    >
      <Suspense fallback={<ActivitiesLoader />}>
        <ActivitiesInfiniteScrollAsync
          activitiesPromise={activitiesPromise}
          // ...
        />
      </Suspense>
    </PageLayoutWithFilters>
  );
}
```

**Gain**: Perceived performance +30% (utilisateur voit du contenu plus tôt)

#### 4.6 Optimiser les Quick Filters

**Problème**: Le filtre "mine" fait uniquement `created_by = profileId`
**Manque**: Les activités où l'utilisateur participe

**Solution**: Créer une vue matérialisée

```sql
-- Migration: 2025-12-15-add-my-activities-view.sql

CREATE MATERIALIZED VIEW my_activities AS
SELECT
  a.id,
  a.created_by,
  ARRAY_AGG(DISTINCT ap.user_id) AS participant_ids
FROM activities a
LEFT JOIN activity_participants ap ON ap.activity_id = a.id
GROUP BY a.id, a.created_by;

CREATE INDEX idx_my_activities_created_by
ON my_activities(created_by);

CREATE INDEX idx_my_activities_participant_ids
ON my_activities USING gin(participant_ids);

-- Rafraîchir toutes les heures
CREATE OR REPLACE FUNCTION refresh_my_activities()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY my_activities;
END;
$$ LANGUAGE plpgsql;
```

**Utilisation**:
```typescript
// Filtre "mine" optimisé
case 'mine':
  return query
    .in('id', supabase
      .from('my_activities')
      .select('id')
      .or(`created_by.eq.${profileId},participant_ids.cs.{${profileId}}`)
    );
```

**Gain estimé**: Filtre "mine" -60% plus rapide

### 💡 OPTIMISATIONS BONUS

#### 4.7 Virtual Scrolling pour Grandes Listes

**Bibliothèque**: `@tanstack/react-virtual`

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

export function ActivitiesInfiniteScroll({ ... }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: activities.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // hauteur estimée par ligne
    overscan: 5
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <ActivityRow
            key={activities[virtualRow.index].id}
            activity={activities[virtualRow.index]}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`
            }}
          />
        ))}
      </div>
    </div>
  );
}
```

**Gain**: Afficher 1000+ activités sans ralentissement (DOM réduit de 1000 → 20 éléments)

#### 4.8 Prefetch des Prochaines Pages

**Pattern**: Précharger la page suivante avant le clic

```typescript
export function LoadMoreButton({ onLoadMore, ... }) {
  const prefetchNextPage = useCallback(() => {
    // Précharger au survol
    onLoadMore();
  }, [onLoadMore]);

  return (
    <Button
      onClick={onLoadMore}
      onMouseEnter={prefetchNextPage} // Prefetch au survol
    >
      Voir plus
    </Button>
  );
}
```

**Gain**: Perceived performance +50% (page suivante instantanée)

---

## 5. Résumé des Gains Estimés

| Optimisation | Gain | Effort | Priorité |
|--------------|------|--------|----------|
| **Index composites** | -40% (200ms) | Faible | 🚀 Haute |
| **Fonction SQL agrégée pour KPIs** | -95% (530ms) | Moyen | 🚀 Haute |
| **Alléger colonnes + count estimated** | -30% (75ms) | Faible | 🚀 Haute |
| **Cache KPIs (unstable_cache)** | -98% (590ms) | Faible | 🚀 Haute |
| **React Suspense + Prefetch** | +30% UX | Moyen | 🎯 Moyenne |
| **Vue matérialisée "mine"** | -60% (filtres) | Moyen | 🎯 Moyenne |
| **Virtual Scrolling** | Scaling ∞ | Élevé | 💡 Bonus |
| **Prefetch pages** | +50% UX | Faible | 💡 Bonus |

**Gain Total Combiné (Priorité Haute)**:
- Temps de chargement initial: **1200ms → 400ms** (-67%)
- Chargement KPIs: **600ms → 10ms** (-98% avec cache)
- Chargement page suivante: **250ms → 100ms** (-60%)

---

## 6. Plan d'Implémentation Recommandé

### Phase 1: Quick Wins (1-2 jours)
1. ✅ Créer les index composites (migration SQL)
2. ✅ Implémenter `count: 'estimated'` au lieu de `'exact'`
3. ✅ Retirer `report_content` de la liste (charger à la demande)
4. ✅ Ajouter cache avec `unstable_cache` pour KPIs

**Test**: Mesurer avec Chrome DevTools Network + Performance

### Phase 2: Optimisations SQL (2-3 jours)
5. ✅ Créer fonction PostgreSQL `get_activities_stats_7_days`
6. ✅ Refactoriser `getActivityKPIs` pour utiliser la fonction
7. ✅ Ajouter tests unitaires pour la nouvelle fonction

**Test**: Comparer temps d'exécution avant/après avec EXPLAIN ANALYZE

### Phase 3: Améliorations UX (3-4 jours)
8. ✅ Implémenter React Suspense pour streaming
9. ✅ Créer vue matérialisée pour filtre "mine"
10. ✅ Ajouter prefetch au survol

**Test**: Lighthouse Performance Score (cible: 90+)

### Phase 4: Scaling (optionnel)
11. 💡 Évaluer Virtual Scrolling si >1000 activités
12. 💡 Monitorer avec Sentry Performance

---

## 7. Métriques à Suivre

### Avant Optimisation (Baseline)
- [ ] Time to First Byte (TTFB): ___ ms
- [ ] Largest Contentful Paint (LCP): ___ ms
- [ ] First Input Delay (FID): ___ ms
- [ ] Cumulative Layout Shift (CLS): ___
- [ ] Requêtes Supabase par page load: 40+
- [ ] Temps total de chargement: ~1200ms

### Après Optimisation (Cible)
- [ ] TTFB: <200ms (-50%)
- [ ] LCP: <1000ms (-60%)
- [ ] FID: <50ms
- [ ] CLS: <0.1
- [ ] Requêtes Supabase: ~5 (-87%)
- [ ] Temps total: <400ms (-67%)

---

## 8. Notes Complémentaires

### Comparaison avec la Page /tickets
La page /activités utilise des patterns similaires à /tickets, mais:
- ✅ Moins de données par activité (pas de commentaires inline)
- ✅ Moins de filtres complexes
- ❌ Plus de requêtes pour les KPIs (40 vs 12 pour tickets)
- ❌ Pas d'index optimisés pour les filtres temporels

### Considérations pour le Futur
- Envisager GraphQL avec DataLoader pour batch les relations
- Implémenter CDC (Change Data Capture) pour invalidation cache temps réel
- Ajouter Service Worker pour cache offline

---

**Prochaine Étape**: Valider les optimisations proposées avec l'équipe et prioriser l'implémentation.
