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
