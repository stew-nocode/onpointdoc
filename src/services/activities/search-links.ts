/**
 * Service de recherche d'entités liables aux activités
 * 
 * Recherche optimisée avec filtrage par type et recherche par clé
 * Utilise Supabase avec LIMIT pour limiter les résultats
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { LinkableEntity, LinkableEntityType } from '@/types/activity-links';
import { createError } from '@/lib/errors/types';

/**
 * Recherche des tâches correspondant à la clé de recherche
 * 
 * @param searchKey - Clé de recherche (ID, titre, etc.)
 * @param limit - Nombre maximum de résultats
 * @returns Liste des tâches trouvées
 */
async function searchTasks(searchKey: string, limit: number): Promise<LinkableEntity[]> {
  const supabase = await createSupabaseServerClient();
  
  // Échapper les caractères spéciaux pour ilike (%, _)
  const escapedSearch = searchKey.replace(/%/g, '\\%').replace(/_/g, '\\_');
  const searchPattern = `%${escapedSearch}%`;

  const { data, error } = await supabase
    .from('tasks')
    .select('id, title, status, created_at')
    .or(`title.ilike.${searchPattern},id.ilike.${searchPattern}`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw createError('DATABASE_ERROR', `Erreur lors de la recherche de tâches: ${error.message}`);
  }

  return (data || []).map((task) => ({
    id: task.id,
    entityType: 'task' as const,
    displayKey: `TASK-${task.id.substring(0, 8)}`,
    title: task.title,
    metadata: {
      status: task.status || undefined,
      createdAt: task.created_at || undefined
    }
  }));
}

/**
 * Recherche des activités correspondant à la clé de recherche
 * 
 * @param searchKey - Clé de recherche (ID, titre, etc.)
 * @param limit - Nombre maximum de résultats
 * @returns Liste des activités trouvées
 */
async function searchActivities(searchKey: string, limit: number): Promise<LinkableEntity[]> {
  const supabase = await createSupabaseServerClient();
  
  // Échapper les caractères spéciaux pour ilike (%, _)
  const escapedSearch = searchKey.replace(/%/g, '\\%').replace(/_/g, '\\_');
  const searchPattern = `%${escapedSearch}%`;

  const { data, error } = await supabase
    .from('activities')
    .select('id, title, status, activity_type, created_at')
    .or(`title.ilike.${searchPattern},id.ilike.${searchPattern}`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw createError('DATABASE_ERROR', `Erreur lors de la recherche d'activités: ${error.message}`);
  }

  let allResults = data || [];

  // Recherche supplémentaire par ID exact si la clé ressemble à un UUID
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidPattern.test(searchKey)) {
    const { data: idData } = await supabase
      .from('activities')
      .select('id, title, status, activity_type, created_at')
      .eq('id', searchKey)
      .limit(1);
    
    if (idData && idData.length > 0 && !allResults.some(a => a.id === idData[0].id)) {
      // Ajouter le résultat par ID en premier s'il n'est pas déjà dans les résultats
      allResults = [idData[0], ...allResults];
    }
  }

  return allResults.map((activity) => ({
    id: activity.id,
    entityType: 'activity' as const,
    displayKey: `ACT-${activity.id.substring(0, 8)}`,
    title: activity.title,
    metadata: {
      status: activity.status || undefined,
      ticketType: activity.activity_type || undefined,
      createdAt: activity.created_at || undefined
    }
  }));
}

/**
 * Recherche des tickets d'un type donné correspondant à la clé de recherche
 * 
 * @param ticketType - Type de ticket (BUG, ASSISTANCE, REQ)
 * @param searchKey - Clé de recherche (ID, titre, jira_issue_key, etc.)
 * @param limit - Nombre maximum de résultats
 * @returns Liste des tickets trouvés
 */
