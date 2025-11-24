import { useEffect, useRef } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Period } from '@/types/dashboard';
import { debounce } from '@/lib/utils/debounce';

type UseRealtimeDashboardDataProps = {
  period: Period;
  onDataChange: () => void;
};

/**
 * Hook pour écouter les changements temps réel des données du dashboard
 * 
 * Optimisé avec debouncing pour éviter les re-renders excessifs.
 * 
 * @param period - Période actuelle
 * @param onDataChange - Callback appelé lors d'un changement (debounced 300ms)
 */
export function useRealtimeDashboardData({
  period,
  onDataChange,
}: UseRealtimeDashboardDataProps): void {
  // Référence stable pour le callback (évite les réabonnements)
  const onDataChangeRef = useRef(onDataChange);
  
  // Mettre à jour la référence lorsque le callback change
  useEffect(() => {
    onDataChangeRef.current = onDataChange;
  }, [onDataChange]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    // Debounce le callback pour éviter les re-renders excessifs (300ms)
    const debouncedOnChange = debounce(() => {
      onDataChangeRef.current();
    }, 300);

    const ticketsChannel = supabase
      .channel('unified-dashboard-tickets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
        },
        debouncedOnChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ticketsChannel);
    };
  }, [period]); // Supprimer onDataChange des dépendances pour éviter les réabonnements
}

