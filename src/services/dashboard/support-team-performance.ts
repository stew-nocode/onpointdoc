/**
 * Service pour calculer les métriques de performance de l'équipe Support
 * 
 * Utilise React.cache() pour optimiser les performances et éviter les requêtes redondantes
 */

import { cache } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Period } from '@/types/dashboard';
import type { SupportTeamPerformance, SupportAgentMetrics } from '@/types/dashboard-support';

/**
 * Calcule les dates de début et fin selon la période
 */
function getPeriodDates(period: Period): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);
  let start: Date;

  switch (period) {
    case 'week':
      start = new Date(now);
      start.setDate(now.getDate() - 7);
      break;
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'quarter':
      const quarter = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), quarter * 3, 1);
      break;
    case 'year':
      start = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return { start, end };
}

/**
 * Calcule la période précédente pour les tendances
 */
function getPreviousPeriodDates(period: Period): { start: Date; end: Date } {
  const { start: currentEnd, end } = getPeriodDates(period);
  const duration = end.getTime() - currentEnd.getTime();
  const previousEnd = new Date(currentEnd.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - duration);

  return { start: previousStart, end: previousEnd };
}

/**
 * Calcule le MTTR moyen en jours
 */
function calculateMTTR(resolvedTickets: Array<{ created_at: string; resolved_at: string | null }>): number {
  const resolved = resolvedTickets.filter(t => t.resolved_at);
  if (resolved.length === 0) return 0;

  const totalDays = resolved.reduce((sum, ticket) => {
    const created = new Date(ticket.created_at);
    const resolved = new Date(ticket.resolved_at!);
    const days = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    return sum + days;
  }, 0);

  return Math.round((totalDays / resolved.length) * 10) / 10;
}

/**
 * Calcule la tendance en pourcentage
 */
function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Récupère les tickets résolus pour un agent dans une période
 */
async function getAgentResolvedTickets(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  agentId: string,
  startDate: Date,
  endDate: Date
) {
  const { data, error } = await supabase
    .from('tickets')
    .select('id, created_at, resolved_at, ticket_type')
    .eq('assigned_to', agentId)
    .in('status', ['Resolue', 'Terminé', 'Terminé(e)'])
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (error) {
    console.error('[SupportTeamPerformance] Error fetching resolved tickets:', error);
    return [];
  }

  return data || [];
}

/**
 * Récupère les tickets actifs pour un agent
 */
async function getAgentActiveTickets(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  agentId: string
) {
  const { count } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('assigned_to', agentId)
    .not('status', 'in', '(Resolue,Terminé,Terminé(e))');

  return count || 0;
}

/**
 * Récupère les tickets en retard pour un agent
 */
async function getAgentOverdueTickets(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  agentId: string,
  today: Date
) {
  const { count } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('assigned_to', agentId)
    .lt('target_date', today.toISOString().split('T')[0])
    .not('status', 'in', '(Resolue,Terminé,Terminé(e))');

  return count || 0;
}

/**
 * Récupère tous les tickets assignés pour un agent dans une période
 */
async function getAgentAssignedTickets(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  agentId: string,
  startDate: Date,
  endDate: Date
) {
  const { count } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('assigned_to', agentId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  return count || 0;
}

/**
 * Récupère les agents du département Support
 */
async function getSupportAgents(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('department', 'Support')
    .not('role_id', 'is', null);

  if (error) {
    console.error('[SupportTeamPerformance] Error fetching support agents:', error);
    return [];
  }

  return data || [];
}

/**
 * Calcule les métriques pour un agent Support
 */
async function calculateAgentMetrics(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  agentId: string,
  agentName: string,
  periodStart: Date,
  periodEnd: Date,
  previousPeriodStart: Date,
  previousPeriodEnd: Date,
  today: Date
): Promise<SupportAgentMetrics> {
  // Requêtes parallèles pour performance
  const [
    resolvedTickets,
    resolvedTicketsPrevious,
    activeTickets,
    overdueTickets,
    assignedTickets,
  ] = await Promise.all([
    getAgentResolvedTickets(supabase, agentId, periodStart, periodEnd),
    getAgentResolvedTickets(supabase, agentId, previousPeriodStart, previousPeriodEnd),
    getAgentActiveTickets(supabase, agentId),
    getAgentOverdueTickets(supabase, agentId, today),
    getAgentAssignedTickets(supabase, agentId, periodStart, periodEnd),
  ]);

  // Calcul MTTR
  const mttr = calculateMTTR(resolvedTickets);
  const mttrPrevious = calculateMTTR(resolvedTicketsPrevious);

  // Répartition par type
  const byType = {
    BUG: {
      resolved: resolvedTickets.filter(t => t.ticket_type === 'BUG').length,
      mttr: calculateMTTR(resolvedTickets.filter(t => t.ticket_type === 'BUG' && t.resolved_at)),
    },
    REQ: {
      resolved: resolvedTickets.filter(t => t.ticket_type === 'REQ').length,
      mttr: calculateMTTR(resolvedTickets.filter(t => t.ticket_type === 'REQ' && t.resolved_at)),
    },
    ASSISTANCE: {
      resolved: resolvedTickets.filter(t => t.ticket_type === 'ASSISTANCE').length,
      mttr: calculateMTTR(resolvedTickets.filter(t => t.ticket_type === 'ASSISTANCE' && t.resolved_at)),
    },
  };

  // Taux de résolution
  const resolutionRate = assignedTickets > 0
    ? Math.round((resolvedTickets.length / assignedTickets) * 100)
    : 0;

  const resolutionRatePrevious = resolvedTicketsPrevious.length > 0
    ? Math.round((resolvedTicketsPrevious.length / (resolvedTicketsPrevious.length + 1)) * 100)
    : 0;

  // Tendances
  const trend = {
    ticketsResolvedTrend: calculateTrend(resolvedTickets.length, resolvedTicketsPrevious.length),
    mttrTrend: calculateTrend(mttr, mttrPrevious),
    resolutionRateTrend: calculateTrend(resolutionRate, resolutionRatePrevious),
  };

  // Évolution (simplifiée - 7 jours)
  const evolution = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(periodEnd);
    date.setDate(date.getDate() - (6 - i));
    return {
      date: date.toISOString().split('T')[0],
      resolved: 0, // TODO: Calculer par jour si nécessaire
      mttr: mttr,
    };
  });

  return {
    agentId,
    agentName,
    period: {
      start: periodStart.toISOString(),
      end: periodEnd.toISOString(),
    },
    metrics: {
      ticketsResolved: resolvedTickets.length,
      ticketsAssigned: assignedTickets,
      ticketsActive: activeTickets,
      ticketsOverdue: overdueTickets,
      mttr,
      resolutionRate,
      byType,
    },
    trend,
    evolution,
  };
}

