/**
 * Service de statistiques du temps d'interactions par entreprise
 * 
 * @description
 * Fournit les données pour le Horizontal Stacked Bar Chart
 * montrant la répartition du temps d'interactions par entreprise.
 * 
 * Les interactions = BUG + REQ + ASSISTANCE + RELANCES (toutes les communications entrantes).
 * 
 * Soumis aux filtres globaux (période).
 * 
 * @see docs/dashboard/REFONTE-DASHBOARD-SPECIFICATION.md - Section 3.3
 */
import { cache } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { withRpcTimeout } from '@/lib/utils/supabase-timeout';
import { withQueryTimeout } from '@/lib/utils/supabase-query-timeout';
import { createError } from '@/lib/errors/types';

/**
 * Type pour les données d'une entreprise
 */
export type CompanyAssistanceTimeData = {
  /** ID de l'entreprise */
  companyId: string;
  /** Nom de l'entreprise */
  companyName: string;
  /** Temps d'interactions total en heures */
  totalHours: number;
  /** Temps d'interactions total en minutes (pour précision) */
  totalMinutes: number;
  /** Nombre de tickets (interactions) */
  ticketCount: number;
};

/**
 * Type des statistiques de temps d'interactions par entreprise
 */
export type AssistanceTimeByCompanyStats = {
  /** Données par entreprise (triées par temps décroissant) */
  data: CompanyAssistanceTimeData[];
  /** Temps total d'interactions en heures (Top N uniquement) */
  totalHours: number;
  /** Temps total réel d'interactions en heures (toutes les entreprises) */
  totalRealHours: number;
  /** Nombre d'entreprises */
  companyCount: number;
  /** Limite appliquée (top N) */
  limit: number;
};

/**
 * Calcule la durée d'un ticket (interaction) en minutes.
 * 
 * IMPORTANT: On utilise UNIQUEMENT duration_minutes si disponible
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
 * Récupère les statistiques de temps d'interactions par entreprise
 * 
 * Les interactions = BUG + REQ + ASSISTANCE + RELANCES (toutes les communications entrantes).
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
    limit: number = 10,
    includeOld: boolean = false
  ): Promise<AssistanceTimeByCompanyStats | null> => {
    const supabase = await createSupabaseServerClient();

    try {
      // ✅ OPTIMISATION: Utiliser la fonction RPC PostgreSQL pour l'agrégation en base
      // ✅ TIMEOUT: 10s pour éviter les blocages prolongés
      const { data: rpcData, error: rpcError } = await withRpcTimeout(
        supabase.rpc('get_assistance_time_by_company_stats', {
          p_product_id: productId,
          p_period_start: periodStart,
          p_period_end: periodEnd,
          p_limit: limit,
          p_include_old: includeOld,
        }),
        10000
      );

      if (rpcError) {
        // ✅ Gestion d'erreur avec createError (dégradation gracieuse)
        const appError = createError.supabaseError(
          'Erreur lors de l\'appel RPC get_assistance_time_by_company_stats',
          rpcError instanceof Error ? rpcError : new Error(String(rpcError)),
          { productId, periodStart, periodEnd, limit, includeOld }
        );
        if (process.env.NODE_ENV === 'development') {
          console.error('[getAssistanceTimeByCompanyStats]', appError);
        }
        // Fallback vers l'ancienne méthode si la RPC échoue
        return await getAssistanceTimeByCompanyStatsLegacy(productId, periodStart, periodEnd, limit, includeOld);
      }

      if (!rpcData || rpcData.length === 0) {
        return {
          data: [],
          totalHours: 0,
          totalRealHours: 0,
          companyCount: 0,
          limit,
        };
      }

      // Convertir les données RPC en format attendu
      const data: CompanyAssistanceTimeData[] = rpcData.map((row: any) => ({
        companyId: row.company_id,
        companyName: row.company_name || 'Inconnu',
        totalHours: Number(row.total_hours),
        totalMinutes: Number(row.total_minutes),
        ticketCount: Number(row.ticket_count),
      }));

      // Calculer le total du Top N
      const totalMinutes = data.reduce((sum, c) => sum + c.totalMinutes, 0);
      const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
      
      // Note: Le total réel nécessiterait une requête supplémentaire pour toutes les entreprises
      // Pour l'instant, on utilise le total du Top N comme approximation
      // (ou on peut faire une requête séparée si nécessaire)
      const totalRealHours = totalHours;

      return {
        data,
        totalHours, // Total du Top N
        totalRealHours, // Total réel (approximation = Top N pour l'instant)
        companyCount: data.length,
        limit,
      };
    } catch (e) {
      // ✅ Gestion d'erreur avec createError (dégradation gracieuse)
      const appError = createError.internalError(
        'Erreur inattendue lors de la récupération du temps d\'interactions par entreprise',
        e instanceof Error ? e : new Error(String(e)),
        { productId, periodStart, periodEnd, limit, includeOld }
      );
      if (process.env.NODE_ENV === 'development') {
        console.error('[getAssistanceTimeByCompanyStats]', appError);
      }
      return null;
    }
  }
);

/**
 * Méthode legacy (fallback) - Ancienne implémentation avec pagination
 * Utilisée si la RPC échoue
 */
