'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { TicketWithRelations } from '@/types/ticket-with-relations';

/**
 * Hook pour gérer la sélection multiple de tickets
 * 
 * @returns État et fonctions pour la sélection
 */
export function useTicketSelection() {
  const [selectedTicketIds, setSelectedTicketIds] = useState<Set<string>>(new Set());

  /**
   * Sélectionne ou désélectionne un ticket
   */
  const toggleTicketSelection = useCallback((ticketId: string) => {
    setSelectedTicketIds((prev) => {
      const next = new Set(prev);
      if (next.has(ticketId)) {
        next.delete(ticketId);
      } else {
        next.add(ticketId);
      }
      return next;
    });
  }, []);

  /**
   * Sélectionne tous les tickets visibles
   */
  const selectAllTickets = useCallback((tickets: TicketWithRelations[]) => {
    setSelectedTicketIds(new Set(tickets.map((t) => t.id)));
  }, []);

  /**
   * Désélectionne tous les tickets
   */
  const clearSelection = useCallback(() => {
    setSelectedTicketIds(new Set());
  }, []);

  /**
   * Vérifie si un ticket est sélectionné
   * Utilise une ref pour éviter les re-créations de fonction
   */
  const selectedIdsRef = useRef(selectedTicketIds);
  
  // Mettre à jour la ref dans useEffect pour éviter les erreurs de lint
  useEffect(() => {
    selectedIdsRef.current = selectedTicketIds;
  }, [selectedTicketIds]);
  
  const isTicketSelected = useCallback((ticketId: string) => {
    return selectedIdsRef.current.has(ticketId);
  }, []); // Pas de dépendances - utilise toujours la version actuelle via ref

  /**
   * Vérifie si tous les tickets visibles sont sélectionnés
   * Utilise une ref pour éviter les re-créations de fonction
   */
  const areAllTicketsSelected = useCallback((tickets: TicketWithRelations[]) => {
    if (tickets.length === 0) return false;
    return tickets.every((t) => selectedIdsRef.current.has(t.id));
  }, []); // Pas de dépendances - utilise toujours la version actuelle via ref

  /**
   * Vérifie si certains (mais pas tous) les tickets visibles sont sélectionnés
   * Utilise une ref pour éviter les re-créations de fonction
   */
  const areSomeTicketsSelected = useCallback((tickets: TicketWithRelations[]) => {
    if (tickets.length === 0) return false;
    const selectedCount = tickets.filter((t) => selectedIdsRef.current.has(t.id)).length;
    return selectedCount > 0 && selectedCount < tickets.length;
  }, []); // Pas de dépendances - utilise toujours la version actuelle via ref

  /**
   * Nombre de tickets sélectionnés
   */
  const selectedCount = useMemo(() => selectedTicketIds.size, [selectedTicketIds]);

  /**
   * IDs des tickets sélectionnés sous forme de tableau
   */
  const selectedTicketIdsArray = useMemo(() => Array.from(selectedTicketIds), [selectedTicketIds]);

  return {
    selectedTicketIds,
    selectedTicketIdsArray,
    selectedCount,
    toggleTicketSelection,
    selectAllTickets,
    clearSelection,
    isTicketSelected,
    areAllTicketsSelected,
    areSomeTicketsSelected
  };
}

