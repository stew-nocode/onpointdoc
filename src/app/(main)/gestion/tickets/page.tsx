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
import { listCompanies } from '@/services/companies/server';
import { listActiveDepartments } from '@/services/departments/server';
import type { CreateTicketInput } from '@/lib/validators/ticket';
import { CreateTicketDialogLazy } from '@/components/tickets/create-ticket-dialog-lazy';
import { TicketsInfiniteScroll } from '@/components/tickets/tickets-infinite-scroll';
import { TicketsSearchBar } from '@/components/tickets/tickets-search-bar';
import { TicketsQuickFilters } from '@/components/tickets/tickets-quick-filters';
import { TicketsKPISectionLazy } from '@/components/tickets/tickets-kpi-section-lazy';
import { TicketsPageClientWrapper } from '@/components/tickets/tickets-page-client-wrapper';
import { getSupportTicketKPIs } from '@/services/tickets/support-kpis';
import type { QuickFilter } from '@/types/ticket-filters';
import { getCachedCurrentUserProfileId } from '@/lib/auth/cached-auth';
import { isApplicationError } from '@/lib/errors/types';
import { parseAdvancedFiltersFromParams } from '@/lib/validators/advanced-filters';
import { FiltersSidebarClientLazy } from '@/components/tickets/filters/filters-sidebar-client-lazy';
import { PageLayoutWithFilters } from '@/components/layout/page';
import { createTicketAction } from './actions';
import { getCachedSearchParams, stabilizeSearchParams } from '@/lib/utils/search-params';

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
 * ✅ PHASE 4 OPTIMISÉE (correction) :
 * - noStore() nécessaire car les tickets dépendent de cookies() (authentification)
 * - unstable_cache() ne peut pas être utilisé avec cookies() (limitation Next.js)
 * - Les tickets sont des données dynamiques dépendantes de l'utilisateur (RLS)
 * - revalidatePath() dans les Server Actions reste efficace pour les mises à jour
 * 
 * Principe Clean Code - Niveau Senior :
 * - noStore() utilisé seulement pour les tickets (données temps réel + dynamiques)
 * - Les optimisations des phases précédentes restent (Server Actions, searchParams)
 * - revalidatePath() assure la fraîcheur des données après modifications
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
  // ✅ noStore() nécessaire : tickets dépendent de cookies() (authentification)
  // Impossible d'utiliser unstable_cache() avec cookies() selon Next.js
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

    const result = await listTicketsPaginated(
      normalizedType,
      normalizedStatus,
      0,
      25,
      searchParam,
      quickFilterParam,
      currentProfileId ?? undefined,
      sort.column,
      sort.direction,
      advancedFilters || undefined
    );
    
    return result;
  } catch (error) {
    // Logger l'erreur pour le débogage
    console.error('[ERROR] Erreur dans loadInitialTickets:', error);
    if (isApplicationError(error)) {
      console.error('[ERROR] Code:', error.code);
      console.error('[ERROR] StatusCode:', error.statusCode);
      console.error('[ERROR] Details:', error.details);
    }
    
    // Retourner un résultat vide en cas d'erreur pour éviter de casser la page
    return { tickets: [], hasMore: false, total: 0 };
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
    
    const [allModules, submodules, features, contacts, companies, allowedModules, departments] = await Promise.all([
      listModules(),
      listSubmodules(),
      listFeatures(),
      listBasicProfiles(),
      listCompanies(),
      listModulesForCurrentUser(),
      listActiveDepartments()
    ]);

    // Si l'utilisateur a des modules affectés, filtrer la liste
    const modules =
      allowedModules && allowedModules.length
        ? allModules.filter((m) => allowedModules.some((am) => am.id === m.id))
        : allModules;

    return { products, modules, submodules, features, contacts, companies, departments };
  } catch {
    return { products: [], modules: [], submodules: [], features: [], contacts: [], companies: [], departments: [] };
  }
}


/**
 * Page principale de gestion des tickets
 * 
 * Optimisations appliquées (Niveau Senior) :
 * - noStore() déplacé uniquement dans loadInitialTickets (données temps réel uniquement)
 * - cache() utilisé pour mémoriser la résolution des searchParams
 * - searchParams stabilisés pour éviter les recompilations inutiles
 * - Parallélisme optimisé pour les requêtes indépendantes
 */
