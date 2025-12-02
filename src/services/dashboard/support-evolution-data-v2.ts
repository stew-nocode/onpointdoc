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

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Period } from '@/types/dashboard';
import type { SupportEvolutionData, SupportEvolutionDataPoint, SupportDimension } from '@/types/dashboard-support-evolution';
import { handleSupabaseError } from '@/lib/errors/handlers';

/**
 * Calcule les dates de début et fin selon la période ou année
 */
function getPeriodDates(period: Period | string): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);
  let start: Date;

  // Si c'est une année (ex: "2023", "2024")
  if (typeof period === 'string' && /^\d{4}$/.test(period)) {
    const year = parseInt(period, 10);
    return {
      start: new Date(year, 0, 1),
      end: new Date(year, 11, 31, 23, 59, 59, 999),
    };
  }

  // Sinon, période relative
  switch (period) {
    case 'week':
      start = new Date(now);
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      break;
    case 'month':
      // Prendre les 30 derniers jours pour avoir assez de données
      start = new Date(now);
      start.setDate(now.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      break;
    case 'quarter':
      const quarter = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), quarter * 3, 1);
      start.setHours(0, 0, 0, 0);
      break;
    case 'year':
      start = new Date(now.getFullYear(), 0, 1);
      start.setHours(0, 0, 0, 0);
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
  }

  end.setHours(23, 59, 59, 999);
  return { start, end };
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
      const step = Math.max(1, Math.floor(totalDays / 5)); // Maximum 5 points
      let iterationCount = 0;
      const maxIterations = 50; // Sécurité pour éviter les boucles infinies
      
      while (current <= end && iterationCount < maxIterations) {
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
  let query = supabase
    .from('tickets')
    .select('duration_minutes')
    .eq('ticket_type', 'ASSISTANCE')
    .in('status', ['Resolue', 'Terminé', 'Terminé(e)'])
    .gte('resolved_at', startTime.toISOString())
    .lte('resolved_at', endTime.toISOString())
    .not('duration_minutes', 'is', null);

  // Filtrer par agent si spécifié
  if (agentIds && agentIds.length > 0) {
    query = query.in('assigned_to', agentIds);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[SupportEvolutionV2] Error fetching assistance time:', error);
    throw handleSupabaseError(error, 'getAssistanceTimeForPeriod');
  }

  // Somme des duration_minutes
  return (data || []).reduce((sum, ticket) => sum + (ticket.duration_minutes || 0), 0);
}

/**
 * Récupère les données d'évolution Support - VERSION 2
 * 
 * Calcule les volumes par type de ticket (créés) et le temps d'assistance
 * 
 * ⚠️ NOTE: Cette fonction est utilisée dans une route API, donc pas de React.cache()
 * Le cache est géré par unstable_cache dans la route API
 */
export async function getSupportEvolutionDataV2(
  period: Period | string,
  selectedDimensions: SupportDimension[],
  agentIds?: string[]
): Promise<SupportEvolutionData> {
    try {
      const supabase = await createSupabaseServerClient();
      const { start, end } = getPeriodDates(period);
      const dateRange = generateDateRange(period, start, end);

      // Récupérer les agents Support
      const allAgentsData = await getSupportAgents(supabase);
      const agents = allAgentsData.map((agent) => ({
        id: agent.id,
        name: agent.full_name || 'Inconnu',
      }));

      // Générer les points de données pour chaque période
      const dataPoints: SupportEvolutionDataPoint[] = await Promise.all(
        dateRange.map(async (date) => {
          const dateObj = new Date(date);
          let periodStart: Date;
          let periodEnd: Date;

          // Si c'est une période annuelle (mois), prendre tout le mois
          if ((typeof period === 'string' && /^\d{4}$/.test(period)) || period === 'year') {
            periodStart = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
            periodStart.setHours(0, 0, 0, 0);
            periodEnd = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0);
            periodEnd.setHours(23, 59, 59, 999);
          } else {
            periodStart = new Date(date);
            periodStart.setHours(0, 0, 0, 0);
            periodEnd = new Date(date);
            periodEnd.setHours(23, 59, 59, 999);
          }

          // Compter les tickets par type
          const volumes = await countTicketsByTypeForPeriod(
            supabase,
            periodStart,
            periodEnd,
            agentIds
          );

          // Calculer le temps d'assistance
          const assistanceTime = selectedDimensions.includes('assistanceTime')
            ? await getAssistanceTimeForPeriod(supabase, periodStart, periodEnd, agentIds)
            : 0;

          return {
            date,
            bugs: volumes.bugs,
            reqs: volumes.reqs,
            assistances: volumes.assistances,
            assistanceTime,
          };
        })
      );

      return {
        period,
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

