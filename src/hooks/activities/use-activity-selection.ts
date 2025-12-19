'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import type { ActivityWithRelations } from '@/types/activity-with-relations';

/**
 * Hook pour gérer la sélection multiple d'activités
 * 
 * Pattern similaire à useTicketSelection pour cohérence
 * 
 * @returns État et fonctions pour la sélection
 */
export function useActivitySelection() {
  const [selectedActivityIds, setSelectedActivityIds] = useState<Set<string>>(new Set());

  /**
   * Sélectionne ou désélectionne une activité
   */
  const toggleActivitySelection = useCallback((activityId: string) => {
    setSelectedActivityIds((prev) => {
      const next = new Set(prev);
      if (next.has(activityId)) {
        next.delete(activityId);
      } else {
        next.add(activityId);
      }
      return next;
    });
  }, []);

  /**
   * Sélectionne toutes les activités visibles
   */
  const selectAllActivities = useCallback((activities: ActivityWithRelations[]) => {
    setSelectedActivityIds(new Set(activities.map((a) => a.id)));
  }, []);

  /**
   * Désélectionne toutes les activités
   */
  const clearSelection = useCallback(() => {
    setSelectedActivityIds(new Set());
  }, []);

  /**
   * Vérifie si une activité est sélectionnée
   * Utilise une ref pour éviter les re-créations de fonction
   */
  const selectedIdsRef = useRef(selectedActivityIds);
  selectedIdsRef.current = selectedActivityIds;
  
  const isActivitySelected = useCallback((activityId: string) => {
    return selectedIdsRef.current.has(activityId);
  }, []); // Pas de dépendances - utilise toujours la version actuelle via ref

  /**
   * Vérifie si toutes les activités visibles sont sélectionnées
   * Utilise une ref pour éviter les re-créations de fonction
   */
  const areAllActivitiesSelected = useCallback((activities: ActivityWithRelations[]) => {
    if (activities.length === 0) return false;
    return activities.every((a) => selectedIdsRef.current.has(a.id));
  }, []); // Pas de dépendances - utilise toujours la version actuelle via ref

  /**
   * Vérifie si certaines (mais pas toutes) les activités visibles sont sélectionnées
   * Utilise une ref pour éviter les re-créations de fonction
   */
  const areSomeActivitiesSelected = useCallback((activities: ActivityWithRelations[]) => {
    if (activities.length === 0) return false;
    const selectedCount = activities.filter((a) => selectedIdsRef.current.has(a.id)).length;
    return selectedCount > 0 && selectedCount < activities.length;
  }, []); // Pas de dépendances - utilise toujours la version actuelle via ref

  /**
   * Nombre d'activités sélectionnées
   */
  const selectedCount = useMemo(() => selectedActivityIds.size, [selectedActivityIds]);

  /**
   * IDs des activités sélectionnées sous forme de tableau
   */
  const selectedActivityIdsArray = useMemo(() => Array.from(selectedActivityIds), [selectedActivityIds]);

  return {
    selectedActivityIds,
    selectedActivityIdsArray,
    selectedCount,
    toggleActivitySelection,
    selectAllActivities,
    clearSelection,
    isActivitySelected,
    areAllActivitiesSelected,
    areSomeActivitiesSelected
  };
}
