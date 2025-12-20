/**
 * Service de statistiques du temps d'assistance par entreprise
 * 
 * @description
 * Fournit les données pour le Horizontal Stacked Bar Chart
 * montrant la répartition du temps d'assistance par entreprise.
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
export type CompanyAssistanceTimeData = {
  /** ID de l'entreprise */
  companyId: string;
  /** Nom de l'entreprise */
  companyName: string;
  /** Temps d'assistance total en heures */
  totalHours: number;
  /** Temps d'assistance total en minutes (pour précision) */
  totalMinutes: number;
  /** Nombre de tickets assistance */
  ticketCount: number;
};

/**
 * Type des statistiques de temps d'assistance par entreprise
 */
export type AssistanceTimeByCompanyStats = {
  /** Données par entreprise (triées par temps décroissant) */
  data: CompanyAssistanceTimeData[];
  /** Temps total d'assistance en heures */
  totalHours: number;
  /** Nombre d'entreprises */
  companyCount: number;
  /** Limite appliquée (top N) */
  limit: number;
};

/**
 * Calcule la durée d'un ticket d'assistance en minutes.
 * 
 * IMPORTANT: Pour les tickets d'assistance, on utilise UNIQUEMENT duration_minutes
 * car le calcul depuis created_at/resolved_at peut donner des durées aberrantes
 * (ex: ticket créé en janvier et résolu en décembre = ~8000h).
 * 
 * Les agents renseignent manuellement duration_minutes lors de la création.
 * 
 * @param ticket - Ticket avec duration_minutes, created_at, resolved_at
 * @returns Durée en minutes
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
 * Récupère les statistiques de temps d'assistance par entreprise
 * 
 * @param productId - ID du produit
 * @param periodStart - Date de début (ISO string)
 * @param periodEnd - Date de fin (ISO string)
 * @param limit - Nombre max d'entreprises à retourner (défaut: 10)
 * @returns Statistiques par entreprise ou null en cas d'erreur
 */
export const getAssistanceTimeByCompanyStats = cache(
  async (
    productId: string,
    periodStart: string,
    periodEnd: string,
    limit: number = 10
  ): Promise<AssistanceTimeByCompanyStats | null> => {
    const supabase = await createSupabaseServerClient();

    try {
      // 1. Récupérer les tickets ASSISTANCE de la période avec durée
      // IMPORTANT: Pagination nécessaire car Supabase limite à 1000 résultats par requête
      const tickets: any[] = [];
      let offset = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data: page, error: ticketsError } = await supabase
          .from('tickets')
          .select('id, company_id, duration_minutes, created_at, resolved_at')
          .eq('ticket_type', 'ASSISTANCE')
          .eq('product_id', productId)
          .gte('created_at', periodStart)
          .lte('created_at', periodEnd)
          .range(offset, offset + pageSize - 1);

        if (ticketsError) {
          console.error('[getAssistanceTimeByCompanyStats] Error fetching tickets:', ticketsError);
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

      if (tickets.length === 0) {
        return {
          data: [],
          totalHours: 0,
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
        console.error('[getAssistanceTimeByCompanyStats] Error fetching ticket-company links:', linksError);
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
          totalHours: 0,
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
        console.error('[getAssistanceTimeByCompanyStats] Error fetching companies:', companiesError);
        return null;
      }

      const companiesMap = new Map<string, string>();
      if (companies) {
        companies.forEach((c: any) => {
          companiesMap.set(c.id, c.name || 'Inconnu');
        });
      }

      // 6. Agréger par entreprise (somme des durées)
      const companyDataMap = new Map<string, CompanyAssistanceTimeData>();

      tickets.forEach((ticket: any) => {
        const companyId = ticketToCompanyMap.get(ticket.id);
        if (!companyId) return; // Ticket sans entreprise

        const companyName = companiesMap.get(companyId) || 'Inconnu';
        const durationMinutes = calculateTicketDuration(ticket);

        if (!companyDataMap.has(companyId)) {
          companyDataMap.set(companyId, {
            companyId,
            companyName,
            totalHours: 0,
            totalMinutes: 0,
            ticketCount: 0,
          });
        }

        const company = companyDataMap.get(companyId)!;
        company.totalMinutes += durationMinutes;
        company.ticketCount++;
      });

      // 7. Convertir minutes en heures et arrondir
      companyDataMap.forEach((company) => {
        company.totalHours = Math.round((company.totalMinutes / 60) * 10) / 10; // Arrondir à 1 décimale
      });

      // 8. Trier par temps décroissant et limiter
      const sortedData = Array.from(companyDataMap.values())
        .sort((a, b) => b.totalMinutes - a.totalMinutes)
        .slice(0, limit);

      const totalHours = Math.round(
        (sortedData.reduce((sum, c) => sum + c.totalMinutes, 0) / 60) * 10
      ) / 10;

      console.log(
        `[getAssistanceTimeByCompanyStats] Found ${sortedData.length} companies, ${totalHours.toFixed(1)}h total (${sortedData.reduce((sum, c) => sum + c.ticketCount, 0)} tickets)`
      );

      return {
        data: sortedData,
        totalHours,
        companyCount: sortedData.length,
        limit,
      };
    } catch (error) {
      console.error('[getAssistanceTimeByCompanyStats] Unexpected error:', error);
      return null;
    }
  }
);


