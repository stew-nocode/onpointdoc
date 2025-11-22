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
import { CreateTicketDialogLazy } from '@/components/tickets/create-ticket-dialog-lazy';
import { TicketsInfiniteScroll } from '@/components/tickets/tickets-infinite-scroll';
import { TicketsSearchBar } from '@/components/tickets/tickets-search-bar';
import { TicketsQuickFilters } from '@/components/tickets/tickets-quick-filters';
import { TicketsKPISection } from '@/components/tickets/tickets-kpi-section';
import { getSupportTicketKPIs } from '@/services/tickets/support-kpis';
import type { QuickFilter } from '@/types/ticket-filters';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { parseAdvancedFiltersFromParams } from '@/lib/validators/advanced-filters';
import { FiltersSidebarClient } from '@/components/tickets/filters/filters-sidebar-client';
import { PageLayoutWithFilters } from '@/components/layout/page';

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

async function loadProductsAndModules() {
  noStore();
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

export default async function TicketsPage({ searchParams }: TicketsPageProps) {
  noStore(); // S'assurer que la page n'est pas mise en cache
  
  // Résoudre la Promise searchParams pour Next.js 15
  const resolvedSearchParams = await searchParams;
  const quickFilter = resolvedSearchParams?.quick as QuickFilter | undefined;
  
  // Parser les filtres avancés depuis les URL params
  // Next.js 15 retourne les searchParams comme un objet, mais pour les valeurs multiples,
  // il faut les extraire manuellement depuis l'URL
  const allParams: Record<string, string | string[] | undefined> = {};
  
  // Pour les paramètres simples, utiliser directement
  if (resolvedSearchParams?.type) allParams.type = resolvedSearchParams.type;
  if (resolvedSearchParams?.status) allParams.status = resolvedSearchParams.status;
  if (resolvedSearchParams?.search) allParams.search = resolvedSearchParams.search;
  if (resolvedSearchParams?.quick) allParams.quick = resolvedSearchParams.quick;
  
  // Pour les paramètres de filtres avancés, on doit les extraire depuis l'URL directement
  // car Next.js 15 ne les expose pas comme arrays dans searchParams
  // On utilisera parseAdvancedFiltersFromParams côté client dans FiltersSidebarClient
  const advancedFilters = null; // Sera géré côté client via FiltersSidebarClient
  
  const currentProfileIdPromise = getCurrentUserProfileId();
  const productsPromise = loadProductsAndModules();
  const currentProfileId = await currentProfileIdPromise;
  const kpisPromise = getSupportTicketKPIs(currentProfileId);
  const initialTicketsPromise = loadInitialTickets(
    resolvedSearchParams?.type,
    resolvedSearchParams?.status,
    resolvedSearchParams?.search,
    quickFilter,
    currentProfileId,
    resolvedSearchParams?.sortColumn,
    resolvedSearchParams?.sortDirection,
    null // TODO: Réintégrer les filtres avancés après repositionnement de la sidebar
  );
  
  try {
    const [initialTicketsData, productsData, kpis] = await Promise.all([
      initialTicketsPromise,
      productsPromise,
      kpisPromise
    ]);
    const { products, modules, submodules, features, contacts } = productsData;

    async function handleTicketSubmit(values: CreateTicketInput) {
      'use server';
      const created = await createTicket(values);
      return created?.id as string;
    }

    return (
      <PageLayoutWithFilters
        sidebar={
          <FiltersSidebarClient
            users={contacts}
            products={products}
            modules={modules}
          />
        }
        header={{
          label: 'Tickets',
          title: 'Gestion des tickets Support',
          description: 'Cycle de vie : Nouveau → En cours → Transféré → Résolu',
          action: (
            <CreateTicketDialogLazy
              products={products}
              modules={modules}
              submodules={submodules}
              features={features}
              contacts={contacts}
              onSubmit={handleTicketSubmit}
            />
          )
        }}
        kpis={<TicketsKPISection kpis={kpis} hasProfile={!!currentProfileId} />}
        card={{
          title: 'Tickets récents',
          titleSuffix:
            initialTicketsData.total > 0
              ? `(${initialTicketsData.total} au total)`
              : undefined,
          search: <TicketsSearchBar initialSearch={resolvedSearchParams?.search} />,
          quickFilters: (
            <TicketsQuickFilters
              activeFilter={quickFilter}
              currentProfileId={currentProfileId}
            />
          )
        }}
      >
        <TicketsInfiniteScroll
          initialTickets={initialTicketsData.tickets}
          initialHasMore={initialTicketsData.hasMore}
          initialTotal={initialTicketsData.total}
          type={resolvedSearchParams?.type}
          status={resolvedSearchParams?.status}
          search={resolvedSearchParams?.search}
          quickFilter={quickFilter}
          currentProfileId={currentProfileId ?? undefined}
        />
      </PageLayoutWithFilters>
    );
  } catch (error: any) {
    console.error('Erreur lors du chargement de la page des tickets:', error);
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-status-danger bg-status-danger/10 p-4 text-status-danger">
          <p className="font-semibold">Erreur lors du chargement</p>
          <p className="text-sm">
            {error?.message || 'Une erreur est survenue lors du chargement des tickets. Veuillez réessayer.'}
          </p>
        </div>
      </div>
    );
  }
}

