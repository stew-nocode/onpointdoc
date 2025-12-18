/**
 * Service de statistiques de distribution des tickets par type
 * 
 * @description
 * Fournit les données pour le PieChart de distribution par type de ticket.
 * Soumis aux filtres globaux (période).
 * 
 * ✅ OPTIMISÉ : Utilise la fonction PostgreSQL get_tickets_distribution_stats()
 * pour réduire 3 requêtes en 1 seule (-67% de requêtes).
 * 
 * @see docs/dashboard/REFONTE-DASHBOARD-SPECIFICATION.md - Section 3.3
 * @see supabase/migrations/20251218000000_optimize_dashboard_stats_functions.sql
 */
import { cache } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Type pour un élément de la distribution
 */
export type TicketTypeDistributionItem = {
  type: 'BUG' | 'REQ' | 'ASSISTANCE';
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
};

/**
 * Couleurs fallback si CSS variables non définies
 */
const TYPE_COLORS_FALLBACK: Record<string, string> = {
  BUG: '#F43F5E',        // Rose
  REQ: '#3B82F6',        // Bleu
  ASSISTANCE: '#14B8A6', // Teal
};

/**
 * Type de retour de la fonction PostgreSQL
 */
type PostgresDistributionStats = {
  ticket_type: 'BUG' | 'REQ' | 'ASSISTANCE';
  count: number;
  percentage: number;
};

/**
 * Récupère les statistiques de distribution par type de ticket
 * 
 * ✅ OPTIMISÉ : Utilise get_tickets_distribution_stats() (1 requête au lieu de 3)
 * 
 * @param productId - ID du produit pour filtrer
 * @param periodStart - Date de début de période (ISO string)
 * @param periodEnd - Date de fin de période (ISO string)
 * @returns Statistiques de distribution ou null en cas d'erreur
 */
export const getTicketsDistributionStats = cache(
  async (
    productId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<TicketsDistributionStats | null> => {
    const supabase = await createSupabaseServerClient();

    try {
      // Appeler la fonction PostgreSQL optimisée (1 requête au lieu de 3)
      const { data, error } = await supabase.rpc('get_tickets_distribution_stats', {
        p_product_id: productId,
        p_period_start: periodStart,
        p_period_end: periodEnd,
      });

      if (error) {
        console.error('[getTicketsDistributionStats] Error calling RPC:', error);
        return null;
      }

      if (!data || data.length === 0) {
        console.log('[getTicketsDistributionStats] No data returned');
        return {
          items: [],
          total: 0,
          periodStart,
          periodEnd,
        };
      }

      // Transformer les résultats PostgreSQL en format attendu
      const results = data as PostgresDistributionStats[];
      const ticketTypes: Array<'BUG' | 'REQ' | 'ASSISTANCE'> = ['BUG', 'REQ', 'ASSISTANCE'];
      
      // Créer un map pour accès rapide
      const statsMap = new Map<string, PostgresDistributionStats>();
      results.forEach((row) => {
        statsMap.set(row.ticket_type, row);
      });

      // Calculer le total
      const total = results.reduce((sum, row) => sum + Number(row.count), 0);

      // Construire les items avec pourcentages (déjà calculés par PostgreSQL)
      const items: TicketTypeDistributionItem[] = ticketTypes
        .map((type) => {
          const stats = statsMap.get(type);
          return {
            type,
            count: stats ? Number(stats.count) : 0,
            percentage: stats ? Number(stats.percentage) : 0,
            color: TYPE_COLORS_FALLBACK[type],
          };
        })
        .filter((item) => item.count > 0); // Filtrer les types sans tickets

      // Trier par count décroissant
      items.sort((a, b) => b.count - a.count);

      if (process.env.NODE_ENV === 'development') {
        console.log(`[getTicketsDistributionStats] Distribution: ${items.length} types, total=${total}`);
      }

      return {
        items,
        total,
        periodStart,
        periodEnd,
      };
    } catch (error) {
      console.error('[getTicketsDistributionStats] Unexpected error:', error);
      return null;
    }
  }
);






