/**
 * Service de statistiques des tickets par produit/module pour une entreprise
 * 
 * @description
 * Fournit les données pour le Vertical Stacked Bar Chart
 * montrant la répartition des tickets (BUG | REQ | ASSISTANCE) par produit et module.
 * 
 * Les tickets peuvent être liés à une entreprise de deux façons :
 * 1. Via `company_id` direct dans la table `tickets`
 * 2. Via `ticket_company_link` (table de liaison many-to-many)
 * 
 * @see src/services/dashboard/tickets-by-module-stats.ts - Service dashboard (par produit)
 */

import { cache } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Type pour les données d'un produit/module
 */
export type ProductModuleTicketData = {
  /** ID du produit */
  productId: string;
  /** Nom du produit */
  productName: string;
  /** ID du module */
  moduleId: string;
  /** Nom du module */
  moduleName: string;
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
 * Type des statistiques par produit/module
 */
export type CompanyTicketsByProductModuleStats = {
  /** Données par produit/module (triées par total décroissant) */
  data: ProductModuleTicketData[];
  /** Nombre total de tickets */
  totalTickets: number;
  /** Nombre de combinaisons produit/module */
  combinationCount: number;
  /** Limite appliquée (top N) */
  limit: number;
};

/**
 * Récupère les statistiques de tickets par produit/module pour une entreprise
 * 
 * @param companyId - ID de l'entreprise
 * @param periodStart - Date de début (ISO string)
 * @param periodEnd - Date de fin (ISO string)
 * @param limit - Nombre max de combinaisons à retourner (défaut: 10)
 * @returns Statistiques par produit/module ou null en cas d'erreur
 */
export const getCompanyTicketsByProductModuleStats = cache(
  async (
    companyId: string,
    periodStart: string,
    periodEnd: string,
    limit: number = 10
  ): Promise<CompanyTicketsByProductModuleStats | null> => {
    const supabase = await createSupabaseServerClient();

    try {
      // 1. Récupérer les tickets avec company_id direct
      const { data: ticketsDirect, error: errorDirect } = await supabase
        .from('tickets')
        .select('id, ticket_type, product_id, module_id')
        .eq('company_id', companyId)
        .in('ticket_type', ['BUG', 'REQ', 'ASSISTANCE'])
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd)
        .not('product_id', 'is', null)
        .not('module_id', 'is', null);

      if (errorDirect) {
        console.error('[getCompanyTicketsByProductModuleStats] Error fetching direct tickets:', errorDirect);
        return null;
      }

      // 2. Récupérer les tickets liés via ticket_company_link
      const { data: ticketLinks, error: errorLinks } = await supabase
        .from('ticket_company_link')
        .select(`
          ticket_id,
          ticket:tickets!ticket_company_link_ticket_id_fkey(
            id,
            ticket_type,
            product_id,
            module_id,
            created_at
          )
        `)
        .eq('company_id', companyId);

      if (errorLinks) {
        console.error('[getCompanyTicketsByProductModuleStats] Error fetching linked tickets:', errorLinks);
        return null;
      }

      // Récupérer les IDs des tickets directs pour éviter les doublons
      const directTicketIds = new Set((ticketsDirect || []).map((t) => t.id || ''));

      // Filtrer les tickets liés par période et type, et exclure les doublons
      type LinkedTicket = {
        id: string;
        ticket_type: string;
        product_id: string | null;
        module_id: string | null;
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
            t.product_id !== null &&
            t.module_id !== null &&
            !directTicketIds.has(t.id)
          );
        });

      // Combiner tous les tickets
      const allTickets = [
        ...(ticketsDirect || []).map((t) => ({
          id: t.id,
          ticket_type: t.ticket_type,
          product_id: t.product_id,
          module_id: t.module_id,
        })),
        ...linkedTickets.map((t) => ({
          id: t.id,
          ticket_type: t.ticket_type,
          product_id: t.product_id,
          module_id: t.module_id,
        })),
      ];

      if (allTickets.length === 0) {
        return {
          data: [],
          totalTickets: 0,
          combinationCount: 0,
          limit,
        };
      }

      // 3. Collecter les IDs uniques de produits et modules
      const uniqueProductIds = [...new Set(allTickets.map((t) => t.product_id).filter((id): id is string => id !== null))];
      const uniqueModuleIds = [...new Set(allTickets.map((t) => t.module_id).filter((id): id is string => id !== null))];

      // 4. Récupérer les noms des produits et modules
      const [productsResult, modulesResult] = await Promise.all([
        supabase
          .from('products')
          .select('id, name')
          .in('id', uniqueProductIds),
        supabase
          .from('modules')
          .select('id, name')
          .in('id', uniqueModuleIds),
      ]);

      if (productsResult.error) {
        console.error('[getCompanyTicketsByProductModuleStats] Error fetching products:', productsResult.error);
        return null;
      }

      if (modulesResult.error) {
        console.error('[getCompanyTicketsByProductModuleStats] Error fetching modules:', modulesResult.error);
        return null;
      }

      const productsMap = new Map<string, string>();
      if (productsResult.data) {
        productsResult.data.forEach((p: any) => {
          productsMap.set(p.id, p.name || 'Produit inconnu');
        });
      }

      const modulesMap = new Map<string, string>();
      if (modulesResult.data) {
        modulesResult.data.forEach((m: any) => {
          modulesMap.set(m.id, m.name || 'Module inconnu');
        });
      }

      // 5. Agréger par combinaison produit/module
      const combinationMap = new Map<string, ProductModuleTicketData>();

      allTickets.forEach((ticket) => {
        if (!ticket.product_id || !ticket.module_id) return;

        const key = `${ticket.product_id}-${ticket.module_id}`;
        const productName = productsMap.get(ticket.product_id) || 'Produit inconnu';
        const moduleName = modulesMap.get(ticket.module_id) || 'Module inconnu';

        if (!combinationMap.has(key)) {
          combinationMap.set(key, {
            productId: ticket.product_id,
            productName,
            moduleId: ticket.module_id,
            moduleName,
            bug: 0,
            req: 0,
            assistance: 0,
            total: 0,
          });
        }

        const combination = combinationMap.get(key)!;
        
        switch (ticket.ticket_type) {
          case 'BUG':
            combination.bug++;
            break;
          case 'REQ':
            combination.req++;
            break;
          case 'ASSISTANCE':
            combination.assistance++;
            break;
        }
        combination.total++;
      });

      // 6. Trier et limiter
      const sortedData = Array.from(combinationMap.values())
        .sort((a, b) => b.total - a.total)
        .slice(0, limit);

      const totalTickets = sortedData.reduce((sum, c) => sum + c.total, 0);

      if (process.env.NODE_ENV === 'development') {
        console.log(
          `[getCompanyTicketsByProductModuleStats] Company ${companyId}: ${sortedData.length} combinations, ${totalTickets} tickets`
        );
      }

      return {
        data: sortedData,
        totalTickets,
        combinationCount: sortedData.length,
        limit,
      };
    } catch (error) {
      console.error('[getCompanyTicketsByProductModuleStats] Unexpected error:', error);
      return null;
    }
  }
);

