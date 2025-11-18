import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseStatusFromJira, getSupabasePriorityFromJira, TicketType } from './mapping';

/**
 * Interface pour les données Jira issues d'un webhook ou de l'API
 */
export interface JiraIssueData {
  key: string;
  id: string;
  summary: string;
  description?: string;
  status: {
    name: string;
  };
  priority: {
    name: string;
  };
  issuetype: {
    name: string;
  };
  reporter?: {
    accountId: string;
    displayName?: string;
  };
  assignee?: {
    accountId: string;
    displayName?: string;
  };
  resolution?: {
    name: string;
  };
  fixVersions?: Array<{
    name: string;
  }>;
  created: string;
  updated: string;
  labels?: string[];
  components?: Array<{
    name: string;
  }>;
  customfield_10020?: {
    id: string;
    name?: string;
  }; // Sprint
}

/**
 * Synchronise les données d'un ticket Jira vers Supabase
 * 
 * @param ticketId - UUID du ticket Supabase
 * @param jiraData - Données du ticket Jira
 * @returns Le ticket mis à jour
 */
export async function syncJiraToSupabase(
  ticketId: string,
  jiraData: JiraIssueData
): Promise<void> {
  const supabase = createSupabaseServerClient();

  // 1. Déterminer le type de ticket
  const ticketType = mapJiraIssueTypeToTicketType(jiraData.issuetype.name);

  // 2. Mapper le statut Jira vers Supabase
  const supabaseStatus = await getSupabaseStatusFromJira(jiraData.status.name, ticketType);

  // 3. Mapper la priorité Jira vers Supabase
  const supabasePriority = await getSupabasePriorityFromJira(jiraData.priority.name);

  // 4. Mapper les utilisateurs (reporter et assignee)
  const createdBy = jiraData.reporter?.accountId
    ? await mapJiraAccountIdToProfileId(jiraData.reporter.accountId)
    : null;

  const assignedTo = jiraData.assignee?.accountId
    ? await mapJiraAccountIdToProfileId(jiraData.assignee.accountId)
    : null;

  // 5. Préparer les données de mise à jour
  const ticketUpdate: Record<string, any> = {
    title: jiraData.summary,
    description: jiraData.description || null,
    updated_at: jiraData.updated,
    last_update_source: 'jira'
  };

  if (supabaseStatus) {
    ticketUpdate.status = supabaseStatus;
  }

  if (supabasePriority) {
    ticketUpdate.priority = supabasePriority;
  }

  if (createdBy) {
    ticketUpdate.created_by = createdBy;
  }

  if (assignedTo) {
    ticketUpdate.assigned_to = assignedTo;
  }

  if (jiraData.resolution?.name) {
    ticketUpdate.resolution = jiraData.resolution.name;
  }

  if (jiraData.fixVersions && jiraData.fixVersions.length > 0) {
    ticketUpdate.fix_version = jiraData.fixVersions[0].name;
  }

  // 6. Mettre à jour le ticket
  const { error: ticketError } = await supabase
    .from('tickets')
    .update(ticketUpdate)
    .eq('id', ticketId);

  if (ticketError) {
    throw new Error(`Erreur lors de la mise à jour du ticket: ${ticketError.message}`);
  }

  // 7. Mettre à jour jira_sync avec les métadonnées
  const syncMetadata: Record<string, any> = {};
  if (jiraData.labels && jiraData.labels.length > 0) {
    syncMetadata.labels = jiraData.labels;
  }
  if (jiraData.components && jiraData.components.length > 0) {
    syncMetadata.components = jiraData.components.map(c => c.name);
  }

  const jiraSyncUpdate = {
    jira_issue_key: jiraData.key,
    jira_status: jiraData.status.name,
    jira_priority: jiraData.priority.name,
    jira_assignee_account_id: jiraData.assignee?.accountId || null,
    jira_reporter_account_id: jiraData.reporter?.accountId || null,
    jira_resolution: jiraData.resolution?.name || null,
    jira_fix_version: jiraData.fixVersions?.[0]?.name || null,
    jira_sprint_id: jiraData.customfield_10020?.id || null,
    last_status_sync: supabaseStatus ? new Date().toISOString() : null,
    last_priority_sync: supabasePriority ? new Date().toISOString() : null,
    sync_metadata: Object.keys(syncMetadata).length > 0 ? syncMetadata : null,
    last_synced_at: new Date().toISOString(),
    sync_error: null
  };

  const { error: syncError } = await supabase
    .from('jira_sync')
    .upsert({
      ticket_id: ticketId,
      ...jiraSyncUpdate
    }, {
      onConflict: 'ticket_id'
    });

  if (syncError) {
    console.error('Erreur lors de la mise à jour de jira_sync:', syncError);
    // Ne pas faire échouer la synchronisation si jira_sync échoue
  }

  // 8. Enregistrer l'historique de changement de statut si nécessaire
  if (supabaseStatus) {
    // Récupérer l'ancien statut
    const { data: oldTicket } = await supabase
      .from('tickets')
      .select('status')
      .eq('id', ticketId)
      .single();

    if (oldTicket && oldTicket.status !== supabaseStatus) {
      await supabase.from('ticket_status_history').insert({
        ticket_id: ticketId,
        status_from: oldTicket.status,
        status_to: supabaseStatus,
        source: 'jira'
      });
    }
  }
}

/**
 * Mappe le type d'issue Jira vers le type de ticket Supabase
 */
function mapJiraIssueTypeToTicketType(jiraIssueType: string): TicketType {
  const upperType = jiraIssueType.toUpperCase();
  if (upperType.includes('BUG') || upperType.includes('BUG')) {
    return 'BUG';
  }
  if (upperType.includes('REQ') || upperType.includes('REQUEST') || upperType.includes('STORY')) {
    return 'REQ';
  }
  return 'ASSISTANCE';
}

/**
 * Mappe un accountId Jira vers un profile_id Supabase
 * 
 * @param jiraAccountId - AccountId Jira (ex: "712020:bb02e93b-c270-4c40-a166-a19a42e5629a")
 * @returns Le profile_id Supabase ou null si non trouvé
 */
async function mapJiraAccountIdToProfileId(jiraAccountId: string): Promise<string | null> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('jira_user_id', jiraAccountId)
    .single();

  if (error || !data) {
    console.warn(`Aucun profil trouvé pour le jira_user_id "${jiraAccountId}"`);
    return null;
  }

  return data.id;
}

