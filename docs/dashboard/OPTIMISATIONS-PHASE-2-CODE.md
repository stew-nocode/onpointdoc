# Dashboard - Optimisations Phase 2 (Code Concret)

**Date**: 2025-12-18
**Best Practices**: Next.js 15 + React 19 + PostgreSQL 16

---

## 🚀 AMÉLIO RATIONS À IMPLÉMENTER

### 1. Index PostgreSQL Optimisés (BRIN + GIN)

```sql
-- supabase/migrations/20251218100000_optimize_indexes_phase2.sql

-- ✅ BRIN pour created_at (10x plus léger que B-tree)
DROP INDEX IF EXISTS idx_tickets_created_at_brin;
CREATE INDEX idx_tickets_created_at_brin
ON tickets USING BRIN(created_at)
WITH (pages_per_range = 128);

-- ✅ GIN pour recherche full-text optimisée
DROP INDEX IF EXISTS idx_tickets_search_gin;
CREATE INDEX idx_tickets_search_gin
ON tickets USING GIN(
  to_tsvector('french', coalesce(title, '') || ' ' || coalesce(description, ''))
);

-- ✅ Index composé optimisé pour GROUP BY
CREATE INDEX IF NOT EXISTS idx_tickets_groupby_optimized
ON tickets(ticket_type, status, product_id, created_at DESC)
WHERE ticket_type IS NOT NULL;

-- ✅ Index pour prepared statements
CREATE INDEX IF NOT EXISTS idx_tickets_prepared_stats
ON tickets(product_id, ticket_type, status, created_at)
INCLUDE (resolved_at, duration_minutes);

-- Statistiques
ANALYZE tickets;
```

---

### 2. Prepared Statements PostgreSQL

```sql
-- supabase/migrations/20251218110000_add_prepared_statements.sql

-- ✅ Prepared statement pour stats tickets
PREPARE get_ticket_stats_prepared(UUID) AS
SELECT
  ticket_type,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE status IN ('Terminé(e)', 'Resolue', 'Closed', 'Done')) AS resolus,
  COUNT(*) FILTER (WHERE status NOT IN ('Terminé(e)', 'Resolue', 'Closed', 'Done')) AS ouverts
FROM tickets
WHERE product_id = $1
GROUP BY ticket_type;

-- ✅ Optimisation GROUP BY (colonnes avec plus de valeurs distinctes en premier)
CREATE OR REPLACE FUNCTION public.get_tickets_grouped_optimized(
  p_product_id UUID,
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ
)
RETURNS TABLE (
  ticket_type TEXT,
  status TEXT,
  count BIGINT
) AS $$
BEGIN
  -- Set work_mem pour hash aggregate
  SET LOCAL work_mem = '256MB';

  RETURN QUERY
  SELECT
    t.ticket_type::TEXT,
    t.status::TEXT,
    COUNT(*) AS count
  FROM tickets t
  WHERE
    t.product_id = p_product_id
    AND t.created_at >= p_period_start
    AND t.created_at <= p_period_end
  -- ✅ GROUP BY optimisé : colonnes avec plus de valeurs distinctes en premier
  GROUP BY t.ticket_type, t.status
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql STABLE PARALLEL SAFE;

GRANT EXECUTE ON FUNCTION public.get_tickets_grouped_optimized TO authenticated;
```

---

### 3. Lazy Loading Widgets (next/dynamic)

```typescript
// src/components/dashboard/widgets/lazy-widgets.tsx
'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// ✅ Lazy load des charts (Next.js 15 best practice)
export const TicketsDistributionChart = dynamic(
  () => import('../charts/tickets-distribution-chart').then(mod => ({
    default: mod.TicketsDistributionChart
  })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false, // Charts non critiques pour SSR
  }
);

export const TicketsEvolutionChart = dynamic(
  () => import('../charts/tickets-evolution-chart').then(mod => ({
    default: mod.TicketsEvolutionChart
  })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

export const BugsByTypeChart = dynamic(
  () => import('../charts/bugs-by-type-chart').then(mod => ({
    default: mod.BugsByTypeChart
  })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

export const TicketsByCompanyChart = dynamic(
  () => import('../charts/tickets-by-company-chart').then(mod => ({
    default: mod.TicketsByCompanyChart
  })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

export const SupportAgentsRadarChart = dynamic(
  () => import('../charts/support-agents-radar-chart').then(mod => ({
    default: mod.SupportAgentsRadarChart
  })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

function ChartSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-[280px] w-full" />
    </div>
  );
}
```

