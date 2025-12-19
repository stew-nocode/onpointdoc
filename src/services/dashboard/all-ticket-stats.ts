/**
 * Service optimisé pour récupérer toutes les stats de tickets en 1 seule requête
 *
 * @description
 * Utilise la fonction PostgreSQL get_all_ticket_stats() pour agréger
 * les stats BUG, REQ et ASSISTANCE en une seule requête au lieu de 6.
 *
 * Gain estimé : 6 requêtes → 1 requête (-83%)
 * Temps estimé : 150ms → 25ms (-83%)
 *
 * @see supabase/migrations/2025-12-18-optimize-dashboard-stats-functions.sql
 */
import { cache } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Type des statistiques pour un type de ticket
 */
export type TicketStats = {
  total: number;
  resolus: number;
  ouverts: number;
  tauxResolution: number;
};

/**
 * Type des statistiques pour tous les types de tickets
 */
export type AllTicketStats = {
  bug: TicketStats;
  req: TicketStats;
  assistance: TicketStats;
};

/**
 * Type de retour de la fonction PostgreSQL
 */
type PostgresTicketStats = {
  ticket_type: 'BUG' | 'REQ' | 'ASSISTANCE';
  total: number;
  resolus: number;
  ouverts: number;
  taux_resolution: number;
};

/**
 * Récupère les statistiques pour tous les types de tickets en 1 seule requête
 *
 * @param productId - UUID du produit (optionnel, tous les produits si non spécifié)
 * @returns Statistiques pour BUG, REQ et ASSISTANCE
 *
 * @example
 * ```typescript
 * const stats = await getAllTicketStats('91304e02-2ce6-4811-b19d-1cae091a6fde');
 * console.log(`BUG: ${stats.bug.total} total, ${stats.bug.tauxResolution}% résolution`);
 * ```
 */
async function getAllTicketStatsInternal(productId?: string): Promise<AllTicketStats> {
  const supabase = await createSupabaseServerClient();

  try {
    // Appeler la fonction PostgreSQL optimisée
    const { data, error } = await supabase.rpc('get_all_ticket_stats', {
      p_product_id: productId || null,
    });

    if (error) {
      console.error('[getAllTicketStats] Error calling RPC:', error);
      return getEmptyStats();
    }

    if (!data || data.length === 0) {
      console.log('[getAllTicketStats] No data returned');
      return getEmptyStats();
    }

    // Transformer en objet indexé par type
    const result: AllTicketStats = getEmptyStats();

    (data as PostgresTicketStats[]).forEach((row) => {
      const type = row.ticket_type.toLowerCase() as 'bug' | 'req' | 'assistance';
      result[type] = {
        total: Number(row.total),
        resolus: Number(row.resolus),
        ouverts: Number(row.ouverts),
        tauxResolution: Number(row.taux_resolution),
      };
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('[getAllTicketStats] Stats loaded:', {
        bug: `${result.bug.total} total (${result.bug.tauxResolution}%)`,
        req: `${result.req.total} total (${result.req.tauxResolution}%)`,
        assistance: `${result.assistance.total} total (${result.assistance.tauxResolution}%)`,
      });
    }

    return result;
  } catch (error) {
    console.error('[getAllTicketStats] Unexpected error:', error);
    return getEmptyStats();
  }
}

/**
 * Retourne des statistiques vides (fallback)
 */
function getEmptyStats(): AllTicketStats {
  const emptyTicketStats: TicketStats = {
    total: 0,
    resolus: 0,
    ouverts: 0,
    tauxResolution: 0,
  };

  return {
    bug: { ...emptyTicketStats },
    req: { ...emptyTicketStats },
    assistance: { ...emptyTicketStats },
  };
}

/**
 * Service avec React.cache() pour éviter les appels redondants
 *
 * ✅ Optimisations :
 * - 1 seule requête au lieu de 6 (-83%)
 * - Utilise React.cache() pour déduplication
 * - Fonction PostgreSQL avec PARALLEL SAFE
 * - Index optimisés (idx_tickets_dashboard_main)
 */
export const getAllTicketStats = cache(getAllTicketStatsInternal);
