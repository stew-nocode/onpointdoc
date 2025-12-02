/**
 * Service pour récupérer les données d'évolution Support - VERSION 2 (Refonte)
 * 
 * Widget de tendances globales par dimension (BUG, REQ, ASSISTANCE, Temps, etc.)
 * 
 * ⚠️ IMPORTANT : Ce service est SPÉCIFIQUE au département Support.
 * Pour les autres départements (IT, Marketing, etc.), créer des services similaires.
 * 
 * Utilise React.cache() pour optimiser les performances
 */

import { cache } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Period } from '@/types/dashboard';
import type { SupportEvolutionData, SupportEvolutionDataPoint, SupportDimension } from '@/types/dashboard-support-evolution';
import { handleSupabaseError } from '@/lib/errors/handlers';
import { getPeriodDates as getPeriodDatesFromUtils } from './period-utils';
import {
  countTicketsByDateRanges,
  calculateAssistanceTimeByDateRanges,
} from './support-evolution/ticket-counting-optimized';
import {
  WEEKLY_GRANULARITY_THRESHOLD_DAYS,
  DAYS_PER_WEEK,
  MAX_CHART_POINTS,
  MAX_DATE_ITERATIONS,
} from './support-evolution/constants';

/**
 * Calcule les dates de début et fin selon la période ou année
 * 
 * @deprecated Utiliser getPeriodDatesFromUtils de period-utils.ts à la place
 * Conservé pour compatibilité temporaire
 */
function getPeriodDates(period: Period | string): { start: Date; end: Date } {
  // Utiliser period-utils.ts pour éviter la duplication
  const { startDate, endDate } = getPeriodDatesFromUtils(period);
  return {
    start: new Date(startDate),
    end: new Date(endDate),
  };
}

/**
 * Génère les dates pour le graphique selon la période
 */
