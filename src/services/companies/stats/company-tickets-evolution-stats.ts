/**
 * Service de statistiques d'évolution des tickets pour une entreprise
 * 
 * @description
 * Fournit les données pour l'AreaChart d'évolution pour une entreprise spécifique.
 * 
 * Les tickets peuvent être liés à une entreprise de deux façons :
 * 1. Via `company_id` direct dans la table `tickets`
 * 2. Via `ticket_company_link` (table de liaison many-to-many)
 * 
 * La granularité s'adapte automatiquement selon la période :
 * - Semaine (7 jours) → Par jour (7 points)
 * - Mois (30 jours) → Par semaine (4 points)
 * - Trimestre/Année → Par mois (variable)
 * 
 * @see src/services/dashboard/tickets-evolution-stats.ts - Service dashboard (par produit)
 */

import { cache } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Period } from '@/types/dashboard';

/**
 * Granularité des données (automatiquement déterminée selon la période)
 */
export type CompanyDataGranularity = 'day' | 'week' | 'month';

/**
 * Type pour un point de données d'évolution
 */
export type CompanyEvolutionDataPoint = {
  /** Label affiché (ex: "Lun 16", "Sem 1", "Nov 2024") */
  label: string;
  /** Date ISO du point */
  date: string;
  /** Nombre de BUGs créés */
  bug: number;
  /** Nombre de REQs créées */
  req: number;
  /** Nombre d'Assistances créées */
  assistance: number;
  /** Total tous types confondus */
  total: number;
};

/**
 * Type des statistiques d'évolution pour une entreprise
 */
export type CompanyTicketsEvolutionStats = {
  data: CompanyEvolutionDataPoint[];
  totalTickets: number;
  periodStart: string;
  periodEnd: string;
  /** Granularité utilisée pour ces données */
  granularity: CompanyDataGranularity;
};

/**
 * Détermine la granularité optimale selon la période
 */
function getGranularity(period: Period | 'custom', periodStart: string, periodEnd: string): CompanyDataGranularity {
  if (period === 'week') return 'day';
  if (period === 'month') return 'week';
  if (period === 'quarter' || period === 'year') return 'month';
  
  // Pour les périodes custom, calculer selon la durée
  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 7) return 'day';
  if (diffDays <= 31) return 'week';
  return 'month';
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
function getGroupKey(date: Date, granularity: CompanyDataGranularity): string {
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
function formatLabel(key: string, granularity: CompanyDataGranularity): string {
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
 * Génère tous les points de données pour la période (même sans tickets)
 */
function generateAllPoints(
  periodStart: string, 
  periodEnd: string, 
  granularity: CompanyDataGranularity
): Map<string, { bug: number; req: number; assistance: number }> {
  const points = new Map<string, { bug: number; req: number; assistance: number }>();
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
      points.set(key, { bug: 0, req: 0, assistance: 0 });
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
 * Récupère les statistiques d'évolution des tickets pour une entreprise
 * 
 * @param companyId - ID de l'entreprise
 * @param periodStart - Date de début de période (ISO string)
 * @param periodEnd - Date de fin de période (ISO string)
 * @param period - Type de période pour déterminer la granularité
 * @returns Statistiques d'évolution ou null en cas d'erreur
 */
export const getCompanyTicketsEvolutionStats = cache(
  async (
    companyId: string,
    periodStart: string,
    periodEnd: string,
    period: Period | 'custom' = 'month'
  ): Promise<CompanyTicketsEvolutionStats | null> => {
    const supabase = await createSupabaseServerClient();

    try {
      const granularity = getGranularity(period, periodStart, periodEnd);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[getCompanyTicketsEvolutionStats] Company ${companyId}, Period: ${period}, Granularity: ${granularity}`);
      }

      // Récupérer les tickets avec company_id direct
      const { data: ticketsDirect, error: errorDirect } = await supabase
        .from('tickets')
        .select('id, ticket_type, created_at')
        .eq('company_id', companyId)
        .in('ticket_type', ['BUG', 'REQ', 'ASSISTANCE'])
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd);

      if (errorDirect) {
        console.error('[getCompanyTicketsEvolutionStats] Error fetching direct tickets:', errorDirect);
        return null;
      }

      // Récupérer les tickets liés via ticket_company_link
      const { data: ticketLinks, error: errorLinks } = await supabase
        .from('ticket_company_link')
        .select(`
          ticket_id,
          ticket:tickets!ticket_company_link_ticket_id_fkey(
            id,
            ticket_type,
            created_at
          )
        `)
        .eq('company_id', companyId);

      if (errorLinks) {
        console.error('[getCompanyTicketsEvolutionStats] Error fetching linked tickets:', errorLinks);
        return null;
      }

      // Récupérer les IDs des tickets directs pour éviter les doublons
      const directTicketIds = new Set((ticketsDirect || []).map((t) => t.id || ''));

      // Filtrer les tickets liés par période et type, et exclure les doublons
      type LinkedTicket = {
        id: string;
        ticket_type: string;
        created_at: string;
      };

      const linkedTickets = (ticketLinks || [])
        .flatMap((link) => {
          const ticket = Array.isArray(link.ticket) ? link.ticket[0] : link.ticket;
          return ticket ? [ticket] : [];
        })
        .filter((ticket): ticket is LinkedTicket => {
          if (!ticket || typeof ticket !== 'object') return false;
          const t = ticket as any;
          return (
            t.id !== null &&
            t.ticket_type !== null &&
            ['BUG', 'REQ', 'ASSISTANCE'].includes(t.ticket_type) &&
            t.created_at >= periodStart &&
            t.created_at <= periodEnd &&
            !directTicketIds.has(t.id)
          );
        });

      // Combiner tous les tickets
      const allTickets = [
        ...(ticketsDirect || []),
        ...linkedTickets,
      ];

      // Générer tous les points de la période
      const dataMap = generateAllPoints(periodStart, periodEnd, granularity);

      // Grouper les tickets par période
      allTickets.forEach((ticket) => {
        const ticketDate = new Date(ticket.created_at);
        const key = getGroupKey(ticketDate, granularity);
        const point = dataMap.get(key);
        
        if (point) {
          if (ticket.ticket_type === 'BUG') point.bug++;
          else if (ticket.ticket_type === 'REQ') point.req++;
          else if (ticket.ticket_type === 'ASSISTANCE') point.assistance++;
        }
      });

      // Convertir en tableau et formater
      const evolutionData: CompanyEvolutionDataPoint[] = Array.from(dataMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, counts]) => ({
          label: formatLabel(key, granularity),
          date: key,
          bug: counts.bug,
          req: counts.req,
          assistance: counts.assistance,
          total: counts.bug + counts.req + counts.assistance,
        }));

      const totalTickets = evolutionData.reduce((sum, point) => sum + point.total, 0);

      if (process.env.NODE_ENV === 'development') {
        console.log(`[getCompanyTicketsEvolutionStats] ${granularity}: ${evolutionData.length} points, ${totalTickets} tickets`);
      }

      return {
        data: evolutionData,
        totalTickets,
        periodStart,
        periodEnd,
        granularity,
      };
    } catch (error) {
      console.error('[getCompanyTicketsEvolutionStats] Unexpected error:', error);
      return null;
    }
  }
);