async function searchTickets(
  ticketType: 'BUG' | 'ASSISTANCE' | 'REQ',
  searchKey: string,
  limit: number
): Promise<LinkableEntity[]> {
  const supabase = await createSupabaseServerClient();
  
  // Échapper les caractères spéciaux pour ilike (%, _)
  const escapedSearch = searchKey.replace(/%/g, '\\%').replace(/_/g, '\\_');
  const searchPattern = `%${escapedSearch}%`;

  // Construire la requête avec recherche sur titre et jira_issue_key
  const { data, error } = await supabase
    .from('tickets')
    .select('id, title, ticket_type, status, priority, jira_issue_key, created_at')
    .eq('ticket_type', ticketType)
    .or(`title.ilike.${searchPattern},jira_issue_key.ilike.${searchPattern}`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw createError('DATABASE_ERROR', `Erreur lors de la recherche de tickets ${ticketType}: ${error.message}`);
  }

  let allResults = data || [];

  // Recherche supplémentaire par ID exact si la clé ressemble à un UUID
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidPattern.test(searchKey)) {
    const { data: idData } = await supabase
      .from('tickets')
      .select('id, title, ticket_type, status, priority, jira_issue_key, created_at')
      .eq('ticket_type', ticketType)
      .eq('id', searchKey)
      .limit(1);
    
    if (idData && idData.length > 0 && !allResults.some(t => t.id === idData[0].id)) {
      // Ajouter le résultat par ID en premier s'il n'est pas déjà dans les résultats
      allResults = [idData[0], ...allResults];
    }
  }

  return allResults.map((ticket) => ({
    id: ticket.id,
    entityType: ticketType.toLowerCase() as 'bug' | 'assistance' | 'request',
    displayKey: ticket.jira_issue_key || `TICKET-${ticket.id.substring(0, 8)}`,
    title: ticket.title,
    metadata: {
      status: ticket.status,
      priority: ticket.priority || undefined,
      ticketType: ticket.ticket_type,
      createdAt: ticket.created_at || undefined
    }
  }));
}

/**
 * Recherche des relances (commentaires de type followup)
 * 
 * @param searchKey - Clé de recherche (ID commentaire, titre du ticket lié, contenu)
 * @param limit - Nombre maximum de résultats
 * @returns Liste des relances trouvées avec informations du ticket lié
 */
async function searchFollowups(searchKey: string, limit: number): Promise<LinkableEntity[]> {
  const supabase = await createSupabaseServerClient();
  
  // Échapper les caractères spéciaux pour ilike (%, _)
  const escapedSearch = searchKey.replace(/%/g, '\\%').replace(/_/g, '\\_');
  const searchPattern = `%${escapedSearch}%`;

  // Rechercher les commentaires de type followup avec jointure sur tickets
  const { data, error } = await supabase
    .from('ticket_comments')
    .select(`
      id,
      ticket_id,
      content,
      created_at,
      tickets!inner(
        id,
        title,
        ticket_type,
        status,
        jira_issue_key
      )
    `)
    .eq('comment_type', 'followup')
    .or(`content.ilike.${searchPattern},id.ilike.${searchPattern}`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw createError('DATABASE_ERROR', `Erreur lors de la recherche de relances: ${error.message}`);
  }

  return (data || [])
    .filter((comment) => comment.tickets) // Filtrer les commentaires sans ticket
    .map((comment) => {
      const ticket = comment.tickets as any; // Type assertion car Supabase retourne un objet
      return {
        id: comment.id,
        entityType: 'followup' as const,
        displayKey: `RELANCE-${comment.id.substring(0, 8)}`,
        title: ticket.title || 'Ticket sans titre',
        metadata: {
          status: ticket.status,
          ticketType: ticket.ticket_type,
          createdAt: comment.created_at || undefined
        }
      };
    });
}

/**
 * Recherche des entités liables selon le type et la clé de recherche
 * 
 * @param entityType - Type d'entité à rechercher
 * @param searchKey - Clé de recherche (minimum 2 caractères)
 * @param limit - Nombre maximum de résultats (défaut: 10)
 * @returns Liste des entités trouvées
 * @throws ApplicationError si la recherche échoue
 */
export async function searchLinkableEntities(
  entityType: LinkableEntityType,
  searchKey: string,
  limit: number = 10
): Promise<LinkableEntity[]> {
  // Validation : au moins 2 caractères pour éviter les recherches vides
  if (!searchKey || searchKey.trim().length < 2) {
    return [];
  }

  const trimmedSearchKey = searchKey.trim();

  switch (entityType) {
    case 'task':
      return searchTasks(trimmedSearchKey, limit);
    case 'bug':
      return searchTickets('BUG', trimmedSearchKey, limit);
    case 'assistance':
      return searchTickets('ASSISTANCE', trimmedSearchKey, limit);
    case 'request':
      return searchTickets('REQ', trimmedSearchKey, limit);
    case 'followup':
      return searchFollowups(trimmedSearchKey, limit);
    case 'activity':
      return searchActivities(trimmedSearchKey, limit);
    default:
      throw createError('BAD_REQUEST', `Type d'entité non supporté: ${entityType}`);
  }
}
