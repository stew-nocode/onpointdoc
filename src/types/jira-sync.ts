/**
 * Types pour la table jira_sync et les métadonnées de synchronisation Jira
 */

export type Origin = 'supabase' | 'jira';

export interface JiraSync {
  ticket_id: string;
  jira_issue_key?: string | null;
  customfield_supabase_ticket_id?: string | null;
  origin?: Origin | null;
  last_synced_at?: string | null;
  sync_error?: string | null;
  
  // Métadonnées Jira (Phase 1)
  jira_status?: string | null;
  jira_priority?: string | null;
  jira_assignee_account_id?: string | null;
  jira_reporter_account_id?: string | null;
  jira_resolution?: string | null;
  jira_fix_version?: string | null;
  jira_sprint_id?: string | null;
  last_status_sync?: string | null;
  last_priority_sync?: string | null;
  sync_metadata?: {
    labels?: string[];
    components?: string[];
    [key: string]: any;
  } | null;
}