export default async function TicketsPage({ searchParams }: TicketsPageProps) {
  // ✅ PHASE 3 : Utiliser cache() pour mémoriser la résolution des searchParams
  // Évite de résoudre plusieurs fois les mêmes params dans le même render tree
  const resolvedSearchParams = await getCachedSearchParams(searchParams);
  
  // Stabiliser et normaliser les searchParams pour une comparaison stable
  const stabilizedParams = await stabilizeSearchParams(resolvedSearchParams);
  
  // Extraire les paramètres avec types appropriés
  const quickFilter = stabilizedParams.quick as QuickFilter | undefined;
  const typeParam = stabilizedParams.type;
  const statusParam = stabilizedParams.status;
  const searchParam = stabilizedParams.search;
  const sortColumnParam = stabilizedParams.sortColumn;
  const sortDirectionParam = stabilizedParams.sortDirection;
  
  // Pour les paramètres de filtres avancés, on doit les extraire depuis l'URL directement
  // car Next.js 15 ne les expose pas comme arrays dans searchParams
  // On utilisera parseAdvancedFiltersFromParams côté client dans FiltersSidebarClient
  const advancedFilters = null; // Sera géré côté client via FiltersSidebarClient
  
  // Optimiser le parallélisme : démarrer toutes les requêtes en parallèle
  // Le profileId est nécessaire pour les KPIs et tickets, donc on l'attend d'abord
  // ✅ OPTIMISÉ : Utilise getCachedCurrentUserProfileId pour éviter le rate limit
  const [currentProfileId, productsData] = await Promise.all([
    getCachedCurrentUserProfileId(),
    loadProductsAndModules(), // Pas de dépendance, peut être en parallèle
  ]);

  // Ensuite, charger les tickets et KPIs en parallèle (dépendent de currentProfileId)
  try {
    const [initialTicketsData, kpis] = await Promise.all([
      loadInitialTickets(
        typeParam,
        statusParam,
        searchParam,
        quickFilter,
        currentProfileId,
        sortColumnParam,
        sortDirectionParam,
        null // TODO: Réintégrer les filtres avancés après repositionnement de la sidebar
      ),
      getSupportTicketKPIs(currentProfileId),
    ]);
    const { products, modules, submodules, features, contacts, companies, departments } = productsData;

    // ✅ Server Action extraite dans actions.ts pour éviter les recompilations
    // La fonction inline était recréée à chaque recompilation du Server Component

    return (
      <TicketsPageClientWrapper>
        <PageLayoutWithFilters
          sidebar={
            <FiltersSidebarClientLazy
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
                companies={companies}
                departments={departments}
                onSubmit={createTicketAction}
              />
            )
          }}
          kpis={<TicketsKPISectionLazy kpis={kpis} hasProfile={!!currentProfileId} />}
          card={{
            title: 'Tickets récents',
            titleSuffix:
              initialTicketsData.total > 0
                ? `(${initialTicketsData.total} au total)`
                : undefined,
            search: <TicketsSearchBar initialSearch={searchParam} />,
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
            type={typeParam}
            status={statusParam}
            search={searchParam}
            quickFilter={quickFilter}
            currentProfileId={currentProfileId ?? undefined}
          />
        </PageLayoutWithFilters>
      </TicketsPageClientWrapper>
    );
  } catch (error: unknown) {
    console.error('Erreur lors du chargement de la page des tickets:', error);
    
    // Extraire le message d'erreur selon le type
    let errorMessage = 'Une erreur est survenue lors du chargement des tickets. Veuillez réessayer.';
    if (isApplicationError(error)) {
      errorMessage = error.message;
      console.error('[ERROR] Code:', error.code);
      console.error('[ERROR] StatusCode:', error.statusCode);
      if (error.details) {
        console.error('[ERROR] Details:', error.details);
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-status-danger bg-status-danger/10 p-4 text-status-danger">
          <p className="font-semibold">Erreur lors du chargement</p>
          <p className="text-sm">{errorMessage}</p>
          {isApplicationError(error) && error.details && (
            <p className="mt-2 text-xs opacity-75">
              Code: {error.code} | Status: {error.statusCode}
            </p>
          )}
        </div>
      </div>
    );
  }
}

