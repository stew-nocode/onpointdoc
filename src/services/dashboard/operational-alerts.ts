import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { OperationalAlert } from '@/types/dashboard';

/**
 * Récupère les alertes opérationnelles critiques
 * 
 * @returns Liste des alertes (tickets en retard, non assignés, activités, tâches)
 */
export async function getOperationalAlerts(): Promise<OperationalAlert[]> {
  const supabase = await createSupabaseServerClient();
  const alerts: OperationalAlert[] = [];

  // Tickets en retard critiques (priorité haute)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: overdueTickets } = await supabase
    .from('tickets')
    .select('id, title, priority, due_date')
    .or('resolved_at.is.null,resolved_at.gt.' + new Date().toISOString())
    .lt('due_date', new Date().toISOString())
    .in('priority', ['HIGH', 'CRITICAL']);

  overdueTickets?.forEach((ticket) => {
    alerts.push({
      id: `overdue-${ticket.id}`,
      type: 'overdue_critical',
      title: `Ticket en retard: ${ticket.title}`,
      description: `Priorité ${ticket.priority} - Date limite dépassée`,
      priority: 'high',
      createdAt: ticket.due_date || new Date().toISOString(),
      relatedId: ticket.id
    });
  });

  // Tickets non assignés > 7 jours
  const { data: unassignedTickets } = await supabase
    .from('tickets')
    .select('id, title, created_at')
    .is('assigned_to', null)
    .or('resolved_at.is.null,resolved_at.gt.' + new Date().toISOString())
    .lt('created_at', sevenDaysAgo.toISOString());

  unassignedTickets?.forEach((ticket) => {
    alerts.push({
      id: `unassigned-${ticket.id}`,
      type: 'unassigned_long',
      title: `Ticket non assigné: ${ticket.title}`,
      description: 'Non assigné depuis plus de 7 jours',
      priority: 'medium',
      createdAt: ticket.created_at,
      relatedId: ticket.id
    });
  });

  // Activités à venir cette semaine
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  const { data: upcomingActivities } = await supabase
    .from('activities')
    .select('id, title, scheduled_date')
    .gte('scheduled_date', new Date().toISOString())
    .lte('scheduled_date', nextWeek.toISOString())
    .order('scheduled_date', { ascending: true })
    .limit(5);

  upcomingActivities?.forEach((activity) => {
    alerts.push({
      id: `activity-${activity.id}`,
      type: 'upcoming_activity',
      title: `Activité à venir: ${activity.title}`,
      description: `Prévue le ${new Date(activity.scheduled_date).toLocaleDateString('fr-FR')}`,
      priority: 'low',
      createdAt: activity.scheduled_date,
      relatedId: activity.id
    });
  });

  // Tâches bloquées
  const { data: blockedTasks } = await supabase
    .from('tasks')
    .select('id, title, status')
    .eq('status', 'BLOQUE')
    .limit(5);

  blockedTasks?.forEach((task) => {
    alerts.push({
      id: `task-${task.id}`,
      type: 'blocked_task',
      title: `Tâche bloquée: ${task.title}`,
      description: 'Nécessite une attention',
      priority: 'medium',
      createdAt: new Date().toISOString(),
      relatedId: task.id
    });
  });

  return alerts.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

