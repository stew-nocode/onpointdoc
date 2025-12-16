import { unstable_noStore as noStore } from 'next/cache';
import { listCompaniesPaginated } from '@/services/companies/list-companies-paginated';
import type { CompaniesPaginatedResult } from '@/types/company-with-relations';
import type { CompanyQuickFilter } from '@/types/company-filters';
import type { CompanySortColumn, SortDirection } from '@/types/company-sort';
import { parseCompanySort } from '@/types/company-sort';
import { 
  CompaniesInfiniteScroll,
  CompaniesSearchBar,
  CompaniesQuickFilters,
  NewCompanyDialogLazy
} from '@/components/companies';
import { PageLayoutWithFilters } from '@/components/layout/page';
import { getCachedSearchParams, stabilizeSearchParams } from '@/lib/utils/search-params';
import { isApplicationError } from '@/lib/errors/types';
import { Alert, AlertDescription, AlertTitle } from '@/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/ui/button';

type CompaniesPageProps = {
  searchParams?: Promise<{
    search?: string;
    quick?: CompanyQuickFilter;
    sort?: string;
  }>;
};

/**
 * Charge les entreprises initiales pour la page
 * 
 * Pattern similaire à loadInitialTasks pour cohérence
 * 
 * Principe Clean Code :
 * - noStore() nécessaire car les entreprises dépendent de cookies() (authentification)
 * - Les entreprises sont des données dynamiques dépendantes de l'utilisateur (RLS)
 * - Gestion d'erreur améliorée : propage l'erreur au lieu de retourner un résultat vide
 */
async function loadInitialCompanies(
  searchParam?: string,
  quickFilterParam?: CompanyQuickFilter,
  sort?: CompanySortColumn,
  direction?: SortDirection
): Promise<CompaniesPaginatedResult> {
  noStore();
  
  try {
    const result = await listCompaniesPaginated(
      0,
      25,
      searchParam,
      quickFilterParam,
      sort || 'name',
      direction || 'asc'
    );
    
    return result;
  } catch (error) {
    console.error('[ERROR] Erreur dans loadInitialCompanies:', error);
    
    const { normalizeError } = await import('@/lib/errors/types');
    const normalizedError = isApplicationError(error) 
      ? error 
      : normalizeError(error);
    
    if (isApplicationError(normalizedError)) {
      console.error('[ERROR] Code:', normalizedError.code);
      console.error('[ERROR] StatusCode:', normalizedError.statusCode);
      if (normalizedError.details) {
        console.error('[ERROR] Details:', normalizedError.details);
      }
    }
    
    throw normalizedError;
  }
}

/**
 * Page principale de gestion des entreprises
 * 
 * Optimisations appliquées (Niveau Senior) :
 * - noStore() déplacé uniquement dans loadInitialCompanies (données temps réel uniquement)
 * - cache() utilisé pour mémoriser la résolution des searchParams
 * - searchParams stabilisés pour éviter les recompilations inutiles
 * - Parallélisme optimisé pour les requêtes indépendantes
 * 
 * Pattern similaire à TasksPage pour cohérence
 */
export default async function CompaniesPage({ searchParams }: CompaniesPageProps) {
  // ✅ Utiliser cache() pour mémoriser la résolution des searchParams
  const resolvedSearchParams = await getCachedSearchParams(searchParams || Promise.resolve({}));
  
  // Stabiliser et normaliser les searchParams
  const stabilizedParams = await stabilizeSearchParams(resolvedSearchParams);
  
  // Extraire les paramètres avec types appropriés
  const quickFilter = (stabilizedParams.quick as CompanyQuickFilter | undefined) || 'all';
  const searchParam = stabilizedParams.search as string | undefined;
  
  // Parser le tri
  const sortParam = stabilizedParams.sort as string | undefined;
  const sort = sortParam ? parseCompanySort(sortParam) : { column: 'name' as CompanySortColumn, direction: 'asc' as SortDirection };

  try {
    const initialCompaniesData = await loadInitialCompanies(
      searchParam,
      quickFilter === 'all' ? undefined : quickFilter,
      sort.column,
      sort.direction
    );

    return (
      <PageLayoutWithFilters
        sidebar={null}
        header={{
          icon: 'Building',
          title: 'Entreprises',
          description: 'Gérez les entreprises et leurs informations.',
          actions: (
            <NewCompanyDialogLazy>
              <Button>Nouvelle entreprise</Button>
            </NewCompanyDialogLazy>
          )
        }}
        card={{
          title: 'Liste des entreprises',
          titleSuffix:
            initialCompaniesData.total > 0
              ? `(${initialCompaniesData.total} au total)`
              : undefined,
          search: (
            <CompaniesSearchBar 
              initialSearch={searchParam} 
              className="flex-1 min-w-[200px]" 
            />
          ),
          quickFilters: (
            <CompaniesQuickFilters
              activeFilter={quickFilter}
            />
          )
        }}
      >
        <CompaniesInfiniteScroll
          initialCompanies={initialCompaniesData.companies}
          initialHasMore={initialCompaniesData.hasMore}
          initialTotal={initialCompaniesData.total}
          search={searchParam}
          quickFilter={quickFilter === 'all' ? undefined : quickFilter}
        />
      </PageLayoutWithFilters>
    );
  } catch (error: unknown) {
    console.error('Erreur lors du chargement de la page des entreprises:', error);
    
    let errorMessage = 'Une erreur est survenue lors du chargement des entreprises. Veuillez réessayer.';
    let errorTitle = 'Erreur lors du chargement';
    let errorDetails: string | undefined;
    
    if (isApplicationError(error)) {
      errorMessage = error.message;
      errorTitle = `Erreur ${error.statusCode || 500}`;
      
      if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Erreur de connexion réseau. Vérifiez votre connexion internet et réessayez.';
      } else if (error.code === 'SUPABASE_ERROR') {
        errorMessage = 'Erreur lors de la récupération des données. Veuillez réessayer dans quelques instants.';
      } else if (error.code === 'UNAUTHORIZED' || error.code === 'FORBIDDEN') {
        errorMessage = 'Vous n\'avez pas les permissions nécessaires pour accéder à cette page.';
      }
      
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