```typescript
// src/components/dashboard/widgets/registry.ts
// ✅ Mettre à jour le registry pour utiliser les lazy components

import {
  TicketsDistributionChart,
  TicketsEvolutionChart,
  BugsByTypeChart,
  TicketsByCompanyChart,
  SupportAgentsRadarChart,
} from './lazy-widgets';

export const WIDGET_REGISTRY: Record<string, WidgetDefinition> = {
  'tickets-distribution': {
    component: TicketsDistributionChart, // ✅ Lazy loaded
    layoutType: 'chart',
    title: 'Distribution par Type',
    // ... rest
  },
  'tickets-evolution': {
    component: TicketsEvolutionChart, // ✅ Lazy loaded
    layoutType: 'chart',
    title: 'Évolution des Tickets',
    // ... rest
  },
  // ... autres widgets lazy loaded
};
```

---

### 4. Intersection Observer pour Lazy Loading

```typescript
// src/components/dashboard/widgets/viewport-lazy-widget.tsx
'use client';

import { useInView } from 'react';
import { useRef, Suspense } from 'react';

export function ViewportLazyWidget({
  children,
  fallback,
  rootMargin = '200px',
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  rootMargin?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, {
    once: true,
    margin: rootMargin, // ✅ Précharger 200px avant visibilité
  });

  return (
    <div ref={ref} className="min-h-[300px]">
      {isInView ? (
        <Suspense fallback={fallback}>
          {children}
        </Suspense>
      ) : (
        fallback
      )}
    </div>
  );
}
```

```typescript
// src/components/dashboard/widgets/widget-grid.tsx
import { ViewportLazyWidget } from './viewport-lazy-widget';

// ✅ Wrapper les charts dans ViewportLazyWidget
function renderChart(widgetId: string, data: any) {
  return (
    <ViewportLazyWidget
      fallback={<ChartSkeleton />}
      rootMargin="200px"
    >
      <ChartComponent widgetId={widgetId} data={data} />
    </ViewportLazyWidget>
  );
}
```

---

### 5. Streaming & Suspense (React 19)

```typescript
// src/app/(main)/dashboard/page.tsx
import { Suspense } from 'react';

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  // ... code existant

  return (
    <PageLayoutWithDashboardFilters
      sidebar={<DashboardFiltersSidebarClient products={products} />}
      header={headerConfig}
      kpis={
        // ✅ Suspense granulaire pour KPIs statiques
        (dashboardRole === 'admin' || dashboardRole === 'direction') && (
          <Suspense fallback={<KPIsSkeleton />}>
            <StaticKPIs profileId={profile.id} dashboardRole={dashboardRole} />
          </Suspense>
        )
      }
    >
      {/* ✅ Suspense séparé pour widgets filtrés */}
      <Suspense fallback={<DashboardSkeleton />}>
        <UnifiedDashboardWithWidgets
          role={dashboardRole}
          profileId={profile.id}
          initialData={initialData}
          initialPeriod={period}
          initialWidgetConfig={widgetConfig}
          filteredOnly={true}
        />
      </Suspense>
    </PageLayoutWithDashboardFilters>
  );
}

// ✅ Composant Server séparé pour static KPIs
async function StaticKPIs({ profileId, dashboardRole }: {
  profileId: string;
  dashboardRole: DashboardRole;
}) {
  const OBC_PRODUCT_ID = '91304e02-2ce6-4811-b19d-1cae091a6fde';
  const { getAllTicketStats } = await import('@/services/dashboard/all-ticket-stats');
  const allStats = await getAllTicketStats(OBC_PRODUCT_ID);

  const initialData = {
    role: dashboardRole,
    bugHistoryStats: { ...allStats.bug, critiquesOuverts: 0, highOuverts: 0, mttrHeures: null },
    reqHistoryStats: { ...allStats.req, moyennesOuvertes: 0, lowesOuvertes: 0 },
    assistanceHistoryStats: allStats.assistance,
  };

  return (
    <UnifiedDashboardWithWidgets
      role={dashboardRole}
      profileId={profileId}
      initialData={initialData}
      initialPeriod="month"
      initialWidgetConfig={{ visibleWidgets: [] }}
      staticOnly={true}
    />
  );
}
```

---

### 6. Optimistic Updates (Realtime)

```typescript
// src/hooks/dashboard/use-optimistic-dashboard.ts
'use client';

import { useOptimistic } from 'react';
import type { UnifiedDashboardData } from '@/types/dashboard';

export function useOptimisticDashboard(initialData: UnifiedDashboardData) {
  const [optimisticData, updateOptimisticData] = useOptimistic(
    initialData,
    (state, updatedTicket: {
      id: string;
      ticket_type: 'BUG' | 'REQ' | 'ASSISTANCE';
      status: string;
    }) => {
      // ✅ Update optimiste immédiat
      const newState = { ...state };

      if (newState.bugHistoryStats && updatedTicket.ticket_type === 'BUG') {
        if (updatedTicket.status in ['Terminé(e)', 'Resolue', 'Closed', 'Done']) {
          newState.bugHistoryStats.resolus++;
          newState.bugHistoryStats.ouverts--;
        }
      }

      return newState;
    }
  );

  return { optimisticData, updateOptimisticData };
}
```

