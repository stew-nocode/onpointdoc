'use client';

/**
 * Composant pour l'affichage infini des activités
 * 
 * Pattern similaire à TicketsInfiniteScroll pour cohérence
 * 
 * Principe Clean Code :
 * - SRP : Gère l'affichage et le chargement infini des activités
 * - Utilise le hook useActivitiesInfiniteLoad pour la logique de chargement
 * - Utilise ActivityRow pour l'affichage de chaque ligne
 * - Gère la restauration du scroll après chargement
 */

import React, { useEffect, useLayoutEffect, useRef, useCallback, useState } from 'react';
import { Button } from '@/ui/button';
import { TooltipProvider } from '@/ui/tooltip';
import { useRouter } from 'next/navigation';
import { useStableSearchParams } from '@/hooks/use-stable-search-params';
import { useActivitiesInfiniteLoad } from '@/hooks/activities/use-activities-infinite-load';
import { useActivitySelection } from '@/hooks/activities/use-activity-selection';
import { useAuth } from '@/hooks';
import { LoadMoreButton } from './load-more-button';
import { ActivityRow } from './activity-row';
import { ActivitiesTableHeader } from './activities-table-header';
import { BulkActionsBar } from '@/components/activities/bulk-actions-bar';
import { ActivitiesColumnsConfigDialog } from '@/components/activities/activities-columns-config-dialog';
import { getVisibleActivityColumns, AVAILABLE_ACTIVITY_COLUMNS, type ActivityColumnId } from '@/lib/utils/activity-column-preferences';
import type { ActivityWithRelations } from '@/types/activity-with-relations';
import type { ActivityQuickFilter } from '@/types/activity-filters';

type ActivitiesInfiniteScrollProps = {
  initialActivities: ActivityWithRelations[];
  initialHasMore: boolean;
  initialTotal: number;
  search?: string;
  quickFilter?: ActivityQuickFilter;
  currentProfileId?: string | null;
};

/**
 * Composant ActivitiesInfiniteScroll
 * 
 * Gère l'affichage et le chargement infini des activités avec pagination.
 * 
 * @param props - Propriétés du composant
 */
