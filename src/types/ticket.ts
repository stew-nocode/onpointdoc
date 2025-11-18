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
  created_at: string;
  updated_at?: string;
  duration_minutes?: number | null;
  customer_context?: string | null;
  team_id?: string | null;
  contact_user_id?: string | null;
};

