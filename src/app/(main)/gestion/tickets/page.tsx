import { unstable_noStore as noStore } from 'next/cache';
import { createTicket, listTicketsPaginated } from '@/services/tickets';
import type { TicketsPaginatedResult } from '@/types/ticket-with-relations';
import {
  listProducts,
  listModules,
  listSubmodules,
  listFeatures,
  listModulesForCurrentUser,
  listProductsForCurrentUserDepartment
} from '@/services/products';
import { listBasicProfiles } from '@/services/users/server';
import type { CreateTicketInput } from '@/lib/validators/ticket';
import { Suspense } from 'react';
import { Button } from '@/ui/button';
import { CreateTicketDialogLazy } from '@/components/tickets/create-ticket-dialog-lazy';
import { TicketsInfiniteScroll } from '@/components/tickets/tickets-infinite-scroll';
import { TicketsSearchBar } from '@/components/tickets/tickets-search-bar';
import { TicketsQuickFilters } from '@/components/tickets/tickets-quick-filters';
import { TicketsKPISectionLazy } from '@/components/tickets/tickets-kpi-section-lazy';
import { TicketsPageClientWrapper } from '@/components/tickets/tickets-page-client-wrapper';
import { getSupportTicketKPIs } from '@/services/tickets/support-kpis';
import type { QuickFilter } from '@/types/ticket-filters';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { parseAdvancedFiltersFromParams } from '@/lib/validators/advanced-filters';
import { FiltersSidebarClientLazy } from '@/components/tickets/filters/filters-sidebar-client-lazy';
import { PageLayoutWithFilters } from '@/components/layout/page';
import { FiltersSidebarSkeleton } from '@/components/tickets/skeletons/filters-sidebar-skeleton';
import { TicketsListSkeleton } from '@/components/tickets/skeletons/tickets-list-skeleton';
import { TicketsKPIsSkeleton } from '@/components/tickets/skeletons/tickets-kpis-skeleton';

type TicketsPageProps = {
  searchParams?: Promise<{
    type?: string;
    status?: string;
    search?: string;
    quick?: QuickFilter;
    sortColumn?: string;
    sortDirection?: string;
  }>;
};

/**
 * Charge les tickets initiaux pour la page
 * 
 * Optimisé : noStore() seulement ici pour éviter le cache des tickets (données temps réel)
 */
async function loadInitialTickets(
  typeParam?: string,
  statusParam?: string,
  searchParam?: string,
  quickFilterParam?: QuickFilter,
  currentProfileId?: string | null,
  sortColumnParam?: string,
  sortDirectionParam?: string,
  advancedFilters?: ReturnType<typeof parseAdvancedFiltersFromParams>
): Promise<TicketsPaginatedResult> {
  // noStore() uniquement pour les tickets (données temps réel)
  noStore();
  try {
    const normalizedType =
      typeParam === 'BUG' || typeParam === 'REQ' || typeParam === 'ASSISTANCE'
        ? typeParam
        : undefined;

    // Accepter tous les statuts (JIRA ou locaux) comme filtre valide
    const normalizedStatus = statusParam || undefined;

    // Parser les paramètres de tri
    const { parseTicketSort } = await import('@/types/ticket-sort');
    const sort = parseTicketSort(sortColumnParam, sortDirectionParam);

    return await listTicketsPaginated(
      normalizedType,
      normalizedStatus,
      0,
      25,
      searchParam,
      quickFilterParam,
      currentProfileId,
      sort.column,
      sort.direction,
      advancedFilters || undefined
    );
  } catch {
    return { tickets: [], hasMore: false, total: 0 };
  }
}

async function getCurrentUserProfileId() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_uid', user.id)
      .single();

    return profile?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Charge les produits et modules pour les formulaires
 * 
 * Optimisé : noStore() supprimé pour permettre le cache (données qui changent peu)
 * Les produits/modules peuvent être mis en cache par Next.js pour améliorer le TTFB
 */
async function loadProductsAndModules() {
  // noStore() supprimé : ces données changent peu et peuvent être cachées
  // Améliore le TTFB en permettant le cache Next.js
  try {
    // Récupérer les produits accessibles au département de l'utilisateur
    const departmentProducts = await listProductsForCurrentUserDepartment();
    
    // Si aucun produit n'est lié au département, utiliser tous les produits (fallback)
    const products = departmentProducts.length > 0 ? departmentProducts : await listProducts();
    
    const [allModules, submodules, features, contacts, allowedModules] = await Promise.all([
      listModules(),
      listSubmodules(),
      listFeatures(),
      listBasicProfiles(),
      listModulesForCurrentUser()
    ]);

    // Si l'utilisateur a des modules affectés, filtrer la liste
    const modules =
      allowedModules && allowedModules.length
        ? allModules.filter((m) => allowedModules.some((am) => am.id === m.id))
        : allModules;

    return { products, modules, submodules, features, contacts };
  } catch {
    return { products: [], modules: [], submodules: [], features: [], contacts: [] };
  }
}

/**
 * Page principale de gestion des tickets
 * 
 * Optimisé : noStore() déplacé uniquement dans loadInitialTickets
 * pour permettre le cache des données statiques (produits, modules)
 */