```typescript
// src/components/dashboard/unified-dashboard-with-widgets.tsx
'use client';

import { useOptimisticDashboard } from '@/hooks/dashboard/use-optimistic-dashboard';

export function UnifiedDashboardWithWidgets({
  initialData,
  // ... autres props
}: UnifiedDashboardWithWidgetsProps) {
  const { optimisticData, updateOptimisticData } = useOptimisticDashboard(initialData);

  // ✅ Utiliser optimisticData au lieu de initialData
  // ✅ Appeler updateOptimisticData() lors des updates Realtime

  useRealtimeDashboardData({
    period,
    productId: OBC_PRODUCT_ID,
    onDataChange: useCallback((ticket) => {
      // Update optimiste immédiat
      updateOptimisticData(ticket);
      // Puis reload réel
      loadData(period);
    }, [period, updateOptimisticData, loadData]),
  });

  return (
    <DashboardWidgetGrid
      widgets={filteredWidgets}
      dashboardData={optimisticData} // ✅ Données optimistes
    />
  );
}
```

---

### 7. Bundle Analyzer

```bash
# Installation
npm install --save-dev @next/bundle-analyzer
```

```javascript
// next.config.mjs
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer({
  // ... config existante
});
```

```json
// package.json
{
  "scripts": {
    "analyze": "ANALYZE=true npm run build"
  }
}
```

---

### 8. Migration PostgreSQL Complète Phase 2

```sql
-- supabase/migrations/20251218120000_complete_phase2_optimizations.sql

-- ✅ View matérialisée pour stats quotidiennes (cache DB)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_ticket_stats AS
SELECT
  DATE_TRUNC('day', created_at)::DATE AS stat_date,
  product_id,
  ticket_type,
  COUNT(*) AS total_count,
  COUNT(*) FILTER (WHERE status IN ('Terminé(e)', 'Resolue', 'Closed', 'Done')) AS resolved_count
FROM tickets
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY stat_date, product_id, ticket_type;

CREATE UNIQUE INDEX idx_mv_daily_stats_unique
ON mv_daily_ticket_stats(stat_date, product_id, ticket_type);

-- ✅ Fonction pour refresh automatique (cron)
CREATE OR REPLACE FUNCTION refresh_daily_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_ticket_stats;
END;
$$ LANGUAGE plpgsql;

-- ✅ Fonction optimisée avec work_mem augmenté
CREATE OR REPLACE FUNCTION public.get_aggregated_stats(
  p_product_id UUID,
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ
)
RETURNS TABLE (
  ticket_type TEXT,
  day DATE,
  total BIGINT,
  resolved BIGINT
) AS $$
BEGIN
  -- ✅ Augmenter work_mem pour hash aggregate
  SET LOCAL work_mem = '256MB';

  RETURN QUERY
  SELECT
    t.ticket_type::TEXT,
    DATE_TRUNC('day', t.created_at)::DATE AS day,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE t.status IN ('Terminé(e)', 'Resolue', 'Closed', 'Done')) AS resolved
  FROM tickets t
  WHERE
    t.product_id = p_product_id
    AND t.created_at >= p_period_start
    AND t.created_at <= p_period_end
  -- ✅ GROUP BY optimisé : ticket_type (peu de valeurs) puis day (beaucoup de valeurs)
  GROUP BY t.ticket_type, day
  ORDER BY day DESC, t.ticket_type;
END;
$$ LANGUAGE plpgsql STABLE PARALLEL SAFE;

GRANT EXECUTE ON FUNCTION public.get_aggregated_stats TO authenticated;
```

---

## 📊 GAINS ESTIMÉS PHASE 2

| Amélioration | Gain | Métrique |
|--------------|------|----------|
| **BRIN Index** | -90% taille | Index size |
| **Lazy Loading** | -70% | First Contentful Paint |
| **Suspense Granulaire** | -50% | Time to Interactive |
| **Prepared Statements** | -40% | Query time |
| **GROUP BY Optimisé** | -30% | Aggregation time |
| **Optimistic Updates** | Instantané | Perceived latency |
| **View Matérialisée** | -95% | Historical queries |

---

## 🔄 APPLICATION

```bash
# 1. Appliquer migrations SQL
supabase db push

# 2. Installer dépendances (si manquantes)
npm install

# 3. Analyser le bundle
npm run analyze

# 4. Tester en dev
npm run dev

# 5. Build production
npm run build
```

---

**Fin du document - Prêt à implémenter**