function generateDateRange(period: Period | string, start: Date, end: Date): string[] {
  const dates: string[] = [];
  const current = new Date(start);
  
  // Debug: Vérifier les dates d'entrée
  if (process.env.NODE_ENV === 'development') {
    console.log('[SupportEvolutionV2] generateDateRange:', {
      period,
      start: start.toISOString(),
      end: end.toISOString(),
      totalDays: Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
    });
  }

  // Si c'est une année, générer par mois
  if (typeof period === 'string' && /^\d{4}$/.test(period)) {
    while (current <= end) {
      dates.push(new Date(current.getFullYear(), current.getMonth(), 1).toISOString().split('T')[0]);
      current.setMonth(current.getMonth() + 1);
    }
    return dates;
  }

  // Sinon, selon la période
  if (period === 'week') {
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
  } else if (period === 'month') {
    // Générer une date par semaine (~4-5 dates pour un mois)
    // S'assurer d'avoir au moins 2 points pour le graphique
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    // Si la période est très courte (moins de 7 jours), générer une date par jour
    if (totalDays <= 7) {
      while (current <= end) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }
    } else {
      // Pour les périodes plus longues, générer une date par semaine
      const step = Math.max(1, Math.floor(totalDays / MAX_CHART_POINTS));
      let iterationCount = 0;
      
      while (current <= end && iterationCount < MAX_DATE_ITERATIONS) {
        dates.push(current.toISOString().split('T')[0]);
        const nextDate = new Date(current);
        nextDate.setDate(current.getDate() + step);
        
        if (nextDate > end) {
          // S'assurer d'inclure la date de fin
          const endDateStr = end.toISOString().split('T')[0];
          if (dates[dates.length - 1] !== endDateStr) {
            dates.push(endDateStr);
          }
          break;
        }
        current.setDate(current.getDate() + step);
        iterationCount++;
      }
      
      // Si on n'a qu'une seule date, générer au moins 2 points pour le graphique
      if (dates.length === 1 && totalDays > 0) {
        dates.push(end.toISOString().split('T')[0]);
      }
    }
  } else if (period === 'quarter') {
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 7);
    }
  } else if (period === 'year') {
    while (current <= end) {
      dates.push(new Date(current.getFullYear(), current.getMonth(), 1).toISOString().split('T')[0]);
      current.setMonth(current.getMonth() + 1);
    }
  } else if (period === 'custom') {
    // Période personnalisée : adapter la granularité selon la durée
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[SupportEvolutionV2] generateDateRange custom period:', {
        period,
        start: start.toISOString(),
        end: end.toISOString(),
        totalDays,
        current: current.toISOString(),
      });
    }
    
    if (totalDays <= WEEKLY_GRANULARITY_THRESHOLD_DAYS) {
      // Moins de 31 jours : une date par semaine (pour une période d'environ un mois)
      while (current <= end) {
        dates.push(current.toISOString().split('T')[0]);
        const nextDate = new Date(current);
        nextDate.setDate(current.getDate() + DAYS_PER_WEEK);
        
        if (nextDate > end) {
          const endDateStr = end.toISOString().split('T')[0];
          if (dates[dates.length - 1] !== endDateStr) {
            dates.push(endDateStr);
          }
          break;
        }
        current.setDate(current.getDate() + DAYS_PER_WEEK);
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[SupportEvolutionV2] generateDateRange custom (weekly) result:', {
          datesCount: dates.length,
          dates,
        });
      }
    } else {
      // Plus de 30 jours : une date par mois
      while (current <= end) {
        dates.push(new Date(current.getFullYear(), current.getMonth(), 1).toISOString().split('T')[0]);
        current.setMonth(current.getMonth() + 1);
      }
      
      // S'assurer d'inclure la date de fin si elle n'est pas déjà dans la liste
      const endDateStr = end.toISOString().split('T')[0];
      const lastMonthStr = new Date(current.getFullYear(), current.getMonth() - 1, 1).toISOString().split('T')[0];
      if (dates[dates.length - 1] !== endDateStr && endDateStr !== lastMonthStr) {
        // Ajouter la date de fin seulement si elle est dans un mois différent
        const endMonth = new Date(end).getMonth();
        const lastMonth = new Date(dates[dates.length - 1]).getMonth();
        if (endMonth !== lastMonth) {
          dates.push(endDateStr);
        }
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[SupportEvolutionV2] generateDateRange custom (monthly) result:', {
          datesCount: dates.length,
          dates,
        });
      }
    }
  }

  // Debug: Vérifier le résultat
  if (process.env.NODE_ENV === 'development') {
    console.log('[SupportEvolutionV2] generateDateRange result:', {
      datesCount: dates.length,
      firstDate: dates[0],
      lastDate: dates[dates.length - 1],
      allDates: dates,
    });
  }

  return dates;
}

/**
 * Récupère les agents Support
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
    console.error('[SupportEvolutionV2] Error fetching support agents:', {
      error,
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    throw handleSupabaseError(error, 'getSupportAgents');
  }

  return data || [];
}

/**
 * Compte les tickets créés par type pour une période donnée
 * 
 * Optimisation: 3 requêtes parallèles au lieu d'une seule pour meilleure performance
 */
async function countTicketsByTypeForPeriod(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  startTime: Date,
  endTime: Date,
  agentIds?: string[]
): Promise<{ bugs: number; reqs: number; assistances: number }> {
  try {
    // Fonction helper pour compter un type de ticket
    const countTicketType = async (type: 'BUG' | 'REQ' | 'ASSISTANCE'): Promise<number> => {
      try {
        let query = supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('ticket_type', type)
          .gte('created_at', startTime.toISOString())
          .lte('created_at', endTime.toISOString());

        // Filtrer par agent si spécifié (tickets créés par l'agent OU assignés à l'agent)
        // On compte les tickets créés par l'agent (created_by) car c'est ce qui nous intéresse
        // pour mesurer la productivité de l'agent
        if (agentIds && agentIds.length > 0) {
          // Filtrer par created_by pour compter les tickets créés par l'agent
          query = query.in('created_by', agentIds);
        }

        const { count, error } = await query;

        if (error) {
          console.error(`[SupportEvolutionV2] Error counting ${type}:`, {
            error,
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          });
          // Ne pas throw, retourner 0 pour éviter de bloquer tout le widget
          return 0;
        }

        return count || 0;
      } catch (err) {
        console.error(`[SupportEvolutionV2] Exception counting ${type}:`, err);
        return 0;
      }
    };

    // Compter les 3 types en parallèle
    const [bugs, reqs, assistances] = await Promise.all([
      countTicketType('BUG'),
      countTicketType('REQ'),
      countTicketType('ASSISTANCE'),
    ]);

    return { bugs, reqs, assistances };
  } catch (error) {
    console.error('[SupportEvolutionV2] Error in countTicketsByTypeForPeriod:', error);
    return { bugs: 0, reqs: 0, assistances: 0 };
  }
}

