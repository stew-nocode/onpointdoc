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
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { CreateTicketDialog } from '@/components/tickets/create-ticket-dialog';
import { TicketsInfiniteScroll } from '@/components/tickets/tickets-infinite-scroll';
import { TicketsSearchBar } from '@/components/tickets/tickets-search-bar';
import { TicketsQuickFilters } from '@/components/tickets/tickets-quick-filters';
import type { QuickFilter } from '@/types/ticket-filters';
import { createSupabaseServerClient } from '@/lib/supabase/server';

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
  sortDirectionParam?: string
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
      sort.direction
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
  const currentProfileIdPromise = getCurrentUserProfileId();
  const productsPromise = loadProductsAndModules();
  const currentProfileId = await currentProfileIdPromise;
  const initialTicketsPromise = loadInitialTickets(
    resolvedSearchParams?.type,
    resolvedSearchParams?.status,
    resolvedSearchParams?.search,
    quickFilter,
    currentProfileId
  );
  
  try {
    const [initialTicketsData, productsData] = await Promise.all([initialTicketsPromise, productsPromise]);
    const { products, modules, submodules, features, contacts } = productsData;

    async function handleTicketSubmit(values: CreateTicketInput) {
      'use server';
      const created = await createTicket(values);
      return created?.id as string;
    }

    return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Tickets
          </p>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Gestion des tickets Support
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Cycle de vie : Nouveau → En cours → Transféré → Résolu
          </p>
        </div>
        <CreateTicketDialog
          products={products}
          modules={modules}
          submodules={submodules}
          features={features}
          contacts={contacts}
          onSubmit={handleTicketSubmit}
        />
      </div>

        <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>
              Tickets récents
              {initialTicketsData.total > 0 && (
                <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
                  ({initialTicketsData.total} au total)
                </span>
              )}
            </CardTitle>
            <TicketsSearchBar initialSearch={resolvedSearchParams?.search} />
          </div>
        </CardHeader>
          <div className="px-6 pb-4">
            <TicketsQuickFilters activeFilter={quickFilter} currentProfileId={currentProfileId} />
          </div>
        <CardContent className="overflow-x-auto">
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
        </CardContent>
      </Card>
    </div>
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

