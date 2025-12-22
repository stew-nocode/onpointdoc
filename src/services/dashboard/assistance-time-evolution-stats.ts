/**
 * Service de statistiques d'évolution du temps d'interactions
 * 
 * @description
 * Fournit les données pour l'AreaChart d'évolution du temps d'interactions.
 * Les interactions = BUG + REQ + ASSISTANCE + RELANCES (toutes les communications entrantes).
 * Soumis aux filtres globaux (période).
 * 
 * La granularité s'adapte automatiquement selon la période :
 * - Semaine (7 jours) → Par jour (7 points)
 * - Mois (30 jours) → Par semaine (4 points)
 * - Trimestre/Année → Par mois (variable)
 * 
 * @see docs/dashboard/REFONTE-DASHBOARD-SPECIFICATION.md - Section 3.3
 */
import { cache } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { withQueryTimeout } from '@/lib/utils/supabase-query-timeout';
import { withRpcTimeout } from '@/lib/utils/supabase-timeout';
import { createError } from '@/lib/errors/types';
import type { Period } from '@/types/dashboard';
import type { DataGranularity } from '@/services/dashboard/tickets-evolution-stats';

/**
 * Type pour un point de données d'évolution du temps d'interactions
 */
export type AssistanceTimeEvolutionDataPoint = {
  /** Label affiché (ex: "Lun 16", "Sem 1", "Nov 2024") */
  label: string;
  /** Date ISO du point */
  date: string;
  /** Temps d'interactions total en heures */
  totalHours: number;
  /** Temps d'interactions total en minutes (pour précision) */
  totalMinutes: number;
  /** Nombre de tickets (interactions) */
  ticketCount: number;
  /** Temps par type en heures */
  bugHours: number;
  reqHours: number;
  assistanceHours: number;
  relanceHours: number;
  /** Temps par type en minutes (pour précision) */
  bugMinutes: number;
  reqMinutes: number;
  assistanceMinutes: number;
  relanceMinutes: number;
};

/**
 * Type des statistiques d'évolution du temps d'interactions
 */
export type AssistanceTimeEvolutionStats = {
  data: AssistanceTimeEvolutionDataPoint[];
  totalHours: number;
  periodStart: string;
  periodEnd: string;
  /** Granularité utilisée pour ces données */
  granularity: DataGranularity;
};

/**
 * Calcule la durée d'un ticket (interaction) en minutes.
 * 
 * IMPORTANT: On utilise UNIQUEMENT duration_minutes si disponible
 * car le calcul depuis created_at/resolved_at peut donner des durées aberrantes
 * (ex: ticket créé en janvier et résolu en décembre = ~8000h).
 * 
 * Les agents renseignent manuellement duration_minutes lors de la création.
 */
function calculateTicketDuration(ticket: {
  duration_minutes: number | null;
  created_at: string | null;
  resolved_at: string | null;
}): number {
  // Utiliser uniquement duration_minutes si disponible et valide
  if (ticket.duration_minutes !== null && ticket.duration_minutes > 0) {
    // Limiter à 8h max (480 minutes) pour éviter les erreurs de saisie
    return Math.min(ticket.duration_minutes, 480);
  }
  // Si pas de duration_minutes, retourner 0 (ne pas calculer depuis les dates)
  return 0;
}

/**
 * Obtient le lundi de la semaine pour une date donnée
 */
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Génère la clé de groupement selon la granularité
 */
function getGroupKey(date: Date, granularity: DataGranularity): string {
  switch (granularity) {
    case 'day':
      return date.toISOString().split('T')[0];
    case 'week': {
      const monday = getMonday(date);
      return monday.toISOString().split('T')[0];
    }
    case 'month':
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
}

/**
 * Formate le label selon la granularité
 */
function formatLabel(key: string, granularity: DataGranularity): string {
  switch (granularity) {
    case 'day': {
      const date = new Date(key);
      const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' });
      const dayNum = date.getDate();
      return `${dayName} ${dayNum}`;
    }
    case 'week': {
      const monday = new Date(key);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      
      const startDay = monday.getDate();
      const endDay = sunday.getDate();
      const startMonth = monday.toLocaleDateString('fr-FR', { month: 'short' });
      const endMonth = sunday.toLocaleDateString('fr-FR', { month: 'short' });
      
      if (monday.getMonth() === sunday.getMonth()) {
        return `${startDay}-${endDay} ${startMonth}`;
      } else {
        return `${startDay} ${startMonth}-${endDay} ${endMonth}`;
      }
    }
    case 'month': {
      const [year, month] = key.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
    }
  }
}

/**
 * Détermine la granularité optimale selon la période
 */
function getGranularity(period: Period | 'custom' | string, periodStart: string, periodEnd: string): DataGranularity {
  if (period === 'week') return 'day';
  if (period === 'month') return 'week';
  if (period === 'quarter' || period === 'year') return 'month';

  // Pour les années spécifiques (ex: "2024") ou périodes custom, calculer selon la durée
  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 7) return 'day';
  if (diffDays <= 31) return 'week';
  return 'month';
}

