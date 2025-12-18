/**
 * Service de statistiques de distribution des tickets par type pour une entreprise
 * 
 * @description
 * Fournit les données pour le PieChart de distribution par type de ticket
 * pour une entreprise spécifique.
 * 
 * Les tickets peuvent être liés à une entreprise de deux façons :
 * 1. Via `company_id` direct dans la table `tickets`
 * 2. Via `ticket_company_link` (table de liaison many-to-many)
 * 
 * Ce service prend en compte les deux cas.
 * 
 * @see src/services/dashboard/tickets-distribution-stats.ts - Service dashboard (par produit)
 */

import { cache } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Type pour un élément de la distribution
 */
export type CompanyTicketTypeDistributionItem = {
  type: 'BUG' | 'REQ' | 'ASSISTANCE';
  count: number;
  percentage: number;
  color: string;
};

/**
 * Type des statistiques de distribution pour une entreprise
 */
export type CompanyTicketsDistributionStats = {
  items: CompanyTicketTypeDistributionItem[];
  total: number;
  periodStart: string;
  periodEnd: string;
};

/**
 * Couleurs par type de ticket (cohérentes avec le dashboard)
 */
const TYPE_COLORS_FALLBACK: Record<string, string> = {
  BUG: '#F43F5E',        // Rose
  REQ: '#3B82F6',        // Bleu
  ASSISTANCE: '#14B8A6', // Teal
};

/**
 * Récupère les statistiques de distribution par type de ticket pour une entreprise
 * 
 * Prend en compte :
 * - Tickets avec `company_id` direct
 * - Tickets liés via `ticket_company_link`
 * 
 * @param companyId - ID de l'entreprise
 * @param periodStart - Date de début de période (ISO string)
 * @param periodEnd - Date de fin de période (ISO string)
 * @returns Statistiques de distribution ou null en cas d'erreur
 */
export const getCompanyTicketsDistributionStats = cache(
  async (
    companyId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<CompanyTicketsDistributionStats | null> => {
    const supabase = await createSupabaseServerClient();

    try {
      // Requête pour récupérer les tickets liés à l'entreprise
      // On utilise une UNION pour combiner les deux sources :
      // 1. Tickets avec company_id direct
      // 2. Tickets liés via ticket_company_link
      
      // Première partie : tickets avec company_id direct
      const { data: ticketsDirect, error: errorDirect } = await supabase
        .from('tickets')
        .select('id, ticket_type')
        .eq('company_id', companyId)
        .in('ticket_type', ['BUG', 'REQ', 'ASSISTANCE'])
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd);

      if (errorDirect) {
        console.error('[getCompanyTicketsDistributionStats] Error fetching direct tickets:', errorDirect);
        return null;
      }

      // Deuxième partie : tickets liés via ticket_company_link
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
        console.error('[getCompanyTicketsDistributionStats] Error fetching linked tickets:', errorLinks);
        return null;
      }

      // Récupérer les IDs des tickets directs pour éviter les doublons
      const directTicketIds = new Set((ticketsDirect || []).map((t) => t.id || ''));

      // Filtrer les tickets liés par période et type, et exclure les doublons
      const linkedTickets = (ticketLinks || [])
        .map((link) => link.ticket)
        .filter((ticket): ticket is { id: string; ticket_type: string; created_at: string } => 
          ticket !== null &&
          ticket.id !== null &&
          ticket.ticket_type !== null &&
          ['BUG', 'REQ', 'ASSISTANCE'].includes(ticket.ticket_type) &&
          ticket.created_at >= periodStart &&
          ticket.created_at <= periodEnd &&
          !directTicketIds.has(ticket.id) // Éviter les doublons
        );

      // Combiner les deux sources (sans doublons)
      const allTickets = [
        ...(ticketsDirect || []).map((t) => t.ticket_type),
        ...linkedTickets.map((t) => t.ticket_type),
      ];

      // Compter par type
      const counts = new Map<string, number>();
      allTickets.forEach((type) => {
        counts.set(type, (counts.get(type) || 0) + 1);
      });

      // Calculer le total
      const total = allTickets.length;

      // Construire les items avec pourcentages
      const ticketTypes: Array<'BUG' | 'REQ' | 'ASSISTANCE'> = ['BUG', 'REQ', 'ASSISTANCE'];
      const items: CompanyTicketTypeDistributionItem[] = ticketTypes
        .map((type) => {
          const count = counts.get(type) || 0;
          const percentage = total > 0 ? Math.round((count / total) * 100 * 10) / 10 : 0;
          return {
            type,
            count,
            percentage,
            color: TYPE_COLORS_FALLBACK[type],
          };
        })
        .filter((item) => item.count > 0); // Filtrer les types sans tickets

      // Trier par count décroissant
      items.sort((a, b) => b.count - a.count);

      if (process.env.NODE_ENV === 'development') {
        console.log(`[getCompanyTicketsDistributionStats] Company ${companyId}: ${items.length} types, total=${total}`);
      }

      return {
        items,
        total,
        periodStart,
        periodEnd,
      };
    } catch (error) {
      console.error('[getCompanyTicketsDistributionStats] Unexpected error:', error);
      return null;
    }
  }
);

