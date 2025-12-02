import { cache } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { OperationalAlert } from '@/types/dashboard';
import {
  UNASSIGNED_ALERT_DAYS,
  UPCOMING_ACTIVITY_DAYS,
  MAX_ALERTS_PER_TYPE,
  ALERT_PRIORITY_ORDER,
} from './constants/alert-constants';

/**
 * Récupère les alertes opérationnelles critiques
 * 
 * ⚠️ IMPORTANT : Cette fonction utilise `cookies()` via `createSupabaseServerClient()`,
 * donc elle ne peut PAS utiliser `unstable_cache()`. On utilise uniquement `React.cache()`
 * pour éviter les appels redondants dans le même render tree.
 * 
 * @returns Liste des alertes (tickets en retard, non assignés, activités, tâches)
 */
async function getOperationalAlertsInternal(): Promise<OperationalAlert[]> {
  const [overdueAlerts, unassignedAlerts, activityAlerts, taskAlerts] = 
    await Promise.all([
      getOverdueCriticalTickets(),
      getUnassignedLongTickets(),
      getUpcomingActivities(),
      getBlockedTasks(),
    ]);

  return sortAlertsByPriority([
    ...overdueAlerts,
    ...unassignedAlerts,
    ...activityAlerts,
    ...taskAlerts,
  ]);
}

/**
 * Récupère les tickets en retard critiques (priorité haute)
 */
async function getOverdueCriticalTickets(): Promise<OperationalAlert[]> {
  const supabase = await createSupabaseServerClient();
  const now = new Date().toISOString();

  const { data: overdueTickets } = await supabase
    .from('tickets')
    .select('id, title, priority, due_date')
    .or(`resolved_at.is.null,resolved_at.gt.${now}`)
    .lt('due_date', now)
    .in('priority', ['HIGH', 'CRITICAL']);

  if (!overdueTickets) return [];

  return overdueTickets.map((ticket) => ({
    id: `overdue-${ticket.id}`,
    type: 'overdue_critical' as const,
    title: `Ticket en retard: ${ticket.title}`,
    description: `Priorité ${ticket.priority} - Date limite dépassée`,
    priority: 'high' as const,
    createdAt: ticket.due_date || new Date().toISOString(),
    relatedId: ticket.id,
  }));
}

/**
 * Récupère les tickets non assignés depuis plus de X jours
 */
async function getUnassignedLongTickets(): Promise<OperationalAlert[]> {
  const supabase = await createSupabaseServerClient();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - UNASSIGNED_ALERT_DAYS);
  const now = new Date().toISOString();

  const { data: unassignedTickets } = await supabase
    .from('tickets')
    .select('id, title, created_at')
    .is('assigned_to', null)
    .or(`resolved_at.is.null,resolved_at.gt.${now}`)
    .lt('created_at', cutoffDate.toISOString());

  if (!unassignedTickets) return [];

  return unassignedTickets.map((ticket) => ({
    id: `unassigned-${ticket.id}`,
    type: 'unassigned_long' as const,
    title: `Ticket non assigné: ${ticket.title}`,
    description: `Non assigné depuis plus de ${UNASSIGNED_ALERT_DAYS} jours`,
    priority: 'medium' as const,
    createdAt: ticket.created_at,
    relatedId: ticket.id,
  }));
}

/**
 * Récupère les activités à venir dans les X prochains jours
 */
async function getUpcomingActivities(): Promise<OperationalAlert[]> {
  const supabase = await createSupabaseServerClient();
  const now = new Date();
  const endDate = new Date();
  endDate.setDate(now.getDate() + UPCOMING_ACTIVITY_DAYS);

  const { data: upcomingActivities } = await supabase
    .from('activities')
    .select('id, title, scheduled_date')
    .gte('scheduled_date', now.toISOString())
    .lte('scheduled_date', endDate.toISOString())
    .order('scheduled_date', { ascending: true })
    .limit(MAX_ALERTS_PER_TYPE);

  if (!upcomingActivities) return [];

  return upcomingActivities.map((activity) => ({
    id: `activity-${activity.id}`,
    type: 'upcoming_activity' as const,
    title: `Activité à venir: ${activity.title}`,
    description: `Prévue le ${new Date(activity.scheduled_date).toLocaleDateString('fr-FR')}`,
    priority: 'low' as const,
    createdAt: activity.scheduled_date,
    relatedId: activity.id,
  }));
}

/**
 * Récupère les tâches bloquées
 */
async function getBlockedTasks(): Promise<OperationalAlert[]> {
  const supabase = await createSupabaseServerClient();

  const { data: blockedTasks } = await supabase
    .from('tasks')
    .select('id, title, status')
    .eq('status', 'BLOQUE')
    .limit(MAX_ALERTS_PER_TYPE);

  if (!blockedTasks) return [];

  return blockedTasks.map((task) => ({
    id: `task-${task.id}`,
    type: 'blocked_task' as const,
    title: `Tâche bloquée: ${task.title}`,
    description: 'Nécessite une attention',
    priority: 'medium' as const,
    createdAt: new Date().toISOString(),
    relatedId: task.id,
  }));
}

/**
 * Trie les alertes par priorité (high > medium > low)
 */
function sortAlertsByPriority(alerts: OperationalAlert[]): OperationalAlert[] {
  return alerts.sort((a, b) => {
    return ALERT_PRIORITY_ORDER[a.priority] - ALERT_PRIORITY_ORDER[b.priority];
  });
}

/**
 * Version exportée avec React.cache() pour éviter les appels redondants
 * dans le même render tree
 * 
 * ⚠️ NOTE : On n'utilise pas `unstable_cache()` car cette fonction utilise
 * `cookies()` via `createSupabaseServerClient()`, ce qui n'est pas supporté
 * dans les fonctions mises en cache avec `unstable_cache()`.
 */
export const getOperationalAlerts = cache(getOperationalAlertsInternal);