/**
 * Génère tous les points de données pour la période (même sans tickets)
 */
function generateAllPoints(
  periodStart: string, 
  periodEnd: string, 
  granularity: DataGranularity
): Map<string, { 
  totalMinutes: number; 
  ticketCount: number;
  bugMinutes: number;
  reqMinutes: number;
  assistanceMinutes: number;
  relanceMinutes: number;
}> {
  const points = new Map<string, { 
    totalMinutes: number; 
    ticketCount: number;
    bugMinutes: number;
    reqMinutes: number;
    assistanceMinutes: number;
    relanceMinutes: number;
  }>();
  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  
  let current: Date;
  
  if (granularity === 'week') {
    current = getMonday(start);
  } else {
    current = new Date(start);
  }
  
  while (current <= end) {
    const key = getGroupKey(current, granularity);
    if (!points.has(key)) {
      points.set(key, { 
        totalMinutes: 0, 
        ticketCount: 0,
        bugMinutes: 0,
        reqMinutes: 0,
        assistanceMinutes: 0,
        relanceMinutes: 0,
      });
    }
    
    switch (granularity) {
      case 'day':
        current.setDate(current.getDate() + 1);
        break;
      case 'week':
        current.setDate(current.getDate() + 7);
        break;
      case 'month':
        current.setMonth(current.getMonth() + 1);
        break;
    }
  }
  
  return points;
}

/**
 * Récupère les statistiques d'évolution du temps d'interactions
 * 
 * Les interactions = BUG + REQ + ASSISTANCE + RELANCES (toutes les communications entrantes).
 * 
 * La granularité s'adapte automatiquement :
 * - Semaine → par jour (7 points)
 * - Mois → par semaine (4 points)
 * - Trimestre/Année → par mois (variable)
 * 
 * @param productId - ID du produit pour filtrer
 * @param periodStart - Date de début de période (ISO string)
 * @param periodEnd - Date de fin de période (ISO string)
 * @param period - Type de période pour déterminer la granularité
 * @returns Statistiques d'évolution ou null en cas d'erreur
 */
