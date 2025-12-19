/**
 * Service de statistiques des tickets par entreprise
 * 
 * @description
 * Fournit les données pour le Horizontal Stacked Bar Chart
 * montrant la répartition des tickets par entreprise et par type.
 * 
 * Soumis aux filtres globaux (période).
 * 
 * @see docs/dashboard/REFONTE-DASHBOARD-SPECIFICATION.md - Section 3.3
 */
import { cache } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Type pour les données d'une entreprise
 */
export type CompanyTicketData = {
  /** ID de l'entreprise */
  companyId: string;
  /** Nom de l'entreprise */
  companyName: string;
  /** Nombre de BUGs */
  bug: number;
  /** Nombre de REQs */
  req: number;
  /** Nombre d'Assistances */
  assistance: number;
  /** Total tous types */
  total: number;
};

/**
 * Type des statistiques par entreprise
 */
export type TicketsByCompanyStats = {
  /** Données par entreprise (triées par total décroissant) */
  data: CompanyTicketData[];
  /** Nombre total de tickets */
  totalTickets: number;
  /** Nombre d'entreprises */
  companyCount: number;
  /** Limite appliquée (top N) */
  limit: number;
};

/**
 * Récupère les statistiques de tickets par entreprise
 * 
 * @param productId - ID du produit
 * @param periodStart - Date de début (ISO string)
 * @param periodEnd - Date de fin (ISO string)
 * @param limit - Nombre max d'entreprises à retourner (défaut: 10)
 * @returns Statistiques par entreprise ou null en cas d'erreur
 */
export const getTicketsByCompanyStats = cache(
  async (
    productId: string,
    periodStart: string,
    periodEnd: string,
    limit: number = 10
  ): Promise<TicketsByCompanyStats | null> => {
    const supabase = await createSupabaseServerClient();

    try {
      // 1. Récupérer les tickets de la période
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('id, ticket_type, company_id')
        .eq('product_id', productId)
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd);

      if (ticketsError) {
        console.error('[getTicketsByCompanyStats] Error fetching tickets:', ticketsError);
        return null;
      }

      if (!tickets || tickets.length === 0) {
        return {
          data: [],
          totalTickets: 0,
          companyCount: 0,
          limit,
        };
      }

      // 2. Récupérer les relations ticket-company via la table de liaison
      const ticketIds = tickets.map(t => t.id);
      const { data: ticketCompanyLinks, error: linksError } = await supabase
        .from('ticket_company_link')
        .select('ticket_id, company_id')
        .in('ticket_id', ticketIds);

      if (linksError) {
        console.error('[getTicketsByCompanyStats] Error fetching ticket-company links:', linksError);
        // Continuer avec company_id direct si la table de liaison échoue
      }

      // 3. Créer un map ticket -> company_id (priorité: company_id direct, sinon via link)
      const ticketToCompanyMap = new Map<string, string>();
      
      // D'abord, les links (peut avoir plusieurs companies par ticket, on prend la première)
      if (ticketCompanyLinks) {
        ticketCompanyLinks.forEach((link: any) => {
          if (!ticketToCompanyMap.has(link.ticket_id)) {
            ticketToCompanyMap.set(link.ticket_id, link.company_id);
          }
        });
      }
      
      // Ensuite, company_id direct du ticket (écrase si présent)
      tickets.forEach((ticket: any) => {
        if (ticket.company_id) {
          ticketToCompanyMap.set(ticket.id, ticket.company_id);
        }
      });

      // 4. Collecter les company_id uniques
      const uniqueCompanyIds = [...new Set(ticketToCompanyMap.values())];
      
      if (uniqueCompanyIds.length === 0) {
        return {
          data: [],
          totalTickets: tickets.length,
          companyCount: 0,
          limit,
        };
      }

      // 5. Récupérer les noms des entreprises
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('id, name')
        .in('id', uniqueCompanyIds);

      if (companiesError) {
        console.error('[getTicketsByCompanyStats] Error fetching companies:', companiesError);
        return null;
      }

      const companiesMap = new Map<string, string>();
      if (companies) {
        companies.forEach((c: any) => {
          companiesMap.set(c.id, c.name || 'Inconnu');
        });
      }

      // 6. Agréger par entreprise
      const companyDataMap = new Map<string, CompanyTicketData>();

      tickets.forEach((ticket: any) => {
        const companyId = ticketToCompanyMap.get(ticket.id);
        if (!companyId) return; // Ticket sans entreprise

        const companyName = companiesMap.get(companyId) || 'Inconnu';

        if (!companyDataMap.has(companyId)) {
          companyDataMap.set(companyId, {
            companyId,
            companyName,
            bug: 0,
            req: 0,
            assistance: 0,
            total: 0,
          });
        }

        const company = companyDataMap.get(companyId)!;
        
        switch (ticket.ticket_type) {
          case 'BUG':
            company.bug++;
            break;
          case 'REQ':
            company.req++;
            break;
          case 'ASSISTANCE':
            company.assistance++;
            break;
        }
        company.total++;
      });

      // 7. Trier et limiter
      const sortedData = Array.from(companyDataMap.values())
        .sort((a, b) => b.total - a.total)
        .slice(0, limit);

      const totalTickets = sortedData.reduce((sum, c) => sum + c.total, 0);

      console.log(
        `[getTicketsByCompanyStats] Found ${sortedData.length} companies, ${totalTickets} tickets (from ${tickets.length} total)`
      );

      return {
        data: sortedData,
        totalTickets,
        companyCount: sortedData.length,
        limit,
      };
    } catch (error) {
      console.error('[getTicketsByCompanyStats] Unexpected error:', error);
      return null;
    }
  }
);

