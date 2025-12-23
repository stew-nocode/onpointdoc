/**
 * Service de statistiques de synchronisation JIRA
 * 
 * Fournit des métriques et statistiques sur l'état de la synchronisation
 * entre Supabase et JIRA.
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';

export interface JiraSyncStats {
  totalSyncedTickets: number;
  syncedToday: number;
  syncedThisWeek: number;
  syncErrors: number;
  lastSyncTime: string | null;
  ticketsByOrigin: {
    supabase: number;
    jira: number;
  };
  ticketsByStatus: {
    status: string;
    count: number;
  }[];
}

export interface SyncError {
  ticketId: string;
  jiraIssueKey: string | null;
  error: string;
  lastSyncedAt: string | null;
  ticketTitle: string | null;
}

export interface RecentSync {
  ticketId: string;
  jiraIssueKey: string | null;
  lastSyncedAt: string;
  ticketTitle: string | null;
  origin: string | null;
  jiraStatus: string | null;
}

/**
 * Récupère les statistiques de synchronisation JIRA
 */
export async function getJiraSyncStats(): Promise<JiraSyncStats> {
  const supabase = await createSupabaseServerClient();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Total des tickets synchronisés
  const { count: totalSyncedTickets } = await supabase
    .from('jira_sync')
    .select('*', { count: 'exact', head: true })
    .not('jira_issue_key', 'is', null);

  // Tickets synchronisés aujourd'hui
  const { count: syncedToday } = await supabase
    .from('jira_sync')
    .select('*', { count: 'exact', head: true })
    .gte('last_synced_at', todayStart);

  // Tickets synchronisés cette semaine
  const { count: syncedThisWeek } = await supabase
    .from('jira_sync')
    .select('*', { count: 'exact', head: true })
    .gte('last_synced_at', weekStart);

  // Tickets avec erreurs de synchronisation
  const { count: syncErrors } = await supabase
    .from('jira_sync')
    .select('*', { count: 'exact', head: true })
    .not('sync_error', 'is', null);

  // Dernière synchronisation
  const { data: lastSync } = await supabase
    .from('jira_sync')
    .select('last_synced_at')
    .order('last_synced_at', { ascending: false })
    .limit(1)
    .single();

  // Tickets par origine
  const { count: fromSupabase } = await supabase
    .from('jira_sync')
    .select('*', { count: 'exact', head: true })
    .eq('origin', 'supabase');

  const { count: fromJira } = await supabase
    .from('jira_sync')
    .select('*', { count: 'exact', head: true })
    .eq('origin', 'jira');

  // Tickets par statut JIRA
  const { data: statusData } = await supabase
    .from('jira_sync')
    .select('jira_status')
    .not('jira_status', 'is', null);

  const statusCounts: Record<string, number> = {};
  statusData?.forEach((item) => {
    const status = item.jira_status as string;
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  const ticketsByStatus = Object.entries(statusCounts)
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalSyncedTickets: totalSyncedTickets ?? 0,
    syncedToday: syncedToday ?? 0,
    syncedThisWeek: syncedThisWeek ?? 0,
    syncErrors: syncErrors ?? 0,
    lastSyncTime: lastSync?.last_synced_at ?? null,
    ticketsByOrigin: {
      supabase: fromSupabase ?? 0,
      jira: fromJira ?? 0,
    },
    ticketsByStatus,
  };
}

/**
 * Récupère les erreurs de synchronisation récentes
 */
export async function getRecentSyncErrors(limit = 10): Promise<SyncError[]> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from('jira_sync')
    .select(`
      ticket_id,
      jira_issue_key,
      sync_error,
      last_synced_at,
      tickets!inner(title)
    `)
    .not('sync_error', 'is', null)
    .order('last_synced_at', { ascending: false })
    .limit(limit);

  if (!data) return [];

  return data.map((item) => {
    const ticketData = item.tickets as unknown;
    const tickets = Array.isArray(ticketData)
      ? ticketData[0]
      : ticketData as { title: string } | null;

    return {
      ticketId: item.ticket_id,
      jiraIssueKey: item.jira_issue_key,
      error: item.sync_error ?? 'Erreur inconnue',
      lastSyncedAt: item.last_synced_at,
      ticketTitle: tickets?.title ?? null,
    };
  });
}

/**
 * Récupère les synchronisations récentes
 */
export async function getRecentSyncs(limit = 20): Promise<RecentSync[]> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from('jira_sync')
    .select(`
      ticket_id,
      jira_issue_key,
      last_synced_at,
      origin,
      jira_status,
      tickets!inner(title)
    `)
    .not('last_synced_at', 'is', null)
    .is('sync_error', null)
    .order('last_synced_at', { ascending: false })
    .limit(limit);

  if (!data) return [];

  return data.map((item) => {
    const ticketData = item.tickets as unknown;
    const tickets = Array.isArray(ticketData)
      ? ticketData[0]
      : ticketData as { title: string } | null;

    return {
      ticketId: item.ticket_id,
      jiraIssueKey: item.jira_issue_key,
      lastSyncedAt: item.last_synced_at ?? '',
      ticketTitle: tickets?.title ?? null,
      origin: item.origin,
      jiraStatus: item.jira_status,
    };
  });
}

