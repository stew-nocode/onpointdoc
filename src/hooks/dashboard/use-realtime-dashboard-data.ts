import { useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Period } from '@/types/dashboard';

type UseRealtimeDashboardDataProps = {
  period: Period;
  onDataChange: () => void;
};

/**
 * Hook pour écouter les changements temps réel des données du dashboard
 * 
 * @param period - Période actuelle
 * @param onDataChange - Callback appelé lors d'un changement
 */
export function useRealtimeDashboardData({
  period,
  onDataChange,
}: UseRealtimeDashboardDataProps): void {
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const ticketsChannel = supabase
      .channel('unified-dashboard-tickets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
        },
        () => {
          onDataChange();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ticketsChannel);
    };
  }, [period, onDataChange]);
}

