/**
 * Types pour les activités avec leurs relations
 * Utilisés après transformation des relations Supabase (tableaux → objets)
 */

import type { Tables } from '@/types';
import { activityTypes, activityStatuses } from '@/lib/validators/activity';

/**
 * Type d'activité (depuis l'enum)
 */
export type ActivityType = (typeof activityTypes)[number];

/**
 * Statut d'activité (depuis l'enum)
 */
export type ActivityStatus = (typeof activityStatuses)[number];

/**
 * Activité de base (sans relations)
 * Utilise le type généré depuis Supabase Tables
 */
export type Activity = Tables<'activities'>;

/**
 * Profile utilisateur simplifié (utilisé dans les relations activités)
 */
export type ActivityUserRelation = {
  id: string;
  full_name: string;
} | null;

/**
 * Participant simplifié (pour activity_participants)
 */
export type ActivityParticipant = {
  user_id: string;
  role: string | null;
  is_invited_external: boolean | null;
  user?: ActivityUserRelation;
};

/**
 * Ticket simplifié (pour tickets liés)
 */
export type ActivityTicketRelation = {
  id: string;
  title: string;
  ticket_type: 'BUG' | 'REQ' | 'ASSISTANCE' | null;
  status: string | null;
  jira_issue_key: string | null;
} | null;

/**
 * Activité avec ses relations transformées (après transformation Supabase)
 */
export type ActivityWithRelations = Activity & {
  created_user?: ActivityUserRelation;
  participants?: ActivityParticipant[];
  linked_tickets?: ActivityTicketRelation[];
};

/**
 * Type de retour pour listActivitiesPaginated
 */
export type ActivitiesPaginatedResult = {
  activities: ActivityWithRelations[];
  hasMore: boolean;
  total: number;
};

/**
 * Type brut retourné par Supabase avant transformation
 * 
 * Supabase retourne les relations comme tableaux ou objets
 * Il faut les transformer en structures attendues
 */
export type SupabaseActivityRaw = Omit<Activity, 'created_user' | 'participants' | 'linked_tickets'> & {
  created_user?: ActivityUserRelation | ActivityUserRelation[];
  activity_participants?: Array<{
    user_id: string;
    role: string | null;
    is_invited_external: boolean | null;
    user?: ActivityUserRelation | ActivityUserRelation[];
  }>;
  ticket_activity_link?: Array<{
    ticket?: ActivityTicketRelation | ActivityTicketRelation[];
  }>;
};

/**
 * Helper pour transformer une relation Supabase (tableau ou objet) en objet unique
 * 
 * Réutilise la fonction de ticket-with-relations.ts pour cohérence
 */
export function transformRelation<T>(relation: T | T[] | null | undefined): T | null {
  if (!relation) return null;
  if (Array.isArray(relation)) {
    return relation.length > 0 ? relation[0] : null;
  }
  return relation;
}

/**
 * Helper pour transformer un tableau de relations en tableau d'objets
 * 
 * Utile pour les relations N:M (participants, tickets liés)
 */
export function transformRelationArray<T>(
  relations: T | T[] | null | undefined
): T[] {
  if (!relations) return [];
  if (Array.isArray(relations)) {
    return relations;
  }
  return [relations];
}
