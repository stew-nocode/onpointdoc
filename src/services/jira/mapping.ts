import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Types pour les mappings Jira
 */
export type TicketType = 'BUG' | 'REQ' | 'ASSISTANCE';
export type SupabaseStatus = string; // Accepte tous les statuts (JIRA bruts ou locaux)
export type SupabasePriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface JiraStatusMapping {
  id: string;
  jira_status_name: string;
  supabase_status: SupabaseStatus;
  ticket_type: TicketType;
  created_at: string;
  updated_at: string;
}

export interface JiraPriorityMapping {
  id: string;
  jira_priority_name: string;
  supabase_priority: SupabasePriority;
  created_at: string;
  updated_at: string;
}

/**
 * Récupère le statut Supabase correspondant à un statut Jira
 * 
 * Pour BUG et REQ: retourne directement le statut JIRA brut (stockage direct)
 * Pour ASSISTANCE: utilise le mapping pour convertir en statut local ou JIRA selon le contexte
 * 
 * @param jiraStatus - Nom du statut Jira (ex: "Sprint Backlog", "Traitement en Cours")
 * @param ticketType - Type de ticket (BUG, REQ, ASSISTANCE)
 * @returns Le statut Supabase correspondant (statut JIRA brut pour BUG/REQ, ou statut mappé pour ASSISTANCE)
 */
export async function getSupabaseStatusFromJira(
  jiraStatus: string,
  ticketType: TicketType
): Promise<SupabaseStatus | null> {
  // Pour BUG et REQ, on stocke directement les statuts JIRA bruts
  if (ticketType === 'BUG' || ticketType === 'REQ') {
    return jiraStatus;
  }

  // Pour ASSISTANCE, on utilise le mapping pour déterminer le statut
  // Si le ticket est transféré, on utilise le statut JIRA brut
  // Sinon, on utilise le mapping vers les statuts locaux
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('jira_status_mapping')
    .select('supabase_status')
    .eq('jira_status_name', jiraStatus)
    .eq('ticket_type', ticketType)
    .single();

  if (error || !data) {
    // Si aucun mapping trouvé, retourner le statut JIRA brut (cas d'un ASSISTANCE transféré)
    console.warn(`Aucun mapping trouvé pour le statut Jira "${jiraStatus}" (type: ${ticketType}), utilisation du statut JIRA brut`);
    return jiraStatus;
  }

  // Si le mapping retourne un statut JIRA (même valeur), c'est qu'on doit stocker le statut JIRA brut
  // Sinon, c'est un mapping vers un statut local
  const mappedStatus = data.supabase_status as string;
  
  // Si le mapping retourne la même valeur que le statut JIRA, c'est qu'on stocke directement
  if (mappedStatus === jiraStatus) {
    return jiraStatus;
  }
  
  return mappedStatus;
}

/**
 * Récupère la priorité Supabase correspondante à une priorité Jira
 * 
 * @param jiraPriority - Nom de la priorité Jira (ex: "Priorité 1", "Priorité 2")
 * @returns La priorité Supabase correspondante ou null si aucun mapping trouvé
 */
export async function getSupabasePriorityFromJira(
  jiraPriority: string
): Promise<SupabasePriority | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('jira_priority_mapping')
    .select('supabase_priority')
    .eq('jira_priority_name', jiraPriority)
    .single();

  if (error || !data) {
    console.warn(`Aucun mapping trouvé pour la priorité Jira "${jiraPriority}"`);
    return null;
  }

  return data.supabase_priority as SupabasePriority;
}

/**
 * Récupère tous les mappings de statuts
 * 
 * @returns Liste de tous les mappings de statuts
 */
export async function getAllStatusMappings(): Promise<JiraStatusMapping[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('jira_status_mapping')
    .select('*')
    .order('ticket_type', { ascending: true })
    .order('jira_status_name', { ascending: true });

  if (error) {
    console.error('Erreur lors de la récupération des mappings de statuts:', error);
    return [];
  }

  return data || [];
}

/**
 * Récupère tous les mappings de priorités
 * 
 * @returns Liste de tous les mappings de priorités
 */
export async function getAllPriorityMappings(): Promise<JiraPriorityMapping[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('jira_priority_mapping')
    .select('*')
    .order('jira_priority_name', { ascending: true });

  if (error) {
    console.error('Erreur lors de la récupération des mappings de priorités:', error);
    return [];
  }

  return data || [];
}

/**
 * Ajoute un nouveau mapping de statut
 * 
 * @param jiraStatus - Nom du statut Jira
 * @param supabaseStatus - Statut Supabase correspondant
 * @param ticketType - Type de ticket concerné
 * @returns Le mapping créé
 */
export async function createStatusMapping(
  jiraStatus: string,
  supabaseStatus: SupabaseStatus,
  ticketType: TicketType
): Promise<JiraStatusMapping | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('jira_status_mapping')
    .insert({
      jira_status_name: jiraStatus,
      supabase_status: supabaseStatus,
      ticket_type: ticketType
    })
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la création du mapping de statut:', error);
    return null;
  }

  return data;
}

/**
 * Ajoute un nouveau mapping de priorité
 * 
 * @param jiraPriority - Nom de la priorité Jira
 * @param supabasePriority - Priorité Supabase correspondante
 * @returns Le mapping créé
 */
export async function createPriorityMapping(
  jiraPriority: string,
  supabasePriority: SupabasePriority
): Promise<JiraPriorityMapping | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('jira_priority_mapping')
    .insert({
      jira_priority_name: jiraPriority,
      supabase_priority: supabasePriority
    })
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la création du mapping de priorité:', error);
    return null;
  }

  return data;
}

