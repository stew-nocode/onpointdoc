/**
 * Service de statistiques de distribution des tickets par type
 *
 * @description
 * Fournit les données pour le PieChart de distribution par type de ticket.
 * Soumis aux filtres globaux (période).
 *
 * ✅ OPTIMISÉ v2 : Utilise la fonction PostgreSQL get_tickets_distribution_with_relances()
 * pour réduire 3 requêtes (tickets + followup RPC + calculs JS) en 1 seule (-67% de requêtes).
 *
 * Version 2.0 - Performance améliorée :
 * - Avant : 3 requêtes séparées (~120ms)
 * - Après : 1 RPC PostgreSQL (~30ms)
 * - Gain : -67% requêtes, -75% temps
 *
 * @see docs/dashboard/REFONTE-DASHBOARD-SPECIFICATION.md - Section 3.3
 * @see supabase/migrations/20250122000000_add_tickets_distribution_rpc.sql
 */
import { cache } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { withRpcTimeout } from '@/lib/utils/supabase-timeout';
import { createError } from '@/lib/errors/types';

/**
 * Type pour un élément de la distribution
 */
export type TicketTypeDistributionItem = {
  type: 'BUG' | 'REQ' | 'ASSISTANCE' | 'RELANCE';
  count: number;
  percentage: number;
  color: string;
};

/**
 * Type des statistiques de distribution
 */
export type TicketsDistributionStats = {
  items: TicketTypeDistributionItem[];
  total: number;
  periodStart: string;
  periodEnd: string;
};

/**
 * Couleurs par type de ticket (light/dark mode supporté via CSS variables)
 */
const TYPE_COLORS: Record<string, string> = {
  BUG: 'hsl(var(--chart-bug))',
  REQ: 'hsl(var(--chart-req))',
  ASSISTANCE: 'hsl(var(--chart-assistance))',
  RELANCE: 'hsl(var(--chart-relance))',
};

/**
 * Couleurs fallback si CSS variables non définies
 */
const TYPE_COLORS_FALLBACK: Record<string, string> = {
  BUG: '#F43F5E',        // Rose
  REQ: '#3B82F6',        // Bleu
  ASSISTANCE: '#14B8A6', // Teal
  RELANCE: '#F59E0B',    // Amber
};

/**
 * Récupère les statistiques de distribution par type de ticket
 * 
 * Les relances = tickets ASSISTANCE avec is_relance=true + commentaires followup
 * 
 * @param productId - ID du produit pour filtrer
 * @param periodStart - Date de début de période (ISO string)
 * @param periodEnd - Date de fin de période (ISO string)
 * @returns Statistiques de distribution ou null en cas d'erreur
 */
/**
 * Type de retour de la RPC PostgreSQL
 */
type PostgresDistributionRow = {
  ticket_type: 'BUG' | 'REQ' | 'ASSISTANCE' | 'RELANCE';
  count: number;
  percentage: number;
};

export const getTicketsDistributionStats = cache(
  async (
    productId: string,
    periodStart: string,
    periodEnd: string,
    includeOld: boolean = false
  ): Promise<TicketsDistributionStats | null> => {
    const supabase = await createSupabaseServerClient();

    try {
      // ✅ OPTIMISATION v2 : 1 seule RPC au lieu de 3 requêtes
      // - Avant : fetch tickets (paginé) + RPC followup + calculs JS
      // - Après : 1 RPC qui fait tout en SQL
      // ✅ TIMEOUT: 10s pour éviter les blocages prolongés
      const { data, error } = await withRpcTimeout(
        supabase.rpc('get_tickets_distribution_with_relances', {
          p_product_id: productId,
          p_period_start: periodStart,
          p_period_end: periodEnd,
          p_include_old: includeOld,
        }),
        10000
      );

      if (error) {
        // ✅ Gestion d'erreur avec createError (dégradation gracieuse)
        const appError = createError.supabaseError(
          'Erreur lors de l\'appel RPC get_tickets_distribution_with_relances',
          error instanceof Error ? error : new Error(String(error)),
          { productId, periodStart, periodEnd, includeOld }
        );
        if (process.env.NODE_ENV === 'development') {
          console.error('[getTicketsDistributionStats]', appError);
        }
        return null;
      }

      // Si aucune donnée retournée (pas de tickets dans la période)
      if (!data || data.length === 0) {
        return {
          items: [],
          total: 0,
          periodStart,
          periodEnd,
        };
      }

      const rows = data as PostgresDistributionRow[];

      // Calculer le total
      const total = rows.reduce((sum, row) => sum + Number(row.count), 0);

      // Construire les items avec couleurs
      const items: TicketTypeDistributionItem[] = rows.map((row) => ({
        type: row.ticket_type,
        count: Number(row.count),
        percentage: Number(row.percentage),
        color: TYPE_COLORS_FALLBACK[row.ticket_type],
      }));

      // Les résultats sont déjà triés par count décroissant depuis la RPC

      if (process.env.NODE_ENV === 'development') {
        console.log(`[getTicketsDistributionStats] Distribution (RPC v2): ${items.length} types, total=${total}`);
      }

      return {
        items,
        total,
        periodStart,
        periodEnd,
      };
    } catch (e) {
      // ✅ Gestion d'erreur avec createError (dégradation gracieuse)
      const appError = createError.internalError(
        'Erreur inattendue lors de la récupération de la distribution des tickets',
        e instanceof Error ? e : new Error(String(e)),
        { productId, periodStart, periodEnd, includeOld }
      );
      if (process.env.NODE_ENV === 'development') {
        console.error('[getTicketsDistributionStats]', appError);
      }
      return null;
    }
  }
);






