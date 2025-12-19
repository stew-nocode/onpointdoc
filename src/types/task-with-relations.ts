/**
 * Types pour les tâches avec leurs relations
 * Utilisés après transformation des relations Supabase (tableaux → objets)
 */

import type { Tables } from '@/types';

/**
 * Tâche de base (sans relations)
 * Utilise le type généré depuis Supabase Tables
 */
export type Task = Tables<'tasks'>;

/**
 * Statuts possibles pour une tâche (depuis l'enum task_status_t dans Supabase)
 */
export type TaskStatus = 'A_faire' | 'En_cours' | 'Termine' | 'Annule' | 'Bloque';

/**
 * Profile utilisateur simplifié (utilisé dans les relations tâches)
 */
export type TaskUserRelation = {
  id: string;
  full_name: string;
} | null;

/**
 * Ticket simplifié (pour tickets liés via ticket_task_link)
 */
export type TaskTicketRelation = {
  id: string;
  title: string;
  ticket_type: 'BUG' | 'REQ' | 'ASSISTANCE' | null;
  status: string | null;
  jira_issue_key: string | null;
} | null;

/**
 * Activité simplifiée (pour activités liées via activity_task_link)
 */
export type TaskActivityRelation = {
  id: string;
  title: string;
  activity_type: string | null;
  status: string | null;
} | null;

/**
 * Tâche avec ses relations transformées (après transformation Supabase)
 * 
 * Différences avec ActivityWithRelations :
 * - assigned_user (1:1) au lieu de participants (N:M)
 * - linked_tickets via ticket_task_link (N:M)
 * - linked_activities via activity_task_link (N:M)
 */
export type TaskWithRelations = Task & {
  created_user?: TaskUserRelation;
  assigned_user?: TaskUserRelation;  // Relation directe 1:1 (pas array)
  linked_tickets?: TaskTicketRelation[];
  linked_activities?: TaskActivityRelation[];
};

/**
 * Type de retour pour listTasksPaginated
 */
export type TasksPaginatedResult = {
  tasks: TaskWithRelations[];
  hasMore: boolean;
  total: number;
};

/**
 * Type brut retourné par Supabase avant transformation
 * 
 * Supabase retourne les relations comme tableaux ou objets
 * Il faut les transformer en structures attendues
 */
export type SupabaseTaskRaw = Omit<Task, 'created_user' | 'assigned_user' | 'linked_tickets' | 'linked_activities'> & {
  created_user?: TaskUserRelation | TaskUserRelation[];
  assigned_user?: TaskUserRelation | TaskUserRelation[];  // Peut être array ou objet unique
  ticket_task_link?: Array<{
    ticket?: TaskTicketRelation | TaskTicketRelation[];
  }>;
  activity_task_link?: Array<{
    activity?: TaskActivityRelation | TaskActivityRelation[];
  }>;
};

/**
 * Helper pour transformer une relation Supabase (tableau ou objet) en objet unique
 * 
 * Utile pour les relations 1:1 (created_user, assigned_user)
 */
export function transformTaskRelation<T>(relation: T | T[] | null | undefined): T | null {
  if (!relation) return null;
  if (Array.isArray(relation)) {
    return relation.length > 0 ? relation[0] : null;
  }
  return relation;
}

/**
 * Helper pour transformer un tableau de relations en tableau d'objets
 * 
 * Utile pour les relations N:M (linked_tickets, linked_activities)
 */
export function transformTaskRelationArray<T>(
  relations: T | T[] | null | undefined
): T[] {
  if (!relations) return [];
  if (Array.isArray(relations)) {
    return relations;
  }
  return [relations];
}