export default async function TicketsPage({ searchParams }: TicketsPageProps) {
  const resolvedSearchParams = await searchParams;
  const quickFilter = resolvedSearchParams?.quick as QuickFilter | undefined;

  // TODO: Les filtres avancés seront réintégrés via la sidebar (côté client)
  const advancedFilters = null;

  const filtersDataPromise = loadProductsAndModules();
  const currentProfileId = await getCurrentUserProfileId();

  const ticketsPromise = loadInitialTickets(
    resolvedSearchParams?.type,
    resolvedSearchParams?.status,
    resolvedSearchParams?.search,
    quickFilter,
    currentProfileId,
    resolvedSearchParams?.sortColumn,
    resolvedSearchParams?.sortDirection,
    advancedFilters
  );

  const kpisPromise = getSupportTicketKPIs(currentProfileId).catch(() => null);

  async function handleTicketSubmit(values: CreateTicketInput) {
    'use server';
    const created = await createTicket(values);
    return created?.id as string;
  }

  return (
    <TicketsPageClientWrapper>
      <PageLayoutWithFilters
        sidebar={
          <Suspense fallback={<FiltersSidebarSkeleton />}>
            {/* @ts-expect-error Async Server Component */}
            <TicketsFiltersSidebar dataPromise={filtersDataPromise} />
          </Suspense>
        }
        header={{
          label: 'Tickets',
          title: 'Gestion des tickets Support',
          description: 'Cycle de vie : Nouveau → En cours → Transféré → Résolu',
          action: (
            <Suspense fallback={<Button size="sm" variant="default" disabled>Préparation…</Button>}>
              {/* @ts-expect-error Async Server Component */}
              <CreateTicketAction dataPromise={filtersDataPromise} onSubmit={handleTicketSubmit} />
            </Suspense>
          )
        }}
        kpis={
          <Suspense fallback={<TicketsKPIsSkeleton />}>
            {/* @ts-expect-error Async Server Component */}
            <TicketsKPIsSection promise={kpisPromise} hasProfile={!!currentProfileId} />
          </Suspense>
        }
        card={{
          title: 'Tickets récents',
          titleSuffix: (
            <Suspense fallback={<span className="text-sm text-slate-500">(chargement…)</span>}>
              {/* @ts-expect-error Async Server Component */}
              <TicketsTotalCount promise={ticketsPromise} />
            </Suspense>
          ),
          search: <TicketsSearchBar initialSearch={resolvedSearchParams?.search} />,
          quickFilters: (
            <TicketsQuickFilters activeFilter={quickFilter} currentProfileId={currentProfileId} />
          )
        }}
      >
        <Suspense fallback={<TicketsListSkeleton />}>
          {/* @ts-expect-error Async Server Component */}
          <TicketsListSection
            promise={ticketsPromise}
            type={resolvedSearchParams?.type}
            status={resolvedSearchParams?.status}
            search={resolvedSearchParams?.search}
            quickFilter={quickFilter}
            currentProfileId={currentProfileId ?? undefined}
          />
        </Suspense>
      </PageLayoutWithFilters>
    </TicketsPageClientWrapper>
  );
}

type ProductsModulesData = Awaited<ReturnType<typeof loadProductsAndModules>>;
type KPIsData = Awaited<ReturnType<typeof getSupportTicketKPIs>>;

async function TicketsFiltersSidebar({ dataPromise }: { dataPromise: Promise<ProductsModulesData> }) {
  const { products, modules, contacts } = await dataPromise;
  return <FiltersSidebarClientLazy users={contacts} products={products} modules={modules} />;
}

async function CreateTicketAction({
  dataPromise,
  onSubmit
}: {
  dataPromise: Promise<ProductsModulesData>;
  onSubmit: (values: CreateTicketInput) => Promise<string | undefined>;
}) {
  const { products, modules, submodules, features, contacts } = await dataPromise;
  return (
    <CreateTicketDialogLazy
      products={products}
      modules={modules}
      submodules={submodules}
      features={features}
      contacts={contacts}
      onSubmit={onSubmit}
    />
  );
}

async function TicketsKPIsSection({
  promise,
  hasProfile
}: {
  promise: Promise<KPIsData | null>;
  hasProfile: boolean;
}) {
  const kpis = await promise;
  if (!kpis) {
    return null;
  }

  return <TicketsKPISectionLazy kpis={kpis} hasProfile={hasProfile} />;
}

async function TicketsTotalCount({ promise }: { promise: Promise<TicketsPaginatedResult> }) {
  const data = await promise;
  if (!data.total) {
    return null;
  }

  return <span>{`(${data.total} au total)`}</span>;
}

async function TicketsListSection({
  promise,
  type,
  status,
  search,
  quickFilter,
  currentProfileId
}: {
  promise: Promise<TicketsPaginatedResult>;
  type?: string;
  status?: string;
  search?: string;
  quickFilter?: QuickFilter;
  currentProfileId?: string;
}) {
  const data = await promise;
  return (
    <TicketsInfiniteScroll
      initialTickets={data.tickets}
      initialHasMore={data.hasMore}
      initialTotal={data.total}
      type={type}
      status={status}
      search={search}
      quickFilter={quickFilter}
      currentProfileId={currentProfileId}
    />
  );
}