export const getAssistanceTimeEvolutionStats = cache(
  async (
    productId: string,
    periodStart: string,
    periodEnd: string,
    period: Period | 'custom' | string = 'month',
    includeOld: boolean = false
  ): Promise<AssistanceTimeEvolutionStats | null> => {
    const supabase = await createSupabaseServerClient();

    try {
      // Déterminer la granularité selon la période
      const granularity = getGranularity(period, periodStart, periodEnd);
      
      console.log(`[getAssistanceTimeEvolutionStats] Period: ${period}, Granularity: ${granularity}`);

      // Récupérer TOUS les tickets (BUG, REQ, ASSISTANCE) avec durée
      // Les interactions = BUG + REQ + ASSISTANCE + RELANCES
      // IMPORTANT: Pagination nécessaire car Supabase limite à 1000 résultats par requête
      const tickets: any[] = [];
      let offset = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        // ✅ TIMEOUT: 10s pour éviter les blocages prolongés
        let query = supabase
          .from('tickets')
          .select('id, created_at, ticket_type, duration_minutes, resolved_at, is_relance')
          .in('ticket_type', ['BUG', 'REQ', 'ASSISTANCE'])
          .eq('product_id', productId)
          .gte('created_at', periodStart)
          .lte('created_at', periodEnd)
          .order('created_at', { ascending: true });
        
        if (!includeOld) {
          query = query.eq('old', false);
        }
        
        const { data: page, error } = await withQueryTimeout(
          query.range(offset, offset + pageSize - 1),
          10000
        );

        if (error) {
          // ✅ Gestion d'erreur avec createError (dégradation gracieuse)
          const appError = createError.supabaseError(
            'Erreur lors de la récupération des tickets pour l\'évolution du temps',
            error instanceof Error ? error : new Error(String(error)),
            { productId, periodStart, periodEnd, period, includeOld, offset }
          );
          if (process.env.NODE_ENV === 'development') {
            console.error('[getAssistanceTimeEvolutionStats]', appError);
          }
          return null;
        }

        if (page && page.length > 0) {
          tickets.push(...page);
          offset += pageSize;
          hasMore = page.length === pageSize;
        } else {
          hasMore = false;
        }
      }

      // 1. Récupérer le nombre de relances (commentaires followup) via fonction RPC PostgreSQL
      // ✅ OPTIMISATION: Utiliser la fonction RPC PostgreSQL pour éviter HeadersOverflowError et améliorer les performances
      // ✅ TIMEOUT: 10s pour éviter les blocages prolongés
      const ticketFollowupCountMap = new Map<string, number>();
      try {
        const { data: rpcData, error: rpcError } = await withRpcTimeout(
          supabase.rpc('get_followup_comments_count', {
            p_product_id: productId,
            p_period_start: periodStart,
            p_period_end: periodEnd,
            p_include_old: includeOld,
          }),
          10000
        );

        if (rpcError) {
          // Log mais continue (dégradation gracieuse - les relances ne sont pas critiques)
          if (process.env.NODE_ENV === 'development') {
            console.error('[getAssistanceTimeEvolutionStats] Error calling RPC get_followup_comments_count:', rpcError);
          }
          // Continuer sans les relances si la RPC échoue
        } else if (rpcData && (rpcData as Array<{ ticket_id: string; followup_count: number }>).length > 0) {
          (rpcData as Array<{ ticket_id: string; followup_count: number }>).forEach((row) => {
            ticketFollowupCountMap.set(row.ticket_id, Number(row.followup_count));
          });
        }
      } catch (e) {
        // Log mais continue (dégradation gracieuse)
        if (process.env.NODE_ENV === 'development') {
          console.error('[getAssistanceTimeEvolutionStats] Unexpected error calling RPC:', e);
        }
        // Continuer sans les relances si la RPC échoue
      }

      // 4. Générer tous les points de la période (même vides)
      const dataMap = generateAllPoints(periodStart, periodEnd, granularity);
      
      // 5. Remplir avec les données des tickets par type
      if (tickets.length > 0) {
        tickets.forEach((ticket) => {
          const date = new Date(ticket.created_at);
          const key = getGroupKey(date, granularity);
          
          const point = dataMap.get(key);
          if (point) {
            const durationMinutes = calculateTicketDuration(ticket);
            
            // Compter par type
            switch (ticket.ticket_type) {
              case 'BUG':
                point.bugMinutes += durationMinutes;
                break;
              case 'REQ':
                point.reqMinutes += durationMinutes;
                break;
              case 'ASSISTANCE':
                // Assistances normales (sans is_relance)
                if (ticket.is_relance !== true) {
                  point.assistanceMinutes += durationMinutes;
                }
                
                // Relances = tickets avec is_relance=true (leur durée)
                if (ticket.is_relance === true) {
                  point.relanceMinutes += durationMinutes;
                }
                
                // Les commentaires followup n'ont pas de durée propre,
                // mais on pourrait ajouter une durée moyenne si nécessaire
                // Pour l'instant, on ne compte que les tickets avec is_relance=true
                break;
            }
            
            point.totalMinutes += durationMinutes;
            point.ticketCount++;
          }
        });
      }

      // 6. Convertir en tableau et formater
      const data: AssistanceTimeEvolutionDataPoint[] = Array.from(dataMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, counts]) => {
          const totalHours = Math.round((counts.totalMinutes / 60) * 10) / 10;
          const bugHours = Math.round((counts.bugMinutes / 60) * 10) / 10;
          const reqHours = Math.round((counts.reqMinutes / 60) * 10) / 10;
          const assistanceHours = Math.round((counts.assistanceMinutes / 60) * 10) / 10;
          const relanceHours = Math.round((counts.relanceMinutes / 60) * 10) / 10;
          
          return {
            label: formatLabel(key, granularity),
            date: key,
            totalHours,
            totalMinutes: counts.totalMinutes,
            ticketCount: counts.ticketCount,
            bugHours,
            reqHours,
            assistanceHours,
            relanceHours,
            bugMinutes: counts.bugMinutes,
            reqMinutes: counts.reqMinutes,
            assistanceMinutes: counts.assistanceMinutes,
            relanceMinutes: counts.relanceMinutes,
          };
        });

      const totalHours = Math.round(
        (data.reduce((sum, point) => sum + point.totalMinutes, 0) / 60) * 10
      ) / 10;

      console.log(`[getAssistanceTimeEvolutionStats] ${granularity}: ${data.length} points, ${totalHours.toFixed(1)}h total`);

      return {
        data,
        totalHours,
        periodStart,
        periodEnd,
        granularity,
      };
    } catch (e) {
      // ✅ Gestion d'erreur avec createError (dégradation gracieuse)
      const appError = createError.internalError(
        'Erreur inattendue lors de la récupération de l\'évolution du temps d\'interactions',
        e instanceof Error ? e : new Error(String(e)),
        { productId, periodStart, periodEnd, period, includeOld }
      );
      if (process.env.NODE_ENV === 'development') {
        console.error('[getAssistanceTimeEvolutionStats]', appError);
      }
      return null;
    }
  }
);


