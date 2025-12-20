'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { TaskWithRelations } from '@/types/task-with-relations';

/**
 * Hook pour gérer la sélection multiple de tâches
 * 
 * Pattern similaire à useActivitySelection pour cohérence
 * 
 * @returns État et fonctions pour la sélection
 */
export function useTaskSelection() {
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());

  /**
   * Sélectionne ou désélectionne une tâche
   */
  const toggleTaskSelection = useCallback((taskId: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }, []);

  /**
   * Sélectionne toutes les tâches visibles
   */
  const selectAllTasks = useCallback((tasks: TaskWithRelations[]) => {
    setSelectedTaskIds(new Set(tasks.map((t) => t.id)));
  }, []);

  /**
   * Désélectionne toutes les tâches
   */
  const clearSelection = useCallback(() => {
    setSelectedTaskIds(new Set());
  }, []);

  /**
   * Vérifie si une tâche est sélectionnée
   * Utilise une ref pour éviter les re-créations de fonction
   */
  const selectedIdsRef = useRef(selectedTaskIds);
  
  // Mettre à jour la ref dans useEffect pour éviter les erreurs de lint
  useEffect(() => {
    selectedIdsRef.current = selectedTaskIds;
  }, [selectedTaskIds]);
  
  const isTaskSelected = useCallback((taskId: string) => {
    return selectedIdsRef.current.has(taskId);
  }, []); // Pas de dépendances - utilise toujours la version actuelle via ref

  /**
   * Vérifie si toutes les tâches visibles sont sélectionnées
   * Utilise une ref pour éviter les re-créations de fonction
   */
  const areAllTasksSelected = useCallback((tasks: TaskWithRelations[]) => {
    if (tasks.length === 0) return false;
    return tasks.every((t) => selectedIdsRef.current.has(t.id));
  }, []); // Pas de dépendances - utilise toujours la version actuelle via ref

  /**
   * Vérifie si certaines (mais pas toutes) les tâches visibles sont sélectionnées
   * Utilise une ref pour éviter les re-créations de fonction
   */
  const areSomeTasksSelected = useCallback((tasks: TaskWithRelations[]) => {
    if (tasks.length === 0) return false;
    const selectedCount = tasks.filter((t) => selectedIdsRef.current.has(t.id)).length;
    return selectedCount > 0 && selectedCount < tasks.length;
  }, []); // Pas de dépendances - utilise toujours la version actuelle via ref

  /**
   * Nombre de tâches sélectionnées
   */
  const selectedCount = useMemo(() => selectedTaskIds.size, [selectedTaskIds]);

  /**
   * IDs des tâches sélectionnées sous forme de tableau
   */
  const selectedTaskIdsArray = useMemo(() => Array.from(selectedTaskIds), [selectedTaskIds]);

  return {
    selectedTaskIds,
    selectedTaskIdsArray,
    selectedCount,
    toggleTaskSelection,
    selectAllTasks,
    clearSelection,
    isTaskSelected,
    areAllTasksSelected,
    areSomeTasksSelected
  };
}