/**
 * Calcule les métriques de performance de l'équipe Support
 * 
 * Utilise React.cache() pour mémoïser les résultats pendant le render tree
 * 
 * @param period - Période d'analyse
 * @returns Métriques complètes de l'équipe Support
 */
export const getSupportTeamPerformance = cache(
  async (period: Period): Promise<SupportTeamPerformance> => {
    const supabase = await createSupabaseServerClient();
    const { start, end } = getPeriodDates(period);
    const { start: prevStart, end: prevEnd } = getPreviousPeriodDates(period);
    const today = new Date();

    // Récupérer tous les agents Support
    const agents = await getSupportAgents(supabase);

    // Calculer les métriques pour chaque agent en parallèle
    const agentMetrics = await Promise.all(
      agents.map(agent =>
        calculateAgentMetrics(
          supabase,
          agent.id,
          agent.full_name || 'Agent',
          start,
          end,
          prevStart,
          prevEnd,
          today
        )
      )
    );

    // Métriques globales équipe
    const totalResolved = agentMetrics.reduce((sum, agent) => sum + agent.metrics.ticketsResolved, 0);
    const totalAssigned = agentMetrics.reduce((sum, agent) => sum + agent.metrics.ticketsAssigned, 0);
    const totalActive = agentMetrics.reduce((sum, agent) => sum + agent.metrics.ticketsActive, 0);
    const totalOverdue = agentMetrics.reduce((sum, agent) => sum + agent.metrics.ticketsOverdue, 0);
    const averageMTTR = agentMetrics.length > 0
      ? agentMetrics.reduce((sum, agent) => sum + agent.metrics.mttr, 0) / agentMetrics.length
      : 0;
    const averageResolutionRate = agentMetrics.length > 0
      ? agentMetrics.reduce((sum, agent) => sum + agent.metrics.resolutionRate, 0) / agentMetrics.length
      : 0;

    // Répartition par type
    const byType = {
      BUG: {
        resolved: agentMetrics.reduce((sum, agent) => sum + agent.metrics.byType.BUG.resolved, 0),
        averageMTTR: calculateMTTR(
          agentMetrics.flatMap(agent =>
            agent.metrics.byType.BUG.resolved > 0 ? [{ created_at: start.toISOString(), resolved_at: end.toISOString(), ticket_type: 'BUG' }] : []
          )
        ),
      },
      REQ: {
        resolved: agentMetrics.reduce((sum, agent) => sum + agent.metrics.byType.REQ.resolved, 0),
        averageMTTR: 0, // Simplifié
      },
      ASSISTANCE: {
        resolved: agentMetrics.reduce((sum, agent) => sum + agent.metrics.byType.ASSISTANCE.resolved, 0),
        averageMTTR: 0, // Simplifié
      },
    };

    // Métriques période précédente pour tendances
    // TODO: Calculer période précédente complète si nécessaire
    const teamTrend = {
      totalResolvedTrend: 0,
      averageMTTRTrend: 0,
      averageResolutionRateTrend: 0,
    };

    // Évolution équipe (simplifiée)
    const teamEvolution = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(end);
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toISOString().split('T')[0],
        resolved: Math.round(totalResolved / 7),
        mttr: averageMTTR,
        active: Math.round(totalActive / 7),
      };
    });

    return {
      department: 'support',
      period,
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
      teamMetrics: {
        totalResolved,
        totalAssigned,
        totalActive,
        totalOverdue,
        averageMTTR: Math.round(averageMTTR * 10) / 10,
        averageResolutionRate: Math.round(averageResolutionRate * 10) / 10,
        byType,
      },
      agents: agentMetrics,
      teamTrend,
      teamEvolution,
    };
  }
);


