/**
 * Service pour récupérer les données d'évolution de performance Support dans le temps
 * 
 * ⚠️ IMPORTANT : Ce service est SPÉCIFIQUE au département Support.
 * Pour les autres départements (IT, Marketing, etc.), créer des services similaires
 * car chaque département suit des indicateurs différents.
 * 
 * Utilise React.cache() pour optimiser les performances
 */

import { cache } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Period } from '@/types/dashboard';
import type { SupportEvolutionData, SupportEvolutionDataPoint } from '@/types/dashboard-support-evolution';

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
      start.setHours(0, 0, 0, 0);
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

  end.setHours(23, 59, 59, 999);
  return { start, end };
}

/**
 * Génère toutes les dates entre start et end selon la granularité
 * 
 * - week: jour par jour (7 dates)
 * - month: jour par jour (30-31 dates, mais limitées à ~7-8 dates max)
 * - quarter: par semaine (environ 13 dates)
 * - year: par mois (12 dates - jan, fév, mars, etc.)
 */
function generateDateRange(period: Period, start: Date, end: Date): string[] {
  const dates: string[] = [];
  const current = new Date(start);

  if (period === 'week') {
    // Granularité: jour par jour (7 dates max)
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
  } else if (period === 'month') {
    // Granularité: jour par jour (30-31 dates, mais sera limité plus tard)
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
  } else if (period === 'quarter') {
    // Granularité: semaine par semaine (environ 13 dates)
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 7);
    }
  } else if (period === 'year') {
    // Granularité: par mois (12 dates - 1er jour de chaque mois)
    while (current <= end) {
      // Prendre le 1er jour du mois
      dates.push(new Date(current.getFullYear(), current.getMonth(), 1).toISOString().split('T')[0]);
      // Passer au mois suivant
      current.setMonth(current.getMonth() + 1);
    }
  }

  return dates;
}

/**
 * Récupère les agents du département Support uniquement
 * 
 * ⚠️ Ce filtre est spécifique au Support. Les autres départements (IT, etc.)
 * auront leurs propres widgets avec leurs propres indicateurs.
 */
async function getSupportAgents(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
) {
  // Filtrer strictement par département Support
  // Les autres départements (IT, Marketing, etc.) nécessiteront des widgets séparés
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('department', 'Support') // ⚠️ Filtre strict : Support uniquement
    .not('role_id', 'is', null)
    .eq('is_active', true)
    .order('full_name');

  if (error) {
    console.error('[SupportEvolution] Error fetching agents:', error);
    // Logger plus de détails en développement
    if (process.env.NODE_ENV === 'development') {
      console.error('[SupportEvolution] Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
    }
    return [];
  }

  return data || [];
}

/**
 * Récupère les tickets résolus pour une date (ou période si année)
 * 
 * Si la date est le 1er d'un mois (pour la période 'year'), on récupère tous les tickets du mois
 */
async function getResolvedTicketsForDate(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  date: string,
  agentIds?: string[],
  ticketType?: 'BUG' | 'REQ' | 'ASSISTANCE' | 'all',
  period?: Period
) {
  const dateObj = new Date(date);
  let startTime: Date;
  let endTime: Date;

  // Si c'est la période 'year' et que la date est le 1er du mois, on prend tout le mois
  if (period === 'year' && dateObj.getDate() === 1) {
    // Début du mois
    startTime = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
    startTime.setHours(0, 0, 0, 0);
    // Fin du mois
    endTime = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0);
    endTime.setHours(23, 59, 59, 999);
  } else {
    // Sinon, on prend juste la journée
    startTime = new Date(date);
    startTime.setHours(0, 0, 0, 0);
    endTime = new Date(date);
    endTime.setHours(23, 59, 59, 999);
  }

  let query = supabase
    .from('tickets')
    .select('id, assigned_to, ticket_type, created_at, resolved_at, duration_minutes')
    .in('status', ['Resolue', 'Terminé', 'Terminé(e)'])
    .gte('resolved_at', startTime.toISOString())
    .lte('resolved_at', endTime.toISOString());

  if (agentIds && agentIds.length > 0) {
    query = query.in('assigned_to', agentIds);
  }

  if (ticketType && ticketType !== 'all') {
    query = query.eq('ticket_type', ticketType);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[SupportEvolution] Error fetching resolved tickets:', error);
    return [];
  }

  return data || [];
}

