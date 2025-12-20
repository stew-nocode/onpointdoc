import { unstable_noStore as noStore } from 'next/cache';
import { listActivitiesPaginated } from '@/services/activities';
import { getCachedActivityKPIs } from '@/lib/cache/activities-kpis-cache';
import type { ActivitiesPaginatedResult } from '@/types/activity-with-relations';
import { listBasicProfiles } from '@/services/users/server';
import { 
  CreateActivityDialog,
  ActivitiesInfiniteScroll,
  ActivitiesSearchBar,
  ActivitiesQuickFilters,
  ActivitiesKPISectionLazy
} from '@/components/activities';
import type { ActivityQuickFilter } from '@/types/activity-filters';
import { getCachedCurrentUserProfileId } from '@/lib/auth/cached-auth';
import { isApplicationError } from '@/lib/errors/types';
import { PageLayoutWithFilters } from '@/components/layout/page';
import { createActivityAction } from './actions';
import { getCachedSearchParams, stabilizeSearchParams } from '@/lib/utils/search-params';
import { Alert, AlertDescription, AlertTitle } from '@/ui/alert';
import { AlertCircle } from 'lucide-react';

type ActivitiesPageProps = {
  searchParams?: Promise<{
    search?: string;
    quick?: ActivityQuickFilter;
  }>;
};

/**
 * Charge les activités initiales pour la page
 * 
 * Pattern similaire à loadInitialTickets pour cohérence
 * 
 * Principe Clean Code - Niveau Senior :
 * - noStore() nécessaire car les activités dépendent de cookies() (authentification)
 * - Les activités sont des données dynamiques dépendantes de l'utilisateur (RLS)
 * - Gestion d'erreur améliorée : propage l'erreur au lieu de retourner un résultat vide
 * 
 * @param searchParam - Terme de recherche
 * @param quickFilterParam - Filtre rapide
 * @param currentProfileId - ID du profil utilisateur actuel
 * @returns Résultat paginé avec activités
 * @throws ApplicationError si une erreur survient lors du chargement
 */
async function loadInitialActivities(
  searchParam?: string,
  quickFilterParam?: ActivityQuickFilter,
  currentProfileId?: string | null
): Promise<ActivitiesPaginatedResult> {
  // ✅ noStore() nécessaire : activités dépendent de cookies() (authentification)
  // Impossible d'utiliser unstable_cache() avec cookies() selon Next.js
  noStore();
  
  try {
    const result = await listActivitiesPaginated(
      0,
      25,
      searchParam,
      quickFilterParam,
      currentProfileId ?? undefined
    );
    
    return result;
  } catch (error) {
    // Logger l'erreur pour le débogage
    console.error('[ERROR] Erreur dans loadInitialActivities:', error);
    
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
 * Page principale de gestion des activités
 * 
 * Optimisations appliquées (Niveau Senior) :
 * - noStore() déplacé uniquement dans loadInitialActivities (données temps réel uniquement)
 * - cache() utilisé pour mémoriser la résolution des searchParams
 * - searchParams stabilisés pour éviter les recompilations inutiles
 * - Parallélisme optimisé pour les requêtes indépendantes
 * 
 * Pattern similaire à TicketsPage pour cohérence
 */
export default async function ActivitiesPage({ searchParams }: ActivitiesPageProps) {
  // ✅ Utiliser cache() pour mémoriser la résolution des searchParams
  // Évite de résoudre plusieurs fois les mêmes params dans le même render tree
  const resolvedSearchParams = searchParams ? await getCachedSearchParams(searchParams) : {};
  
  // Stabiliser et normaliser les searchParams pour une comparaison stable
  const stabilizedParams = await stabilizeSearchParams(resolvedSearchParams);
  
  // Extraire les paramètres avec types appropriés
  // ✅ Si aucun filtre rapide n'est dans l'URL, utiliser 'all' par défaut
  const quickFilter = (stabilizedParams.quick as ActivityQuickFilter | undefined) || 'all';
  const searchParam = stabilizedParams.search;
  
  // Optimiser le parallélisme : démarrer toutes les requêtes en parallèle
  // Le profileId est nécessaire pour les filtres conditionnels
  // ✅ OPTIMISÉ : Utilise getCachedCurrentUserProfileId pour éviter le rate limit
  const [currentProfileId, participants] = await Promise.all([
    getCachedCurrentUserProfileId(),
    listBasicProfiles(), // Participants pour le formulaire de création
  ]);

  // Ensuite, charger les activités et KPIs en parallèle
  // OPTIMISATION (2025-12-15): Utilisation de getCachedActivityKPIs pour le cache
  let initialActivitiesData: ActivitiesPaginatedResult;
  let kpis: Awaited<ReturnType<typeof getCachedActivityKPIs>>;
  
  try {
    [initialActivitiesData, kpis] = await Promise.all([
      loadInitialActivities(
        searchParam,
        quickFilter,
        currentProfileId
      ),
      getCachedActivityKPIs(currentProfileId)
    ]);
  } catch (error: unknown) {
    console.error('Erreur lors du chargement de la page des activités:', error);
    
    // Extraire le message d'erreur selon le type
    let errorMessage = 'Une erreur est survenue lors du chargement des activités. Veuillez réessayer.';
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

  return (
    <PageLayoutWithFilters
      sidebar={null}
      header={{
        icon: 'Calendar',
        title: 'Gestion des activités',
        description: 'Créez et gérez vos activités : revues, ateliers, brainstormings, présentations, etc.',
        actions: (
          <CreateActivityDialog
            participants={participants}
            onSubmit={createActivityAction}
          />
        )
      }}
      card={{
        title: 'Liste des activités',
        titleSuffix:
          initialActivitiesData.total > 0
            ? `(${initialActivitiesData.total} au total)`
            : undefined,
        search: (
          <ActivitiesSearchBar 
            initialSearch={searchParam} 
            className="flex-1 min-w-[200px]" 
          />
        ),
        quickFilters: (
          <ActivitiesQuickFilters
            activeFilter={quickFilter}
            currentProfileId={currentProfileId}
          />
        )
      }}
      kpis={
        currentProfileId ? (
          <ActivitiesKPISectionLazy
            kpis={kpis}
            hasProfile={!!currentProfileId}
          />
        ) : null
      }
    >
      <ActivitiesInfiniteScroll
        initialActivities={initialActivitiesData.activities}
        initialHasMore={initialActivitiesData.hasMore}
        initialTotal={initialActivitiesData.total}
        search={searchParam}
        quickFilter={quickFilter}
        currentProfileId={currentProfileId}
      />
    </PageLayoutWithFilters>
  );
}
