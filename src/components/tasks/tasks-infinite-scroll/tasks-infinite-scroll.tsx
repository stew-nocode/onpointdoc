'use client';

/**
 * Composant pour l'affichage infini des tâches
 * 
 * Pattern similaire à ActivitiesInfiniteScroll pour cohérence
 * 
 * Principe Clean Code :
 * - SRP : Gère l'affichage et le chargement infini des tâches
 * - Utilise le hook useTasksInfiniteLoad pour la logique de chargement
 * - Utilise TaskRow pour l'affichage de chaque ligne
 * - Gère la restauration du scroll après chargement
 */

import React, { useEffect, useLayoutEffect, useRef, useCallback, useState } from 'react';
import { Button } from '@/ui/button';
import { TooltipProvider } from '@/ui/tooltip';
import { useRouter } from 'next/navigation';
import { useStableSearchParams } from '@/hooks/use-stable-search-params';
import { useTasksInfiniteLoad } from '@/hooks/tasks/use-tasks-infinite-load';
import { useTaskSelection } from '@/hooks/tasks/use-task-selection';
import { useAuth } from '@/hooks';
import { LoadMoreButton } from '@/components/activities/activities-infinite-scroll/load-more-button';
import { TaskRow } from './task-row';
import { TasksTableHeader } from './tasks-table-header';
import { BulkActionsBar } from '@/components/tasks/bulk-actions-bar';
import { TasksColumnsConfigDialog } from '@/components/tasks/tasks-columns-config-dialog';
import { getVisibleTaskColumns, AVAILABLE_TASK_COLUMNS, type TaskColumnId } from '@/lib/utils/task-column-preferences';
import type { TaskWithRelations } from '@/types/task-with-relations';
import type { TaskQuickFilter } from '@/types/task-filters';
import type { TaskSortColumn, SortDirection } from '@/types/task-sort';
import { parseTaskSort } from '@/types/task-sort';

type TasksInfiniteScrollProps = {
  initialTasks: TaskWithRelations[];
  initialHasMore: boolean;
  initialTotal: number;
  search?: string;
  quickFilter?: TaskQuickFilter;
  currentProfileId?: string | null;
};

/**
 * Composant TasksInfiniteScroll
 * 
 * Gère l'affichage et le chargement infini des tâches avec pagination.
 * 
 * @param props - Propriétés du composant
 */
export function TasksInfiniteScroll({
  initialTasks,
  initialHasMore,
  initialTotal,
  search,
  quickFilter,
  currentProfileId
}: TasksInfiniteScrollProps) {
  const router = useRouter();
  const searchParams = useStableSearchParams();
  const authState = useAuth();
  
  // Extraire le tri depuis l'URL
  const sortParam = searchParams.get('sort');
  const sort = sortParam ? parseTaskSort(sortParam) : { column: 'created_at' as TaskSortColumn, direction: 'desc' as SortDirection };
  
  // Déterminer si l'utilisateur peut éditer les tâches
  const canEdit = authState.role === 'admin' || authState.role === 'manager';
  const canSelectMultiple = true; // Autoriser la sélection multiple pour tous les utilisateurs
  
  // Utiliser le hook de chargement infini (doit être avant useTaskSelection pour avoir filterKey)
  const {
    tasks,
    hasMore,
    isLoading,
    error,
    loadMore,
    filterKey
  } = useTasksInfiniteLoad({
    initialTasks,
    initialHasMore,
    search,
    quickFilter,
    currentProfileId,
    // TODO: sort parameter removed - check if it should be added to UseTasksInfiniteLoadProps
    searchParams
  });

  // Gestion de la sélection multiple
  const {
    selectedTaskIdsArray,
    selectedCount,
    toggleTaskSelection,
    selectAllTasks,
    clearSelection,
    isTaskSelected,
    areAllTasksSelected,
    areSomeTasksSelected
  } = useTaskSelection();

  // Gestion des colonnes visibles
  // Initialiser avec toutes les colonnes par défaut pour l'hydratation
  const [visibleColumns, setVisibleColumns] = useState<Set<TaskColumnId>>(() => 
    new Set(['title', 'status', 'due_date', 'assigned_to', 'creator', 'linked_tickets', 'linked_activities', 'created_at'] as TaskColumnId[])
  );
  const [isMounted, setIsMounted] = useState(false);

  /**
   * Initialiser les colonnes visibles après le montage
   * Une seule fois au montage pour éviter les re-renders.
   */
  useEffect(() => {
    setIsMounted(true);
    // Charger les colonnes depuis localStorage après le montage
    setVisibleColumns(getVisibleTaskColumns());
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

  // Handler pour l'édition d'une tâche
  const handleEdit = useCallback((taskId: string) => {
    router.push(`/gestion/taches/${taskId}?edit=true`);
  }, [router]);

  // Restaurer le scroll après le chargement de nouvelles tâches
  useLayoutEffect(() => {
    const storedTaskId = sessionStorage.getItem('tasks-scroll-task-id');
    if (storedTaskId && !isLoading && tasks.length > 0) {
      // Utiliser requestAnimationFrame pour s'assurer que le DOM est prêt
      requestAnimationFrame(() => {
        const taskElement = document.getElementById(storedTaskId);
        if (taskElement) {
          taskElement.scrollIntoView({ behavior: 'instant', block: 'start' });
          sessionStorage.removeItem('tasks-scroll-task-id');
        }
      });
    }
  }, [tasks, isLoading]);

  // Aucune tâche
  if (tasks.length === 0 && !isLoading) {
    return (
      <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
        Aucune tâche enregistrée pour le moment.
      </p>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-3" style={{ overflowAnchor: 'none' }} data-scroll-container>
        {/* Barre d'actions flottante pour les tâches sélectionnées */}
        {canSelectMultiple && selectedCount > 0 && (
          <BulkActionsBar
            selectedTaskIds={selectedTaskIdsArray}
            tasks={tasks}
            onClearSelection={clearSelection}
          />
        )}
        <div className="flex justify-end">
          <TasksColumnsConfigDialog onColumnsChange={setVisibleColumns} />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <TasksTableHeader
              tasks={tasks}
              areAllTasksSelected={areAllTasksSelected}
              areSomeTasksSelected={areSomeTasksSelected}
              selectAllTasks={selectAllTasks}
              clearSelection={clearSelection}
              canSelectMultiple={canSelectMultiple}
              visibleColumns={isMounted ? visibleColumns : new Set(AVAILABLE_TASK_COLUMNS.map(col => col.id))}
            />
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  isTaskSelected={isTaskSelected}
                  toggleTaskSelection={toggleTaskSelection}
                  handleEdit={handleEdit}
                  canEdit={canEdit}
                  canSelectMultiple={canSelectMultiple}
                  search={search}
                  visibleColumns={isMounted ? visibleColumns : new Set(AVAILABLE_TASK_COLUMNS.map(col => col.id))}
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
            label="Voir plus de tâches"
          />
        )}

        {/* Message de fin de liste */}
        {!hasMore && !isLoading && tasks.length > 0 && (
          <div className="py-6 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Toutes les tâches ont été chargées ({tasks.length} sur {initialTotal})
            </p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
