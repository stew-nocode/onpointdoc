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
    limit: number = 10
  ): Promise<TicketsByModuleStats | null> => {
    const supabase = await createSupabaseServerClient();

    try {
      // 1. Récupérer les tickets de la période avec leur module
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('id, ticket_type, module_id')
        .eq('product_id', productId)
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd)
        .not('module_id', 'is', null); // Uniquement les tickets avec module

      if (ticketsError) {
        console.error('[getTicketsByModuleStats] Error fetching tickets:', ticketsError);
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
      const { data: modules, error: modulesError } = await supabase
        .from('modules')
        .select('id, name')
        .in('id', uniqueModuleIds);

      if (modulesError) {
        console.error('[getTicketsByModuleStats] Error fetching modules:', modulesError);
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

        const module = moduleDataMap.get(moduleId)!;
        
        switch (ticket.ticket_type) {
          case 'BUG':
            module.bug++;
            break;
          case 'REQ':
            module.req++;
            break;
          case 'ASSISTANCE':
            module.assistance++;
            break;
        }
        module.total++;
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
    } catch (error) {
      console.error('[getTicketsByModuleStats] Unexpected error:', error);
      return null;
    }
  }
);