async function getAssistanceTimeByCompanyStatsLegacy(
  productId: string,
  periodStart: string,
  periodEnd: string,
  limit: number = 10,
  includeOld: boolean = false
): Promise<AssistanceTimeByCompanyStats | null> {
  const supabase = await createSupabaseServerClient();

  try {
      // 1. Récupérer TOUS les tickets (BUG, REQ, ASSISTANCE) de la période avec durée
      // IMPORTANT: Pagination nécessaire car Supabase limite à 1000 résultats par requête
      // Les interactions = BUG + REQ + ASSISTANCE + RELANCES
      const tickets: any[] = [];
      let offset = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        // ✅ TIMEOUT: 10s pour éviter les blocages prolongés
        let query = supabase
          .from('tickets')
          .select('id, company_id, ticket_type, duration_minutes, created_at, resolved_at, is_relance')
          .in('ticket_type', ['BUG', 'REQ', 'ASSISTANCE'])
          .eq('product_id', productId)
          .gte('created_at', periodStart)
          .lte('created_at', periodEnd);
        
        if (!includeOld) {
          query = query.eq('old', false);
        }
        
        const { data: page, error: ticketsError } = await withQueryTimeout(
          query.range(offset, offset + pageSize - 1),
          10000
        );

        if (ticketsError) {
          // ✅ Gestion d'erreur avec createError (dégradation gracieuse)
          const appError = createError.supabaseError(
            'Erreur lors de la récupération des tickets (legacy)',
            ticketsError instanceof Error ? ticketsError : new Error(String(ticketsError)),
            { productId, periodStart, periodEnd, limit, includeOld, offset }
          );
          if (process.env.NODE_ENV === 'development') {
            console.error('[getAssistanceTimeByCompanyStatsLegacy]', appError);
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

      if (tickets.length === 0) {
        return {
          data: [],
          totalHours: 0,
          totalRealHours: 0,
          companyCount: 0,
          limit,
        };
      }

      // 1.1. Récupérer les IDs des tickets ASSISTANCE pour les relances (commentaires followup)
      const assistanceTicketIds = tickets
        .filter(t => t.ticket_type === 'ASSISTANCE')
        .map(t => t.id);

      // ✅ OPTIMISATION: Paralléliser les requêtes indépendantes (commentaires et liens)
      const ticketIds = tickets.map(t => t.id);
      
      // Fonction helper pour paginer une requête .in()
      const paginateInQuery = async <T = any>(
        table: string,
        selectFields: string,
        inField: string,
        inValues: string[],
        additionalFilters?: (query: any) => any,
        pageSize: number = 1000
      ): Promise<T[]> => {
        const results: T[] = [];
        let offset = 0;
        let hasMore = true;

        while (hasMore && inValues.length > 0) {
          const valuesPage = inValues.slice(offset, offset + pageSize);

          let query = supabase
            .from(table)
            .select(selectFields)
            .in(inField, valuesPage);

          if (additionalFilters) {
            query = additionalFilters(query);
          }

          const { data: page, error } = await query;

          if (error) {
            if (process.env.NODE_ENV === 'development') {
              console.error(`[getAssistanceTimeByCompanyStats] Error fetching ${table}:`, error);
            }
            hasMore = false;
          } else if (page && page.length > 0) {
            results.push(...(page as T[]));
            offset += pageSize;
            hasMore = offset < inValues.length;
          } else {
            hasMore = false;
          }
        }

        return results;
      };

      // Paralléliser les 2 requêtes indépendantes
      const [followupComments, ticketCompanyLinks] = await Promise.all([
        // 1.2. Récupérer les commentaires de type 'followup' sur ces tickets
        assistanceTicketIds.length > 0
          ? paginateInQuery<{ ticket_id: string }>(
              'ticket_comments',
              'ticket_id',
              'ticket_id',
              assistanceTicketIds,
              (query) => query.eq('comment_type', 'followup')
            )
          : Promise.resolve([]),
        
        // 2. Récupérer les relations ticket-company via la table de liaison
        ticketIds.length > 0
          ? paginateInQuery<{ ticket_id: string; company_id: string }>(
              'ticket_company_link',
              'ticket_id, company_id',
              'ticket_id',
              ticketIds
            )
          : Promise.resolve([]),
      ]);

      // 1.3. Créer un map ticket_id -> nombre de relances (commentaires followup)
      const ticketFollowupCountMap = new Map<string, number>();
      followupComments.forEach(comment => {
        const count = ticketFollowupCountMap.get(comment.ticket_id) || 0;
        ticketFollowupCountMap.set(comment.ticket_id, count + 1);
      });

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
          totalRealHours: 0,
          companyCount: 0,
          limit,
        };
      }

      // 5. Récupérer les noms des entreprises
      // ✅ TIMEOUT: 10s pour éviter les blocages prolongés
      const { data: companies, error: companiesError } = await withQueryTimeout(
        supabase
          .from('companies')
          .select('id, name')
          .in('id', uniqueCompanyIds),
        10000
      );

      if (companiesError) {
        // ✅ Gestion d'erreur avec createError (dégradation gracieuse)
        const appError = createError.supabaseError(
          'Erreur lors de la récupération des entreprises (legacy)',
          companiesError instanceof Error ? companiesError : new Error(String(companiesError)),
          { productId, periodStart, periodEnd, limit, includeOld }
        );
        if (process.env.NODE_ENV === 'development') {
          console.error('[getAssistanceTimeByCompanyStatsLegacy]', appError);
        }
        return null;
      }

      const companiesMap = new Map<string, string>();
      if (companies) {
        companies.forEach((c: any) => {
          companiesMap.set(c.id, c.name || 'Inconnu');
        });
      }

      // 6. Agréger par entreprise (somme des durées de toutes les interactions)
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
        
        // Ajouter la durée du ticket (BUG, REQ, ou ASSISTANCE normale)
        company.totalMinutes += durationMinutes;
        company.ticketCount++;
        
        // Pour les tickets ASSISTANCE avec is_relance=true, ajouter leur durée comme relance
        if (ticket.ticket_type === 'ASSISTANCE' && ticket.is_relance === true) {
          // La durée est déjà comptée ci-dessus, mais on compte aussi comme relance
          // (pas besoin de recompter la durée, juste le nombre)
        }
        
        // Pour les commentaires followup, on ne peut pas ajouter de durée car
        // les commentaires n'ont pas de duration_minutes. On compte juste le nombre.
        // La durée reste celle du ticket ASSISTANCE parent.
        if (ticket.ticket_type === 'ASSISTANCE') {
          const followupCount = ticketFollowupCountMap.get(ticket.id) || 0;
          // Les followups n'ajoutent pas de durée supplémentaire, juste un comptage
          // (optionnel : on pourrait ajouter une durée moyenne par followup si nécessaire)
        }
      });

      // 7. Convertir minutes en heures et arrondir
      companyDataMap.forEach((company) => {
        company.totalHours = Math.round((company.totalMinutes / 60) * 10) / 10; // Arrondir à 1 décimale
      });

      // 8. Trier par temps décroissant
      const allSortedData = Array.from(companyDataMap.values())
        .sort((a, b) => b.totalMinutes - a.totalMinutes);

      // 9. Calculer le total réel de TOUTES les entreprises
      const totalAllCompaniesMinutes = allSortedData.reduce((sum, c) => sum + c.totalMinutes, 0);
      const totalAllCompaniesHours = Math.round((totalAllCompaniesMinutes / 60) * 10) / 10;

      // 10. Prendre uniquement le Top N (sans barre "Autre")
      const topCompanies = allSortedData.slice(0, limit);
      const top10Minutes = topCompanies.reduce((sum, c) => sum + c.totalMinutes, 0);
      const top10Hours = Math.round((top10Minutes / 60) * 10) / 10;

      console.log(
        `[getAssistanceTimeByCompanyStats] Found ${topCompanies.length} companies (Top ${limit}), ${top10Hours.toFixed(1)}h/${totalAllCompaniesHours.toFixed(1)}h total (${allSortedData.reduce((sum, c) => sum + c.ticketCount, 0)} tickets)`
      );

      return {
        data: topCompanies,
        totalHours: top10Hours, // Total du Top 10
        totalRealHours: totalAllCompaniesHours, // Total réel de toutes les entreprises
        companyCount: topCompanies.length,
        limit,
      };
    } catch (e) {
      // ✅ Gestion d'erreur avec createError (dégradation gracieuse)
      const appError = createError.internalError(
        'Erreur inattendue lors de la récupération du temps d\'interactions (legacy)',
        e instanceof Error ? e : new Error(String(e)),
        { productId, periodStart, periodEnd, limit, includeOld }
      );
      if (process.env.NODE_ENV === 'development') {
        console.error('[getAssistanceTimeByCompanyStatsLegacy]', appError);
      }
      return null;
    }
}


