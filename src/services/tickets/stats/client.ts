import type { TicketStats } from './ticket';
import type { UserTicketStats } from '@/services/users/stats/user';

export async function fetchTicketStatsClient(ticketId: string): Promise<TicketStats | null> {
  if (!ticketId) return null;
  try {
    const response = await fetch(`/api/tickets/${ticketId}/stats`);
    if (!response.ok) {
      return null;
    }
    const result = await response.json();
    return result.data;
  } catch {
    return null;
  }
}

export async function fetchTicketStatsBatchClient(
  ticketIds: string[]
): Promise<Record<string, TicketStats | null>> {
  if (!ticketIds.length) return {};
  const response = await fetch('/api/tickets/stats/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticketIds })
  });
  if (!response.ok) {
    return {};
  }
  const result = await response.json();
  return (result.data || {}) as Record<string, TicketStats | null>;
}

export async function fetchUserStatsClient(
  profileId: string,
  type: 'reporter' | 'assigned'
): Promise<UserTicketStats | null> {
  if (!profileId) return null;
  try {
    const response = await fetch(`/api/users/${profileId}/stats?type=${type}`);
    if (!response.ok) {
      return null;
    }
    const result = await response.json();
    return result.data;
  } catch {
    return null;
  }
}

export async function fetchUserStatsBatchClient(
  profileIds: string[],
  type: 'reporter' | 'assigned'
): Promise<Record<string, UserTicketStats | null>> {
  if (!profileIds.length) return {};
  const response = await fetch('/api/users/stats/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profileIds, type })
  });
  if (!response.ok) {
    return {};
  }
  const result = await response.json();
  return (result.data || {}) as Record<string, UserTicketStats | null>;
}
