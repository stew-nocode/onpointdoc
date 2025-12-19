/**
 * Service de statistiques d'évolution du temps d'assistance
 * 
 * @description
 * Fournit les données pour l'AreaChart d'évolution du temps d'assistance.
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
import type { Period } from '@/types/dashboard';
import type { DataGranularity } from '@/services/dashboard/tickets-evolution-stats';

/**
 * Type pour un point de données d'évolution du temps d'assistance
 */
export type AssistanceTimeEvolutionDataPoint = {
  /** Label affiché (ex: "Lun 16", "Sem 1", "Nov 2024") */
  label: string;
  /** Date ISO du point */
  date: string;
  /** Temps d'assistance total en heures */
  totalHours: number;
  /** Temps d'assistance total en minutes (pour précision) */
  totalMinutes: number;
  /** Nombre de tickets assistance */
  ticketCount: number;
};

/**
 * Type des statistiques d'évolution du temps d'assistance
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
 * Calcule la durée d'un ticket en minutes
 */
function calculateTicketDuration(ticket: {
  duration_minutes: number | null;
  created_at: string | null;
  resolved_at: string | null;
}): number {
  // Priorité 1 : duration_minutes si disponible
  if (ticket.duration_minutes !== null && ticket.duration_minutes > 0) {
    return ticket.duration_minutes;
  }

  // Priorité 2 : Calcul depuis created_at et resolved_at
  if (ticket.created_at && ticket.resolved_at) {
    const created = new Date(ticket.created_at);
    const resolved = new Date(ticket.resolved_at);
    const diffMs = resolved.getTime() - created.getTime();
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    return Math.max(0, diffMinutes);
  }

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
): Map<string, { totalMinutes: number; ticketCount: number }> {
  const points = new Map<string, { totalMinutes: number; ticketCount: number }>();
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
      points.set(key, { totalMinutes: 0, ticketCount: 0 });
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
 * Récupère les statistiques d'évolution du temps d'assistance
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
    period: Period | 'custom' | string = 'month'
  ): Promise<AssistanceTimeEvolutionStats | null> => {
    const supabase = await createSupabaseServerClient();

    try {
      // Déterminer la granularité selon la période
      const granularity = getGranularity(period, periodStart, periodEnd);
      
      console.log(`[getAssistanceTimeEvolutionStats] Period: ${period}, Granularity: ${granularity}`);

      // Récupérer les tickets ASSISTANCE avec durée
      const { data: tickets, error } = await supabase
        .from('tickets')
        .select('created_at, duration_minutes, resolved_at')
        .eq('ticket_type', 'ASSISTANCE')
        .eq('product_id', productId)
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[getAssistanceTimeEvolutionStats] Error fetching tickets:', error);
        return null;
      }

      // Générer tous les points de la période (même vides)
      const dataMap = generateAllPoints(periodStart, periodEnd, granularity);
      
      // Remplir avec les données des tickets
      if (tickets && tickets.length > 0) {
        tickets.forEach((ticket) => {
          const date = new Date(ticket.created_at);
          const key = getGroupKey(date, granularity);
          
          const point = dataMap.get(key);
          if (point) {
            const durationMinutes = calculateTicketDuration(ticket);
            point.totalMinutes += durationMinutes;
            point.ticketCount++;
          }
        });
      }

      // Convertir en tableau et formater
      const data: AssistanceTimeEvolutionDataPoint[] = Array.from(dataMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, counts]) => {
          const totalHours = Math.round((counts.totalMinutes / 60) * 10) / 10; // Arrondir à 1 décimale
          return {
            label: formatLabel(key, granularity),
            date: key,
            totalHours,
            totalMinutes: counts.totalMinutes,
            ticketCount: counts.ticketCount,
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
    } catch (error) {
      console.error('[getAssistanceTimeEvolutionStats] Unexpected error:', error);
      return null;
    }
  }
);


