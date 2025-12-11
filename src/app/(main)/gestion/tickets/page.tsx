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
import { listBasicProfiles, listSupportAgents } from '@/services/users/server';
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
import { getCachedCurrentUserProfileId, getCachedCurrentUserRole, getCachedIsSupportAgent } from '@/lib/auth/cached-auth';
import { AgentSelector } from '@/components/tickets/agent-selector';
import { CompanySelector } from '@/components/tickets/company-selector';
import { isApplicationError } from '@/lib/errors/types';
import { parseAdvancedFiltersFromParams } from '@/lib/validators/advanced-filters';
import { getTicketViewRole, TICKET_VIEW_CONFIGS } from '@/types/ticket-view-config';
import { FiltersSidebarClientLazy } from '@/components/tickets/filters/filters-sidebar-client-lazy';
import { PageLayoutWithFilters } from '@/components/layout/page';
import { createTicketAction } from './actions';
import { getCachedSearchParams, stabilizeSearchParams } from '@/lib/utils/search-params';
import { Alert, AlertDescription, AlertTitle } from '@/ui/alert';
import { AlertCircle } from 'lucide-react';

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
 * - Gestion d'erreur améliorée : propage l'erreur au lieu de retourner un résultat vide
 * 
 * @throws ApplicationError si une erreur survient lors du chargement
 */