export function ActivitiesInfiniteScroll({
  initialActivities,
  initialHasMore,
  initialTotal,
  search,
  quickFilter,
  currentProfileId
}: ActivitiesInfiniteScrollProps) {
  const router = useRouter();
  const searchParams = useStableSearchParams();
  const authState = useAuth();
  
  // Déterminer si l'utilisateur peut éditer les activités
  const canEdit = authState.role === 'admin' || authState.role === 'manager';
  const canSelectMultiple = true; // Autoriser la sélection multiple pour tous les utilisateurs
  
  // Utiliser le hook de chargement infini (doit être avant useActivitySelection pour avoir filterKey)
  const {
    activities,
    hasMore,
    isLoading,
    error,
    loadMore,
    filterKey
  } = useActivitiesInfiniteLoad({
    initialActivities,
    initialHasMore,
    search,
    quickFilter,
    currentProfileId,
    searchParams
  });

  // Gestion de la sélection multiple
  const {
    selectedActivityIdsArray,
    selectedCount,
    toggleActivitySelection,
    selectAllActivities,
    clearSelection,
    isActivitySelected,
    areAllActivitiesSelected,
    areSomeActivitiesSelected
  } = useActivitySelection();

  // Gestion des colonnes visibles
  // Initialiser avec toutes les colonnes par défaut pour l'hydratation
  const [visibleColumns, setVisibleColumns] = useState<Set<ActivityColumnId>>(() => 
    new Set(['title', 'type', 'status', 'planned_dates', 'creator', 'participants', 'linked_tickets', 'created_at'] as ActivityColumnId[])
  );
  const [isMounted, setIsMounted] = useState(false);

  /**
   * Initialiser les colonnes visibles après le montage
   * Une seule fois au montage pour éviter les re-renders.
   */
  useEffect(() => {
    setIsMounted(true);
    // Charger les colonnes depuis localStorage après le montage
    setVisibleColumns(getVisibleActivityColumns());
  }, []);

  // Stabiliser clearSelection avec une ref pour éviter les dépendances dans useEffect
  const clearSelectionRef = useRef(clearSelection);
  clearSelectionRef.current = clearSelection;

  // Réinitialiser la sélection quand les filtres changent
  const prevFilterKeyForSelectionRef = useRef<string | null>(null);
  
  useEffect(() => {
    // Ne réinitialiser que si filterKey a réellement changé
    if (prevFilterKeyForSelectionRef.current !== filterKey) {
      prevFilterKeyForSelectionRef.current = filterKey;
      // Utiliser setTimeout pour éviter les mises à jour pendant le render
      const timeoutId = setTimeout(() => {
        clearSelectionRef.current();
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [filterKey]); // Dépendance uniquement à filterKey, pas à clearSelection

  // Handler pour l'édition d'une activité
  const handleEdit = useCallback((activityId: string) => {
    router.push(`/gestion/activites/${activityId}?edit=true`);
  }, [router]);

  // Restaurer le scroll après le chargement de nouvelles activités
  useLayoutEffect(() => {
    const storedActivityId = sessionStorage.getItem('activities-scroll-activity-id');
    if (storedActivityId && !isLoading && activities.length > 0) {
      // Utiliser requestAnimationFrame pour s'assurer que le DOM est prêt
      requestAnimationFrame(() => {
        const activityElement = document.getElementById(storedActivityId);
        if (activityElement) {
          activityElement.scrollIntoView({ behavior: 'instant', block: 'start' });
          sessionStorage.removeItem('activities-scroll-activity-id');
        }
      });
    }
  }, [activities, isLoading]);

  // Aucune activité
  if (activities.length === 0 && !isLoading) {
    return (
      <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
        Aucune activité enregistrée pour le moment.
      </p>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-3" style={{ overflowAnchor: 'none' }} data-scroll-container>
        {/* Barre d'actions flottante pour les activités sélectionnées */}
        {canSelectMultiple && selectedCount > 0 && (
          <BulkActionsBar
            selectedActivityIds={selectedActivityIdsArray}
            activities={activities}
            onClearSelection={clearSelection}
          />
        )}
        <div className="flex justify-end">
          <ActivitiesColumnsConfigDialog onColumnsChange={setVisibleColumns} />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <ActivitiesTableHeader
              activities={activities}
              areAllActivitiesSelected={areAllActivitiesSelected}
              areSomeActivitiesSelected={areSomeActivitiesSelected}
              selectAllActivities={selectAllActivities}
              clearSelection={clearSelection}
              canSelectMultiple={canSelectMultiple}
              visibleColumns={isMounted ? visibleColumns : new Set(AVAILABLE_ACTIVITY_COLUMNS.map(col => col.id))}
            />
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {activities.map((activity) => (
                <ActivityRow
                  key={activity.id}
                  activity={activity}
                  isActivitySelected={isActivitySelected}
                  toggleActivitySelection={toggleActivitySelection}
                  handleEdit={handleEdit}
                  canEdit={canEdit}
                  canSelectMultiple={canSelectMultiple}
                  search={search}
                  visibleColumns={isMounted ? visibleColumns : new Set(AVAILABLE_ACTIVITY_COLUMNS.map(col => col.id))}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="flex flex-col items-center gap-2 py-6">
            <p className="text-sm text-status-danger">{error}</p>
            <Button size="sm" onClick={() => loadMore()}>
              Réessayer
            </Button>
          </div>
        )}

        {/* Bouton "Voir plus" */}
        {!error && (
          <LoadMoreButton
            onLoadMore={loadMore}
            isLoading={isLoading}
            hasMore={hasMore}
            label="Voir plus d'activités"
          />
        )}

        {/* Message de fin de liste */}
        {!hasMore && !isLoading && activities.length > 0 && (
          <div className="py-6 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Toutes les activités ont été chargées ({activities.length} sur {initialTotal})
            </p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