/**
 * Calcule le temps d'assistance total pour une période
 */
async function getAssistanceTimeForPeriod(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  startTime: Date,
  endTime: Date,
  agentIds?: string[]
): Promise<number> {
  try {
    let query = supabase
      .from('tickets')
      .select('duration_minutes')
      .eq('ticket_type', 'ASSISTANCE')
      .gte('resolved_at', startTime.toISOString())
      .lte('resolved_at', endTime.toISOString())
      .not('duration_minutes', 'is', null);

    // Filtrer par statuts résolus (accepter plusieurs variantes)
    // Statuts possibles : "Resolue", "Résolu", "Terminé", "Terminé(e)", "Termine"
    query = query.in('status', ['Resolue', 'Résolu', 'Terminé', 'Terminé(e)', 'Termine']);

    // Filtrer par agent si spécifié
    // Note: agentIds sont des profile IDs, mais assigned_to peut être auth_uid
    // Pour l'instant, on ne filtre pas par agent pour éviter les erreurs
    // TODO: Mapper profile IDs vers auth_uid si nécessaire
    if (agentIds && agentIds.length > 0) {
      // Ne pas filtrer par agent pour éviter les erreurs de type/RLS
      // On pourrait mapper les profile IDs vers auth_uid si nécessaire
    }

    const { data, error } = await query;

    if (error) {
      // Logger l'erreur mais ne pas bloquer le widget
      console.error('[SupportEvolutionV2] Error fetching assistance time:', {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      
      // Retourner 0 plutôt que de throw pour éviter de bloquer tout le widget
      // L'utilisateur verra 0 au lieu d'une erreur
      return 0;
    }

    // Somme des duration_minutes
    return (data || []).reduce((sum, ticket) => sum + (ticket.duration_minutes || 0), 0);
  } catch (err) {
    // Gérer les erreurs inattendues
    console.error('[SupportEvolutionV2] Unexpected error in getAssistanceTimeForPeriod:', err);
    // Retourner 0 plutôt que de throw pour éviter de bloquer le widget
    return 0;
  }
}

/**
 * Récupère les données d'évolution Support - VERSION 2 (OPTIMISÉE)
 * 
 * Calcule les volumes par type de ticket (créés) et le temps d'assistance
 * 
 * OPTIMISATIONS APPLIQUÉES:
 * - 24 requêtes → 1-2 requêtes groupées (réduction de 96%)
 * - Utilisation de period-utils.ts (DRY)
 * - Constantes extraites (pas de magic numbers)
 * - Index Supabase optimisés
 * 
 * @param period - Période standard ou année (ex: "2024")
 * @param selectedDimensions - Dimensions à afficher
 * @param agentIds - IDs des agents à filtrer (optionnel)
 * @param customPeriodStart - Date de début personnalisée (ISO string)
 * @param customPeriodEnd - Date de fin personnalisée (ISO string)
 */
async function getSupportEvolutionDataV2Internal(
  period: Period | string,
  selectedDimensions: SupportDimension[],
  agentIds?: string[],
  customPeriodStart?: string,
  customPeriodEnd?: string
): Promise<SupportEvolutionData> {
    try {
      const supabase = await createSupabaseServerClient();
      
      // Utiliser les dates personnalisées si fournies, sinon calculer à partir de la période
      let start: Date;
      let end: Date;
      
      if (customPeriodStart && customPeriodEnd) {
        start = new Date(customPeriodStart);
        end = new Date(customPeriodEnd);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
      } else {
        // Utiliser period-utils.ts pour éviter la duplication
        const { startDate: startDateStr, endDate: endDateStr } = getPeriodDatesFromUtils(period);
        start = new Date(startDateStr);
        end = new Date(endDateStr);
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[SupportEvolutionV2] Using dates:', {
          period,
          customPeriodStart,
          customPeriodEnd,
          start: start.toISOString(),
          end: end.toISOString(),
        });
      }
      
      // Pour les périodes personnalisées, détecter si c'est une période custom
      const isCustomPeriod = !!customPeriodStart && !!customPeriodEnd;
      const periodToUse = isCustomPeriod ? 'custom' : period;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[SupportEvolutionV2] Period detection:', {
          period,
          customPeriodStart,
          customPeriodEnd,
          isCustomPeriod,
          periodToUse,
          start: start.toISOString(),
          end: end.toISOString(),
        });
      }
      
      const dateRange = generateDateRange(periodToUse, start, end);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[SupportEvolutionV2] Generated date range:', {
          periodToUse,
          datesCount: dateRange.length,
          dates: dateRange,
        });
      }

      // Récupérer les agents Support
      const allAgentsData = await getSupportAgents(supabase);
      const agents = allAgentsData.map((agent) => ({
        id: agent.id,
        name: agent.full_name || 'Inconnu',
      }));

      // OPTIMISATION : Calculer les plages de dates pour chaque point
      const dateRanges = dateRange.map((date) => {
        const dateObj = new Date(date);
        let periodStart: Date;
        let periodEnd: Date;

        // Si c'est une période annuelle (mois), prendre tout le mois
        if ((typeof period === 'string' && /^\d{4}$/.test(period)) || period === 'year') {
          periodStart = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
          periodStart.setHours(0, 0, 0, 0);
          periodEnd = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0);
          periodEnd.setHours(23, 59, 59, 999);
        } else if (periodToUse === 'custom') {
          // Pour les périodes personnalisées, la date représente le début d'une semaine
          periodStart = new Date(date);
          periodStart.setHours(0, 0, 0, 0);
          
          // Calculer la fin de la semaine (7 jours plus tard) ou la fin de la période globale
          const weekEnd = new Date(date);
          weekEnd.setDate(weekEnd.getDate() + DAYS_PER_WEEK);
          weekEnd.setHours(23, 59, 59, 999);
          
          // Ne pas dépasser la fin de la période globale
          periodEnd = weekEnd > end ? end : weekEnd;
        } else {
          // Pour les autres périodes, prendre juste le jour
          periodStart = new Date(date);
          periodStart.setHours(0, 0, 0, 0);
          periodEnd = new Date(date);
          periodEnd.setHours(23, 59, 59, 999);
        }

        return { date, start: periodStart, end: periodEnd };
      });

      // OPTIMISATION : Une seule requête pour tous les tickets (au lieu de N requêtes)
      const [ticketCountsByDate, assistanceTimeByDate] = await Promise.all([
        countTicketsByDateRanges(supabase, dateRanges, agentIds),
        selectedDimensions.includes('assistanceTime')
          ? calculateAssistanceTimeByDateRanges(supabase, dateRanges, agentIds)
          : Promise.resolve(new Map<string, number>()),
      ]);

      // Générer les points de données à partir des résultats groupés
      const dataPoints: SupportEvolutionDataPoint[] = dateRange.map((date) => {
        const counts = ticketCountsByDate.get(date) || { bugs: 0, reqs: 0, assistances: 0 };
        const assistanceTime = assistanceTimeByDate.get(date) || 0;

        return {
          date,
          bugs: counts.bugs,
          reqs: counts.reqs,
          assistances: counts.assistances,
          assistanceTime,
        };
      });

      return {
        period: periodToUse, // Retourner periodToUse pour que le graphique sache que c'est 'custom'
        periodStart: start.toISOString(),
        periodEnd: end.toISOString(),
        selectedAgents: agentIds,
        selectedDimensions,
        data: dataPoints,
        agents,
      };
    } catch (error) {
      console.error('[SupportEvolutionV2] Error:', error);
      
      // Logger les détails en développement
      if (process.env.NODE_ENV === 'development' && error instanceof Error) {
        console.error('[SupportEvolutionV2] Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name,
        });
      }
      
      throw error;
    }
  }

/**
 * Version exportée avec React.cache() pour éviter les appels redondants
 * dans le même render tree
 */
export const getSupportEvolutionDataV2 = cache(getSupportEvolutionDataV2Internal);