async function loadInitialTickets(
  typeParam?: string,
  statusParam?: string,
  searchParam?: string,
  quickFilterParam?: QuickFilter,
  currentProfileId?: string | null,
  sortColumnParam?: string,
  sortDirectionParam?: string,
  advancedFilters?: ReturnType<typeof parseAdvancedFiltersFromParams>,
  agentParam?: string, // ✅ Nouveau paramètre : ID de l'agent pour filtrer par agent support
  companyParam?: string // ✅ Nouveau paramètre : ID de l'entreprise pour filtrer par entreprise
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
      advancedFilters || undefined,
      agentParam, // ✅ Passer le paramètre agent pour le filtrage
      companyParam // ✅ Passer le paramètre company pour le filtrage
    );
    
    return result;
  } catch (error) {
    // Logger l'erreur pour le débogage
    console.error('[ERROR] Erreur dans loadInitialTickets:', error);
    
    // Normaliser l'erreur en ApplicationError si ce n'est pas déjà le cas
    const { normalizeError, createError } = await import('@/lib/errors/types');
    const normalizedError = isApplicationError(error) 
      ? error 
      : normalizeError(error);
    
    // Logger les détails supplémentaires si c'est une ApplicationError
    if (isApplicationError(normalizedError)) {
      console.error('[ERROR] Code:', normalizedError.code);
      console.error('[ERROR] StatusCode:', normalizedError.statusCode);
      if (normalizedError.details) {
        console.error('[ERROR] Details:', normalizedError.details);
      }
    }
    
    // Propager l'erreur pour qu'elle soit gérée par le composant parent
    // Cela permet d'afficher un message d'erreur à l'utilisateur
    throw normalizedError;
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
  // ✅ NOUVEAU : Si aucun filtre rapide n'est dans l'URL, utiliser 'all' par défaut
  const quickFilter = (stabilizedParams.quick as QuickFilter | undefined) || 'all';
  const typeParam = stabilizedParams.type;
  const statusParam = stabilizedParams.status;
  const searchParam = stabilizedParams.search;
  const sortColumnParam = stabilizedParams.sortColumn;
  const sortDirectionParam = stabilizedParams.sortDirection;
  const agentParam = stabilizedParams.agent as string | undefined; // Paramètre agent pour les managers
  const companyParam = stabilizedParams.company as string | undefined; // ✅ Paramètre company pour filtrer par entreprise
  
  // Parser les filtres avancés depuis les searchParams
  // Next.js 15 expose les paramètres multiples comme arrays dans searchParams
  const advancedFilters = parseAdvancedFiltersFromParams(resolvedSearchParams);
  
  // Optimiser le parallélisme : démarrer toutes les requêtes en parallèle
  // Le profileId et le rôle sont nécessaires pour les KPIs, tickets et configuration
  // ✅ OPTIMISÉ : Utilise getCachedCurrentUserProfileId et getCachedCurrentUserRole pour éviter le rate limit
  const [currentProfileId, userRole, isSupportAgent, productsData] = await Promise.all([
    getCachedCurrentUserProfileId(),
    getCachedCurrentUserRole(),
    getCachedIsSupportAgent(), // Vérifier si l'utilisateur est un agent support
    loadProductsAndModules(), // Pas de dépendance, peut être en parallèle
  ]);

  // Déterminer le rôle de vue et récupérer la configuration
  const viewRole = getTicketViewRole(userRole);
  const viewConfig = TICKET_VIEW_CONFIGS[viewRole];
  
  // ✅ Adapter les filtres disponibles : "mine" uniquement pour les agents support
  const availableQuickFilters = isSupportAgent 
    ? viewConfig.availableQuickFilters 
    : viewConfig.availableQuickFilters.filter(filter => filter !== 'mine');

  // Charger les agents support pour les managers, admins et agents support
  const supportAgents = (viewRole === 'manager' || viewRole === 'admin' || viewRole === 'agent')
    ? await listSupportAgents() 
    : [];
  
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
        advancedFilters,
        agentParam, // ✅ Passer le paramètre agent pour le filtrage
        companyParam // ✅ Passer le paramètre company pour le filtrage
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
            // ✅ Afficher la sidebar seulement si configuré (masquée pour agents)
            viewConfig.showAdvancedFilters ? (
            <FiltersSidebarClientLazy
              users={contacts}
              products={products}
              modules={modules}
            />
            ) : null
          }
          header={{
            label: 'Tickets',
            title: viewConfig.pageTitle,
            description: viewConfig.pageDescription,
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
          kpis={
            // ✅ Afficher les KPIs seulement si configuré
            viewConfig.showKPIs ? (
              <TicketsKPISectionLazy kpis={kpis} hasProfile={!!currentProfileId} />
            ) : null
          }
          card={{
            title: 'Tickets récents',
            titleSuffix:
              initialTicketsData.total > 0
                ? `(${initialTicketsData.total} au total)`
                : undefined,
            search: (
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-stretch">
                <TicketsSearchBar initialSearch={searchParam} className="flex-[1.3] min-w-[200px]" />
                {/* ✅ Afficher les sélecteurs pour les managers, admins et agents support */}
                {(viewRole === 'manager' || viewRole === 'admin' || viewRole === 'agent') && (
                  <>
                    <AgentSelector 
                      agents={supportAgents} 
                      initialAgentId={agentParam}
                      className="flex-[1.3] min-w-[200px]"
                    />
                    <CompanySelector 
                      companies={companies} 
                      initialCompanyId={companyParam}
                      className="flex-[1.3] min-w-[200px]"
                    />
                  </>
                )}
              </div>
            ),
            quickFilters: (
              <TicketsQuickFilters
                activeFilter={quickFilter}
                currentProfileId={currentProfileId}
                availableFilters={availableQuickFilters} // ✅ Utiliser les filtres adaptés
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
            viewConfig={viewConfig}
          />
        </PageLayoutWithFilters>
      </TicketsPageClientWrapper>
    );
  } catch (error: unknown) {
    console.error('Erreur lors du chargement de la page des tickets:', error);
    
    // Extraire le message d'erreur selon le type
    let errorMessage = 'Une erreur est survenue lors du chargement des tickets. Veuillez réessayer.';
    let errorTitle = 'Erreur lors du chargement';
    let errorDetails: string | undefined;
    
    if (isApplicationError(error)) {
      errorMessage = error.message;
      errorTitle = `Erreur ${error.statusCode || 500}`;
      
      // Messages d'erreur plus user-friendly selon le code
      if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Erreur de connexion réseau. Vérifiez votre connexion internet et réessayez.';
      } else if (error.code === 'SUPABASE_ERROR') {
        errorMessage = 'Erreur lors de la récupération des données. Veuillez réessayer dans quelques instants.';
      } else if (error.code === 'UNAUTHORIZED' || error.code === 'FORBIDDEN') {
        errorMessage = 'Vous n\'avez pas les permissions nécessaires pour accéder à cette page.';
      }
      
      // Ajouter les détails techniques en mode développement
      if (process.env.NODE_ENV === 'development' && error.details) {
        errorDetails = `Code: ${error.code} | Status: ${error.statusCode}`;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return (
      <div className="space-y-6 p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{errorTitle}</AlertTitle>
          <AlertDescription>
            <p className="mb-2">{errorMessage}</p>
            {errorDetails && (
              <p className="mt-2 text-xs opacity-75">{errorDetails}</p>
            )}
            <p className="mt-4 text-sm">
              Si le problème persiste, veuillez contacter le support technique.
            </p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }
}

