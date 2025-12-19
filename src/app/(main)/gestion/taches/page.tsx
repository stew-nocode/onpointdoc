import { unstable_noStore as noStore } from 'next/cache';
import { listTasksPaginated } from '@/services/tasks';
import { getCachedTaskKPIs } from '@/lib/cache/tasks-kpis-cache';
import type { TasksPaginatedResult } from '@/types/task-with-relations';
import { listBasicProfiles } from '@/services/users/server';
import { 
  TasksInfiniteScroll,
  TasksSearchBar,
  TasksQuickFilters,
  TasksKPISectionLazy,
  CreateTaskDialog
} from '@/components/tasks';
import type { TaskQuickFilter } from '@/types/task-filters';
import type { TaskSortColumn, SortDirection } from '@/types/task-sort';
import { parseTaskSort } from '@/types/task-sort';
import { getCachedCurrentUserProfileId } from '@/lib/auth/cached-auth';
import { isApplicationError } from '@/lib/errors/types';
import { PageLayoutWithFilters } from '@/components/layout/page';
import { createTaskAction } from './actions';
import { getCachedSearchParams, stabilizeSearchParams } from '@/lib/utils/search-params';
import { Alert, AlertDescription, AlertTitle } from '@/ui/alert';
import { AlertCircle } from 'lucide-react';

type TasksPageProps = {
  searchParams?: Promise<{
    search?: string;
    quick?: TaskQuickFilter;
    sort?: string;
  }>;
};

/**
 * Charge les tâches initiales pour la page
 * 
 * Pattern similaire à loadInitialActivities pour cohérence
 * 
 * Principe Clean Code - Niveau Senior :
 * - noStore() nécessaire car les tâches dépendent de cookies() (authentification)
 * - Les tâches sont des données dynamiques dépendantes de l'utilisateur (RLS)
 * - Gestion d'erreur améliorée : propage l'erreur au lieu de retourner un résultat vide
 * 
 * @param searchParam - Terme de recherche
 * @param quickFilterParam - Filtre rapide
 * @param currentProfileId - ID du profil utilisateur actuel
 * @returns Résultat paginé avec tâches
 * @throws ApplicationError si une erreur survient lors du chargement
 */
async function loadInitialTasks(
  searchParam?: string,
  quickFilterParam?: TaskQuickFilter,
  currentProfileId?: string | null,
  sortColumn?: TaskSortColumn,
  sortDirection?: SortDirection
): Promise<TasksPaginatedResult> {
  // ✅ noStore() nécessaire : tâches dépendent de cookies() (authentification)
  // Impossible d'utiliser unstable_cache() avec cookies() selon Next.js
  noStore();
  
  try {
    const result = await listTasksPaginated(
      0,
      25,
      searchParam,
      quickFilterParam,
      currentProfileId ?? undefined,
      sortColumn,
      sortDirection
    );
    
    return result;
  } catch (error) {
    // Logger l'erreur pour le débogage
    console.error('[ERROR] Erreur dans loadInitialTasks:', error);
    
    // Normaliser l'erreur en ApplicationError si ce n'est pas déjà le cas
    const { normalizeError } = await import('@/lib/errors/types');
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
 * Page principale de gestion des tâches
 * 
 * Optimisations appliquées (Niveau Senior) :
 * - noStore() déplacé uniquement dans loadInitialTasks (données temps réel uniquement)
 * - cache() utilisé pour mémoriser la résolution des searchParams
 * - searchParams stabilisés pour éviter les recompilations inutiles
 * - Parallélisme optimisé pour les requêtes indépendantes
 * 
 * Pattern similaire à ActivitiesPage pour cohérence
 */
export default async function TasksPage({ searchParams }: TasksPageProps) {
  // ✅ Utiliser cache() pour mémoriser la résolution des searchParams
  // Évite de résoudre plusieurs fois les mêmes params dans le même render tree
  const resolvedSearchParams = await getCachedSearchParams(searchParams || Promise.resolve({}));
  
  // Stabiliser et normaliser les searchParams pour une comparaison stable
  const stabilizedParams = await stabilizeSearchParams(resolvedSearchParams);
  
  // Extraire les paramètres avec types appropriés
  // ✅ Si aucun filtre rapide n'est dans l'URL, utiliser 'all' par défaut
  const quickFilter = (stabilizedParams.quick as TaskQuickFilter | undefined) || 'all';
  const searchParam = stabilizedParams.search;
  
  // Parser le tri
  const sortParam = stabilizedParams.sort as string | undefined;
  const sort = sortParam ? parseTaskSort(sortParam) : { column: 'created_at' as TaskSortColumn, direction: 'desc' as SortDirection };
  
  // Optimiser le parallélisme : démarrer toutes les requêtes en parallèle
  // Le profileId est nécessaire pour les filtres conditionnels
  // ✅ OPTIMISÉ : Utilise getCachedCurrentUserProfileId pour éviter le rate limit
  const [currentProfileId, profiles] = await Promise.all([
    getCachedCurrentUserProfileId(),
    listBasicProfiles(), // Profils pour le formulaire de création
  ]);

  // Ensuite, charger les tâches et KPIs en parallèle
  // OPTIMISATION (2025-12-15): Utilisation de getCachedTaskKPIs pour le cache
  try {
    const [initialTasksData, kpis] = await Promise.all([
      loadInitialTasks(
        searchParam,
        quickFilter,
        currentProfileId,
        sort.column,
        sort.direction
      ),
      getCachedTaskKPIs(currentProfileId)
    ]);

    return (
      <PageLayoutWithFilters
        sidebar={null}
        header={{
          icon: 'CheckSquare',
          title: 'Gestion des tâches',
          description: 'Créez et gérez vos tâches internes, liées aux tickets et activités.',
          actions: (
            <CreateTaskDialog
              profiles={profiles}
              onSubmit={createTaskAction}
            />
          )
        }}
        card={{
          title: 'Liste des tâches',
          titleSuffix:
            initialTasksData.total > 0
              ? `(${initialTasksData.total} au total)`
              : undefined,
          search: (
            <TasksSearchBar 
              initialSearch={searchParam} 
              className="flex-1 min-w-[200px]" 
            />
          ),
          quickFilters: (
            <TasksQuickFilters
              activeFilter={quickFilter}
              currentProfileId={currentProfileId}
            />
          )
        }}
        kpis={
          currentProfileId ? (
            <TasksKPISectionLazy
              kpis={kpis}
              hasProfile={!!currentProfileId}
            />
          ) : null
        }
      >
        <TasksInfiniteScroll
          initialTasks={initialTasksData.tasks}
          initialHasMore={initialTasksData.hasMore}
          initialTotal={initialTasksData.total}
          search={searchParam}
          quickFilter={quickFilter}
          currentProfileId={currentProfileId}
        />
      </PageLayoutWithFilters>
    );
  } catch (error: unknown) {
    console.error('Erreur lors du chargement de la page des tâches:', error);
    
    // Extraire le message d'erreur selon le type
    let errorMessage = 'Une erreur est survenue lors du chargement des tâches. Veuillez réessayer.';
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
