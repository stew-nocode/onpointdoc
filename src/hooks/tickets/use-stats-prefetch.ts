import { useCallback } from 'react';
import { useSWRConfig } from 'swr';
import { fetchTicketStatsClient, fetchUserStatsClient } from '@/services/tickets/stats/client';

export function useTicketStatsPrefetch() {
  const { mutate } = useSWRConfig();

  return useCallback((ticketId: string | null | undefined) => {
    if (!ticketId) return;
    void mutate(
      ['ticket-stats', ticketId],
      fetchTicketStatsClient(ticketId),
      {
        populateCache: true,
        revalidate: false,
        rollbackOnError: false
      }
    );
  }, [mutate]);
}

export function useUserStatsPrefetch() {
  const { mutate } = useSWRConfig();

  return useCallback((
    profileId: string | null | undefined,
    type: 'reporter' | 'assigned'
  ) => {
    if (!profileId) return;
    void mutate(
      ['user-stats', profileId, type],
      fetchUserStatsClient(profileId, type),
      {
        populateCache: true,
        revalidate: false,
        rollbackOnError: false
      }
    );
  }, [mutate]);
}
