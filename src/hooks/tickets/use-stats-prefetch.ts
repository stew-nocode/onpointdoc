import { useCallback } from 'react';
import { useSWRConfig } from 'swr';
import {
  fetchTicketStatsClient,
  fetchTicketStatsBatchClient,
  fetchUserStatsClient,
  fetchUserStatsBatchClient
} from '@/services/tickets/stats/client';

const pendingTicketIds = new Set<string>();
let ticketBatchTimer: ReturnType<typeof setTimeout> | null = null;
let lastTicketMutate: ((key: any, data?: any, opts?: any) => Promise<any>) | null = null;

const pendingUserStats = {
  reporter: new Set<string>(),
  assigned: new Set<string>()
};
const userBatchTimers: Partial<Record<'reporter' | 'assigned', ReturnType<typeof setTimeout>>> = {};
let lastUserMutate: ((key: any, data?: any, opts?: any) => Promise<any>) | null = null;

function scheduleTicketBatch() {
  if (ticketBatchTimer !== null) return;
  ticketBatchTimer = setTimeout(async () => {
    ticketBatchTimer = null;
    if (!pendingTicketIds.size || !lastTicketMutate) return;
    const ids = Array.from(pendingTicketIds);
    pendingTicketIds.clear();
    const statsMap = await fetchTicketStatsBatchClient(ids);
    ids.forEach((id) => {
      const stats = statsMap[id] ?? null;
      lastTicketMutate?.(
        ['ticket-stats', id],
        stats ?? fetchTicketStatsClient(id),
        {
          populateCache: true,
          revalidate: false,
          rollbackOnError: false
        }
      );
    });
  }, 120);
}

function scheduleUserBatch(type: 'reporter' | 'assigned') {
  if (userBatchTimers[type]) return;
  userBatchTimers[type] = setTimeout(async () => {
    userBatchTimers[type] = undefined;
    const pending = pendingUserStats[type];
    if (!pending.size || !lastUserMutate) return;
    const ids = Array.from(pending);
    pending.clear();
    const statsMap = await fetchUserStatsBatchClient(ids, type);
    ids.forEach((id) => {
      const stats = statsMap[id] ?? null;
      lastUserMutate?.(
        ['user-stats', id, type],
        stats ?? fetchUserStatsClient(id, type),
        {
          populateCache: true,
          revalidate: false,
          rollbackOnError: false
        }
      );
    });
  }, 120);
}

export function useTicketStatsPrefetch() {
  const { mutate } = useSWRConfig();

  return useCallback((ticketId: string | null | undefined) => {
    if (!ticketId) return;
    pendingTicketIds.add(ticketId);
    lastTicketMutate = mutate;
    scheduleTicketBatch();
  }, [mutate]);
}

export function useUserStatsPrefetch() {
  const { mutate } = useSWRConfig();

  return useCallback((
    profileId: string | null | undefined,
    type: 'reporter' | 'assigned'
  ) => {
    if (!profileId) return;
    pendingUserStats[type].add(profileId);
    lastUserMutate = mutate;
    scheduleUserBatch(type);
  }, [mutate]);
}
