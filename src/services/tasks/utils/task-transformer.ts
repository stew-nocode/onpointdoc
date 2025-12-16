/**
 * Utilitaires pour transformer les tâches depuis Supabase
 * 
 * Optimisé pour éviter JSON.parse(JSON.stringify()) coûteux.
 * Respecte Clean Code : fonctions courtes, types explicites.
 * Pattern similaire à activity-transformer.ts pour cohérence
 * 
 * Différences avec activity-transformer :
 * - assigned_user (1:1) au lieu de participants (N:M)
 * - linked_tickets via ticket_task_link
 * - linked_activities via activity_task_link
 */

import type { SupabaseTaskRaw } from '@/types/task-with-relations';
import type { 
  TaskWithRelations, 
  TaskUserRelation, 
  TaskTicketRelation,
  TaskActivityRelation
} from '@/types/task-with-relations';
import { transformTaskRelation, transformTaskRelationArray } from '@/types/task-with-relations';

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
 * Transforme une relation user (profile) en TaskUserRelation
 */
function transformUserRelation(user: unknown): TaskUserRelation {
  const transformed = transformTaskRelation(user);
  
  if (!transformed || typeof transformed !== 'object' || !('id' in transformed) || !('full_name' in transformed)) {
    return null;
  }
  
  return {
    id: String(transformed.id),
    full_name: String(transformed.full_name),
  };
}

/**
 * Transforme un ticket lié en TaskTicketRelation
 */
function transformLinkedTicket(ticket: unknown): TaskTicketRelation {
  const transformed = transformTaskRelation(ticket);
  
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
 * Transforme une activité liée en TaskActivityRelation
 */
function transformLinkedActivity(activity: unknown): TaskActivityRelation {
  const transformed = transformTaskRelation(activity);
  
  if (!transformed || typeof transformed !== 'object') {
    return null;
  }
  
  if (!('id' in transformed) || !('title' in transformed)) {
    return null;
  }
  
  const activityObj = transformed as {
    id: unknown;
    title: unknown;
    activity_type?: unknown;
    status?: unknown;
  };
  
  return {
    id: String(activityObj.id),
    title: String(activityObj.title),
    activity_type: activityObj.activity_type ? String(activityObj.activity_type) : null,
    status: activityObj.status ? String(activityObj.status) : null,
  };
}

/**
 * Transforme les liens de tickets depuis Supabase en tableau de TaskTicketRelation
 * 
 * @param ticketLinksRaw - Données brutes des liens tickets depuis Supabase
 * @returns Tableau de tickets liés
 */
function transformTicketLinks(
  ticketLinksRaw: SupabaseTaskRaw['ticket_task_link']
): TaskTicketRelation[] {
  if (!ticketLinksRaw) {
    return [];
  }

  const ticketLinksArray = transformTaskRelationArray(ticketLinksRaw);
  
  return ticketLinksArray
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
    .filter((ticket): ticket is TaskTicketRelation => ticket !== null);
}

/**
 * Transforme les liens d'activités depuis Supabase en tableau de TaskActivityRelation
 * 
 * @param activityLinksRaw - Données brutes des liens activités depuis Supabase
 * @returns Tableau d'activités liées
 */
function transformActivityLinks(
  activityLinksRaw: SupabaseTaskRaw['activity_task_link']
): TaskActivityRelation[] {
  if (!activityLinksRaw) {
    return [];
  }

  const activityLinksArray = transformTaskRelationArray(activityLinksRaw);
  
  return activityLinksArray
    .map((link) => {
      if (
        typeof link === 'object' &&
        link !== null &&
        'activity' in link &&
        link.activity
      ) {
        return transformLinkedActivity(link.activity);
      }
      return null;
    })
    .filter((activity): activity is TaskActivityRelation => activity !== null);
}

/**
 * Transforme une tâche brute depuis Supabase en TaskWithRelations
 * 
 * Optimisé : Pas de JSON.parse(JSON.stringify()), transformations directes
 */
export function transformTask(task: SupabaseTaskRaw): TaskWithRelations {
  // Transformer les relations 1:1
  const createdUser = transformUserRelation(task.created_user);
  const assignedUser = transformUserRelation(task.assigned_user);
  
  // Transformer les relations N:M
  const linkedTickets = transformTicketLinks(task.ticket_task_link);
  const linkedActivities = transformActivityLinks(task.activity_task_link);
  
  // Créer la tâche transformée directement (pas de JSON.parse/stringify)
  return {
    id: task.id,
    title: String(task.title),
    description: task.description ? String(task.description) : null,
    due_date: normalizeDate(task.due_date),
    is_planned: task.is_planned ?? false,
    status: task.status,
    created_by: task.created_by ? String(task.created_by) : null,
    assigned_to: task.assigned_to ? String(task.assigned_to) : null,
    validated_by_manager: task.validated_by_manager ?? null,
    team_id: task.team_id ? String(task.team_id) : null,
    report_content: task.report_content ? String(task.report_content) : null,
    created_at: normalizeDate(task.created_at),
    updated_at: normalizeDate(task.updated_at),
    // Relations transformées
    created_user: createdUser || undefined,
    assigned_user: assignedUser || undefined,
    linked_tickets: linkedTickets.length > 0 ? linkedTickets : undefined,
    linked_activities: linkedActivities.length > 0 ? linkedActivities : undefined,
  } satisfies TaskWithRelations;
}

