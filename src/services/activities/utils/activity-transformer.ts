/**
 * Utilitaires pour transformer les activités depuis Supabase
 * 
 * Optimisé pour éviter JSON.parse(JSON.stringify()) coûteux.
 * Respecte Clean Code : fonctions courtes, types explicites.
 * Pattern similaire à ticket-transformer.ts pour cohérence
 */

import type { SupabaseActivityRaw } from '@/types/activity-with-relations';
import type { ActivityWithRelations, ActivityParticipant, ActivityTicketRelation } from '@/types/activity-with-relations';
import { transformRelation } from '@/types/activity-with-relations';

/**
 * Normalise une date en string ISO
 * 
 * @returns string ISO ou null si date est falsy
 */
function normalizeDate(date: unknown): string | null {
  if (!date) return null;
  if (typeof date === 'string') return date;
  if (date instanceof Date) return date.toISOString();
  return String(date);
}

/**
 * Transforme une relation user (profile) en ActivityUserRelation
 */
function transformUserRelation(user: unknown): ActivityWithRelations['created_user'] {
  const transformed = transformRelation(user);
  
  if (!transformed || typeof transformed !== 'object' || !('id' in transformed) || !('full_name' in transformed)) {
    return null;
  }
  
  return {
    id: String(transformed.id),
    full_name: String(transformed.full_name),
  };
}

/**
 * Transforme un participant avec sa relation user
 */
function transformParticipant(participant: {
  user_id: string;
  role: string | null;
  is_invited_external: boolean | null;
  user?: unknown;
}): ActivityParticipant {
  const transformed: ActivityParticipant = {
    user_id: String(participant.user_id),
    role: participant.role ? String(participant.role) : null,
    is_invited_external: participant.is_invited_external ?? null,
  };
  
  // Transformer la relation user si présente
  if (participant.user) {
    transformed.user = transformUserRelation(participant.user);
  }
  
  return transformed;
}

/**
 * Transforme un ticket lié en ActivityTicketRelation
 */
function transformLinkedTicket(ticket: unknown): ActivityTicketRelation {
  const transformed = transformRelation(ticket);
  
  if (!transformed || typeof transformed !== 'object') {
    return null;
  }
  
  if (!('id' in transformed) || !('title' in transformed)) {
    return null;
  }
  
  const ticketObj = transformed as {
    id: unknown;
    title: unknown;
    ticket_type?: unknown;
    status?: unknown;
    jira_issue_key?: unknown;
  };
  
  return {
    id: String(ticketObj.id),
    title: String(ticketObj.title),
    ticket_type: ticketObj.ticket_type 
      ? (String(ticketObj.ticket_type) as 'BUG' | 'REQ' | 'ASSISTANCE')
      : null,
    status: ticketObj.status ? String(ticketObj.status) : null,
    jira_issue_key: ticketObj.jira_issue_key ? String(ticketObj.jira_issue_key) : null,
  };
}

/**
 * Transforme une activité brute depuis Supabase en ActivityWithRelations
 * 
 * Optimisé : Pas de JSON.parse(JSON.stringify()), transformations directes
 */
export function transformActivity(activity: SupabaseActivityRaw): ActivityWithRelations {
  // Transformer created_user
  const createdUser = transformUserRelation(activity.created_user);
  
  // Transformer les participants (tableau de relations N:M)
  // activity_participants peut être un tableau ou un objet unique depuis Supabase
  const participantsRaw = activity.activity_participants;
  let participants: ActivityParticipant[] = [];
  
  if (participantsRaw) {
    // Normaliser en tableau
    const participantsArray = Array.isArray(participantsRaw) ? participantsRaw : [participantsRaw];
    
    participants = participantsArray
      .filter((p): p is typeof p & { user_id: string } => 
        typeof p === 'object' && p !== null && 'user_id' in p
      )
      .map((participant) => transformParticipant(participant as {
        user_id: string;
        role: string | null;
        is_invited_external: boolean | null;
        user?: unknown;
      }));
  }
  
  // Transformer les tickets liés (via ticket_activity_link)
  // ticket_activity_link peut être un tableau ou un objet unique depuis Supabase
  const ticketLinksRaw = activity.ticket_activity_link;
  let linkedTickets: ActivityTicketRelation[] = [];
  
  if (ticketLinksRaw) {
    // Normaliser en tableau
    const ticketLinksArray = Array.isArray(ticketLinksRaw) ? ticketLinksRaw : [ticketLinksRaw];
    
    linkedTickets = ticketLinksArray
      .map((link) => {
        if (
          typeof link === 'object' &&
          link !== null &&
          'ticket' in link &&
          link.ticket
        ) {
          return transformLinkedTicket(link.ticket);
        }
        return null;
      })
      .filter((ticket): ticket is ActivityTicketRelation => ticket !== null);
  }
  
  // Créer l'activité transformée directement (pas de JSON.parse/stringify)
  return {
    id: activity.id,
    title: String(activity.title),
    activity_type: activity.activity_type,
    planned_start: normalizeDate(activity.planned_start),
    planned_end: normalizeDate(activity.planned_end),
    location_mode: activity.location_mode || null,
    report_content: activity.report_content ? String(activity.report_content) : null,
    created_by: activity.created_by ? String(activity.created_by) : null,
    status: activity.status,
    validated_by_manager: activity.validated_by_manager ?? null,
    team_id: activity.team_id ? String(activity.team_id) : null,
    created_at: normalizeDate(activity.created_at),
    updated_at: normalizeDate(activity.updated_at),
    // Relations transformées
    created_user: createdUser,
    participants: participants.length > 0 ? participants : undefined,
    linked_tickets: linkedTickets.length > 0 ? linkedTickets : undefined,
  } satisfies ActivityWithRelations;
}
