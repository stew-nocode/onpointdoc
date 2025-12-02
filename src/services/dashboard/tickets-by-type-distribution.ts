/**
 * Service pour récupérer la répartition des tickets par type (BUG, REQ, ASSISTANCE)
 * 
 * Utilisé par le widget pie chart de répartition par type avec filtre agent
 */

import { cache } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Period } from '@/types/dashboard';
import { handleSupabaseError } from '@/lib/errors/handlers';
import { getPeriodDates } from './period-utils';

export type TicketTypeDistribution = {
  BUG: number;
  REQ: number;
  ASSISTANCE: number;
  total: number;
};

export type TicketsByTypeDistributionData = {
  distribution: TicketTypeDistribution;
  agents: Array<{ id: string; name: string }>;
  period: Period | string;
  periodStart: string;
  periodEnd: string;
  selectedAgents?: string[];
};

/**
 * Récupère les agents Support actifs
 */
async function getSupportAgents(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('department', 'Support')
    .eq('is_active', true)
    .order('full_name');

  if (error) {
    console.error('[TicketsByTypeDistribution] Error fetching support agents:', error);
    throw handleSupabaseError(error, 'getSupportAgents');
  }

  return (data || []).map((agent) => ({
    id: agent.id,
    name: agent.full_name || 'Inconnu',
  }));
}

/**
 * Compte les tickets par type pour une période donnée
 * 
 * Utilise une fonction RPC Supabase avec GROUP BY pour une performance optimale
 * Retourne seulement 3 lignes (BUG, REQ, ASSISTANCE) au lieu de tous les tickets
 * 
 * @param supabase - Client Supabase
 * @param startDate - Date de début (ISO string)
 * @param endDate - Date de fin (ISO string)
 * @param agentIds - IDs des agents à filtrer (optionnel, tous si vide)
 * @returns Distribution des tickets par type
 */
async function countTicketsByType(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  startDate: Date,
  endDate: Date,
  agentIds?: string[]
): Promise<TicketTypeDistribution> {
  // Utiliser la fonction RPC optimisée avec GROUP BY
  // Retourne seulement 3 lignes au lieu de tous les tickets
  const { data, error } = await supabase.rpc('count_tickets_by_type', {
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
    agent_ids: agentIds && agentIds.length > 0 ? agentIds : null,
  });

  if (error) {
    console.error('[TicketsByTypeDistribution] Error counting tickets with RPC:', error);
    
    // Fallback vers la méthode précédente si la RPC n'existe pas encore
    console.warn('[TicketsByTypeDistribution] Falling back to direct query');
    return countTicketsByTypeFallback(supabase, startDate, endDate, agentIds);
  }

  // Construire la distribution à partir des résultats GROUP BY
  const distribution: TicketTypeDistribution = {
    BUG: 0,
    REQ: 0,
    ASSISTANCE: 0,
    total: 0,
  };

  if (data && Array.isArray(data)) {
    data.forEach((row: { ticket_type: string; count: number }) => {
      const type = row.ticket_type as 'BUG' | 'REQ' | 'ASSISTANCE';
      const count = Number(row.count) || 0;
      
      if (type === 'BUG' || type === 'REQ' || type === 'ASSISTANCE') {
        distribution[type] = count;
        distribution.total += count;
      }
    });
  }

  return distribution;
}

/**
 * Fallback : compte les tickets par type sans fonction RPC
 * Utilisé si la fonction RPC n'est pas disponible
 */
async function countTicketsByTypeFallback(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  startDate: Date,
  endDate: Date,
  agentIds?: string[]
): Promise<TicketTypeDistribution> {
  let countQuery = supabase
    .from('tickets')
    .select('ticket_type')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .in('ticket_type', ['BUG', 'REQ', 'ASSISTANCE']);

  if (agentIds && agentIds.length > 0) {
    countQuery = countQuery.in('created_by', agentIds);
  }

  const { data: tickets, error } = await countQuery;

  if (error) {
    console.error('[TicketsByTypeDistribution] Error in fallback counting:', error);
    throw handleSupabaseError(error, 'countTicketsByTypeFallback');
  }

  const distribution: TicketTypeDistribution = {
    BUG: 0,
    REQ: 0,
    ASSISTANCE: 0,
    total: 0,
  };

  if (tickets && tickets.length > 0) {
    tickets.forEach((ticket) => {
      const type = ticket.ticket_type;
      if (type === 'BUG' || type === 'REQ' || type === 'ASSISTANCE') {
        distribution[type]++;
        distribution.total++;
      }
    });
  }

  return distribution;
}

/**
 * Récupère la répartition des tickets par type pour une période donnée
 * 
 * @param period - Type de période (week, month, quarter, year) ou année spécifique
 * @param customStartDate - Date de début personnalisée (optionnelle)
 * @param customEndDate - Date de fin personnalisée (optionnelle)
 * @param agentIds - IDs des agents à filtrer (optionnel, tous si vide)
 * @returns Données de répartition avec liste des agents disponibles
 */
async function getTicketsByTypeDistributionInternal(
  period: Period | string,
  customStartDate?: string,
  customEndDate?: string,
  agentIds?: string[]
): Promise<TicketsByTypeDistributionData> {
  try {
    const supabase = await createSupabaseServerClient();

    // Calculer les dates de période
    let start: Date;
    let end: Date;

    if (customStartDate && customEndDate) {
      start = new Date(customStartDate);
      end = new Date(customEndDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else {
      const { startDate, endDate } = getPeriodDates(period);
      start = new Date(startDate);
      end = new Date(endDate);
    }

    const isCustomPeriod = !!customStartDate && !!customEndDate;
    const periodToUse = isCustomPeriod ? 'custom' : period;

    // Récupérer les agents et la distribution en parallèle
    const [agents, distribution] = await Promise.all([
      getSupportAgents(supabase),
      countTicketsByType(supabase, start, end, agentIds),
    ]);

    return {
      distribution,
      agents,
      period: periodToUse,
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
      selectedAgents: agentIds,
    };
  } catch (error) {
    console.error('[TicketsByTypeDistribution] Error:', error);
    throw error;
  }
}

/**
 * Version cachée avec React.cache pour optimiser les performances
 */
export const getTicketsByTypeDistribution = cache(getTicketsByTypeDistributionInternal);