/**
 * Récupère les tickets ouverts pour une date (ou période si année)
 * 
 * Si la date est le 1er d'un mois (pour la période 'year'), on récupère tous les tickets du mois
 */
async function getOpenedTicketsForDate(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  date: string,
  agentIds?: string[],
  ticketType?: 'BUG' | 'REQ' | 'ASSISTANCE' | 'all',
  period?: Period
) {
  const dateObj = new Date(date);
  let startTime: Date;
  let endTime: Date;

  // Si c'est la période 'year' et que la date est le 1er du mois, on prend tout le mois
  if (period === 'year' && dateObj.getDate() === 1) {
    // Début du mois
    startTime = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
    startTime.setHours(0, 0, 0, 0);
    // Fin du mois
    endTime = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0);
    endTime.setHours(23, 59, 59, 999);
  } else {
    // Sinon, on prend juste la journée
    startTime = new Date(date);
    startTime.setHours(0, 0, 0, 0);
    endTime = new Date(date);
    endTime.setHours(23, 59, 59, 999);
  }

  // Construire la requête : exclure les statuts résolus
  // Utiliser la même syntaxe que dans support-team-performance.ts
  let query = supabase
    .from('tickets')
    .select('id, assigned_to, ticket_type')
    .not('status', 'in', '(Resolue,Terminé,Terminé(e))')
    .gte('created_at', startTime.toISOString())
    .lte('created_at', endTime.toISOString());

  if (agentIds && agentIds.length > 0) {
    query = query.in('assigned_to', agentIds);
  }

  if (ticketType && ticketType !== 'all') {
    query = query.eq('ticket_type', ticketType);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[SupportEvolution] Error fetching opened tickets:', error);
    return [];
  }

  return data || [];
}

/**
 * Calcule le MTTR moyen pour une date
 */
function calculateMTTRForDate(tickets: Array<{ created_at: string; resolved_at: string | null }>): number {
  const resolved = tickets.filter(t => t.resolved_at);
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
 * Calcule le temps d'assistance total pour une date
 */
function calculateAssistanceTimeForDate(tickets: Array<{ duration_minutes: number | null }>): number {
  return tickets.reduce((sum, ticket) => {
    return sum + (ticket.duration_minutes || 0);
  }, 0);
}

/**
 * Couleurs pour les lignes des agents (palette cohérente)
 */
const AGENT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
];

/**
 * Récupère les données d'évolution de performance Support
 */
