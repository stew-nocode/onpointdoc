import type { BugType } from '@/lib/constants/tickets';

export type TicketStatus = 'Nouveau' | 'En_cours' | 'Transfere' | 'Resolue' | 'To_Do' | 'In_Progress' | 'Done' | 'Closed';
export type TicketType = 'BUG' | 'REQ' | 'ASSISTANCE';
export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type Ticket = {
  id: string;
  title: string;
  description?: string | null;
  ticket_type: TicketType;
  status: TicketStatus;
  priority: TicketPriority;
  canal?: 'Whatsapp' | 'Email' | 'Appel' | 'Autre' | null;
  product_id?: string | null;
  module_id?: string | null;
  submodule_id?: string | null;
  feature_id?: string | null;
  created_by?: string | null;
  assigned_to?: string | null;
  origin?: 'supabase' | 'jira';
  last_update_source?: string | null;
  jira_issue_key?: string | null;
  jira_issue_id?: string | null;
  jira_metadata?: Record<string, any> | null;
  resolution?: string | null;
  fix_version?: string | null;
  // Phase 4: Champs workflow et suivi
  workflow_status?: string | null;
  test_status?: string | null;
  issue_type?: string | null;
  sprint_id?: string | null;
  related_ticket_id?: string | null;
  related_ticket_key?: string | null;
  target_date?: string | null;
  resolved_at?: string | null;
  // Phase 5: Champs spécifiques produits (JSONB)
  custom_fields?: {
    product_specific?: {
      customfield_10297?: string; // OBC - Opérations
      customfield_10298?: string; // OBC - Finance
      customfield_10300?: string; // OBC - RH
      customfield_10299?: string; // OBC - Projets
      customfield_10301?: string; // OBC - CRM
      customfield_10313?: string; // Finance
      customfield_10324?: string; // RH
      customfield_10364?: string; // Paramétrage admin
      [key: string]: string | undefined; // Pour extensibilité
    };
    metadata?: {
      jira_custom_field_ids?: string[];
      last_updated?: string;
    };
  } | null;
  created_at: string;
  updated_at?: string;
  duration_minutes?: number | null;
  customer_context?: string | null;
  team_id?: string | null;
  contact_user_id?: string | null;
  bug_type?: BugType | null;
};

