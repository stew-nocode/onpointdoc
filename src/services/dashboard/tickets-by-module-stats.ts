/**
 * Service de statistiques des tickets par module
 * 
 * @description
 * Fournit les données pour le Vertical Grouped Bar Chart
 * montrant la répartition des tickets (BUG | REQ | ASSISTANCE) par module.
 * 
 * Soumis aux filtres globaux (période).
 * 
 * @see docs/dashboard/REFONTE-DASHBOARD-SPECIFICATION.md - Section 3.3
 */
import { cache } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { withQueryTimeout } from '@/lib/utils/supabase-query-timeout';
import { createError } from '@/lib/errors/types';

/**
 * Type pour les données d'un module
 */
export type ModuleTicketData = {
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
 * Type des statistiques par module
 */
export type TicketsByModuleStats = {
  /** Données par module (triées par total décroissant) */
  data: ModuleTicketData[];
  /** Nombre total de tickets */
  totalTickets: number;
  /** Nombre de modules */
  moduleCount: number;
  /** Limite appliquée (top N) */
  limit: number;
};

/**
 * Récupère les statistiques de tickets par module
 * 
 * @param productId - ID du produit
 * @param periodStart - Date de début (ISO string)
 * @param periodEnd - Date de fin (ISO string)
 * @param limit - Nombre max de modules à retourner (défaut: 10)
 * @returns Statistiques par module ou null en cas d'erreur
 */
export const getTicketsByModuleStats = cache(
  async (
    productId: string,
    periodStart: string,
    periodEnd: string,
    limit: number = 10,
    includeOld: boolean = false
  ): Promise<TicketsByModuleStats | null> => {
    const supabase = await createSupabaseServerClient();

    try {
      // 1. Récupérer les tickets de la période avec leur module
      // ✅ TIMEOUT: 10s pour éviter les blocages prolongés
      let query = supabase
        .from('tickets')
        .select('id, ticket_type, module_id')
        .eq('product_id', productId)
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd)
        .not('module_id', 'is', null); // Uniquement les tickets avec module
      
      if (!includeOld) {
        query = query.eq('old', false);
      }
      
      const { data: tickets, error: ticketsError } = await withQueryTimeout(query, 10000);

      if (ticketsError) {
        // ✅ Gestion d'erreur avec createError (dégradation gracieuse)
        const appError = createError.supabaseError(
          'Erreur lors de la récupération des tickets par module',
          ticketsError instanceof Error ? ticketsError : new Error(String(ticketsError)),
          { productId, periodStart, periodEnd, limit, includeOld }
        );
        if (process.env.NODE_ENV === 'development') {
          console.error('[getTicketsByModuleStats]', appError);
        }
        return null;
      }

      if (!tickets || tickets.length === 0) {
        return {
          data: [],
          totalTickets: 0,
          moduleCount: 0,
          limit,
        };
      }

      // 2. Collecter les module_id uniques
      const uniqueModuleIds = [...new Set(tickets.map((t: any) => t.module_id))];

      if (uniqueModuleIds.length === 0) {
        return {
          data: [],
          totalTickets: tickets.length,
          moduleCount: 0,
          limit,
        };
      }

      // 3. Récupérer les noms des modules
      // ✅ TIMEOUT: 10s pour éviter les blocages prolongés
      const { data: modules, error: modulesError } = await withQueryTimeout(
        supabase
          .from('modules')
          .select('id, name')
          .in('id', uniqueModuleIds),
        10000
      );

      if (modulesError) {
        // ✅ Gestion d'erreur avec createError (dégradation gracieuse)
        const appError = createError.supabaseError(
          'Erreur lors de la récupération des modules',
          modulesError instanceof Error ? modulesError : new Error(String(modulesError)),
          { productId, periodStart, periodEnd, limit, includeOld }
        );
        if (process.env.NODE_ENV === 'development') {
          console.error('[getTicketsByModuleStats]', appError);
        }
        return null;
      }

      const modulesMap = new Map<string, string>();
      if (modules) {
        modules.forEach((m: any) => {
          modulesMap.set(m.id, m.name || 'Module inconnu');
        });
      }

      // 4. Agréger par module
      const moduleDataMap = new Map<string, ModuleTicketData>();

      tickets.forEach((ticket: any) => {
        const moduleId = ticket.module_id;
        if (!moduleId) return;

        const moduleName = modulesMap.get(moduleId) || 'Module inconnu';

        if (!moduleDataMap.has(moduleId)) {
          moduleDataMap.set(moduleId, {
            moduleId,
            moduleName,
            bug: 0,
            req: 0,
            assistance: 0,
            total: 0,
          });
        }

        const dataModule = moduleDataMap.get(moduleId)!;

        switch (ticket.ticket_type) {
          case 'BUG':
            dataModule.bug++;
            break;
          case 'REQ':
            dataModule.req++;
            break;
          case 'ASSISTANCE':
            dataModule.assistance++;
            break;
        }
        dataModule.total++;
      });

      // 5. Trier et limiter
      const sortedData = Array.from(moduleDataMap.values())
        .sort((a, b) => b.total - a.total)
        .slice(0, limit);

      const totalTickets = sortedData.reduce((sum, m) => sum + m.total, 0);

      console.log(
        `[getTicketsByModuleStats] Found ${sortedData.length} modules, ${totalTickets} tickets (from ${tickets.length} total)`
      );

      return {
        data: sortedData,
        totalTickets,
        moduleCount: sortedData.length,
        limit,
      };
    } catch (e) {
      // ✅ Gestion d'erreur avec createError (dégradation gracieuse)
      const appError = createError.internalError(
        'Erreur inattendue lors de la récupération des tickets par module',
        e instanceof Error ? e : new Error(String(e)),
        { productId, periodStart, periodEnd, limit, includeOld }
      );
      if (process.env.NODE_ENV === 'development') {
        console.error('[getTicketsByModuleStats]', appError);
      }
      return null;
    }
  }
);