export const getSupportEvolutionData = cache(
  async (
    period: Period,
    ticketType: 'BUG' | 'REQ' | 'ASSISTANCE' | 'all' = 'all',
    agentIds?: string[],
    viewMode: 'team' | 'agent' = 'team'
  ): Promise<SupportEvolutionData> => {
    try {
      const supabase = await createSupabaseServerClient();
      const { start, end } = getPeriodDates(period);
      const dateRange = generateDateRange(period, start, end);

      // Récupérer TOUS les agents (pour permettre la sélection dans les filtres)
      const allAgentsData = await getSupportAgents(supabase);
      
      // Générer les couleurs pour tous les agents (pour affichage dans filtres)
      const allAgents = allAgentsData.map((agent, index) => ({
        id: agent.id,
        name: agent.full_name || 'Inconnu',
        color: AGENT_COLORS[index % AGENT_COLORS.length],
      }));

      // Filtrer les agents pour les calculs si spécifiés
      const agentsForCalculation = agentIds && agentIds.length > 0
        ? allAgents.filter(a => agentIds.includes(a.id))
        : allAgents;

      // Logger en développement
      if (process.env.NODE_ENV === 'development') {
        console.log('[SupportEvolution] Processing:', {
          period,
          ticketType,
          viewMode,
          dateRangeLength: dateRange.length,
          dateRangeSample: dateRange.slice(0, 3),
          agentsCount: allAgents.length,
        });
      }

      // Optimisation : Limiter le nombre de dates pour éviter trop de requêtes parallèles
      // Pour un mois : une date tous les 4-5 jours (max 7-8 dates au lieu de 30-31)
      // Pour une semaine : toutes les dates (7 dates max)
      // Pour un trimestre/année : déjà optimisé (semaines)
      const limitedDateRange = period === 'month' && dateRange.length > 10
        ? dateRange.filter((_, index) => index % Math.ceil(dateRange.length / 7) === 0)
        : period === 'week' 
        ? dateRange // Garder toutes les dates pour la semaine
        : dateRange;

      if (process.env.NODE_ENV === 'development') {
        console.log('[SupportEvolution] Limited date range:', {
          originalLength: dateRange.length,
          limitedLength: limitedDateRange.length,
        });
      }

      // Pour chaque date, récupérer les métriques (avec limitation pour éviter timeout)
      const dataPoints = await Promise.all(
        limitedDateRange.map(async (date) => {
        // Récupérer les tickets résolus et ouverts pour cette date (ou période si année)
        const resolvedTickets = await getResolvedTicketsForDate(
          supabase,
          date,
          viewMode === 'agent' ? agentIds : undefined,
          ticketType,
          period // Passer la période pour gérer le cas 'year' (agrégation par mois)
        );
        const openedTickets = await getOpenedTicketsForDate(
          supabase,
          date,
          viewMode === 'agent' ? agentIds : undefined,
          ticketType,
          period // Passer la période pour gérer le cas 'year' (agrégation par mois)
        );

        if (viewMode === 'team') {
          // Vue équipe : métriques globales
          const mttr = calculateMTTRForDate(resolvedTickets);
          const assistanceTime = calculateAssistanceTimeForDate(
            resolvedTickets.filter(t => t.duration_minutes !== null)
          );

          return {
            date,
            ticketsResolved: resolvedTickets.length,
            ticketsOpened: openedTickets.length,
            totalAssistanceTime: assistanceTime,
            averageMTTR: mttr,
          };
        } else {
          // Vue agent : métriques par agent
          const byAgent: Record<string, {
            agentName: string;
            ticketsResolved: number;
            ticketsOpened: number;
            assistanceTime: number;
            mttr: number;
          }> = {};

          agentsForCalculation.forEach((agent) => {
            const agentResolved = resolvedTickets.filter(t => t.assigned_to === agent.id);
            const agentOpened = openedTickets.filter(t => t.assigned_to === agent.id);
            const agentMttr = calculateMTTRForDate(agentResolved);
            const agentAssistanceTime = calculateAssistanceTimeForDate(
              agentResolved.filter(t => t.duration_minutes !== null)
            );

            byAgent[agent.id] = {
              agentName: agent.name,
              ticketsResolved: agentResolved.length,
              ticketsOpened: agentOpened.length,
              assistanceTime: agentAssistanceTime,
              mttr: agentMttr,
            };
          });

          return {
            date,
            byAgent,
          };
        }
        })
      );

      return {
        period,
        periodStart: start.toISOString(),
        periodEnd: end.toISOString(),
        selectedAgents: agentIds,
        selectedDimensions: [], // TODO: Map ticketType to dimensions
        data: dataPoints as unknown as SupportEvolutionDataPoint[],
        agents: allAgents, // Retourner tous les agents pour les filtres
      };
    } catch (error) {
      console.error('[SupportEvolution] Error in getSupportEvolutionData:', error);
      
      // Logger les détails en développement
      if (process.env.NODE_ENV === 'development') {
        console.error('[SupportEvolution] Error details:', {
          error,
          type: typeof error,
          isError: error instanceof Error,
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          stringified: JSON.stringify(error, Object.getOwnPropertyNames(error instanceof Error ? error : {})),
        });
      }
      
      // Créer une erreur claire si ce n'est pas déjà une Error
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error(`Erreur lors de la récupération des données d'évolution Support: ${String(error)}`);
      }
    }
  }
);

