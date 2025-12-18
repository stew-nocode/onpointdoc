/**
 * Service de statistiques des BUGs par type
 * 
 * @description
 * Fournit les données pour le DonutChart montrant la répartition
 * des BUGs par type (bug_type field).
 * 
 * Soumis aux filtres globaux (période).
 * 
 * @see docs/dashboard/REFONTE-DASHBOARD-SPECIFICATION.md - Section 3.3
 */
import { cache } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { BugType } from '@/lib/constants/tickets';

/**
 * Type pour les données d'un type de BUG
 */
export type BugTypeData = {
  /** Nom du type de BUG */
  bugType: string;
  /** Nombre de BUGs de ce type */
  count: number;
  /** Pourcentage du total (0-100) */
  percentage: number;
};

/**
 * Type des statistiques BUGs par type
 */
export type BugsByTypeStats = {
  /** Données par type de BUG (triées par count décroissant) */
  data: BugTypeData[];
  /** Nombre total de BUGs */
  totalBugs: number;
  /** Nombre de types de BUG uniques */
  typeCount: number;
  /** Limite appliquée (top N) */
  limit: number;
};

/**
 * Récupère les statistiques de BUGs par type
 * 
 * @param productId - ID du produit
 * @param periodStart - Date de début (ISO string)
 * @param periodEnd - Date de fin (ISO string)
 * @param limit - Nombre max de types à retourner (défaut: 10)
 * @returns Statistiques par type ou null en cas d'erreur
 */
export const getBugsByTypeStats = cache(
  async (
    productId: string,
    periodStart: string,
    periodEnd: string,
    limit: number = 10
  ): Promise<BugsByTypeStats | null> => {
    const supabase = await createSupabaseServerClient();

    try {
      // 1. Récupérer les BUGs de la période avec leur bug_type
      const { data: bugs, error: bugsError } = await supabase
        .from('tickets')
        .select('id, bug_type')
        .eq('ticket_type', 'BUG')
        .eq('product_id', productId)
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd);

      if (bugsError) {
        console.error('[getBugsByTypeStats] Error fetching bugs:', bugsError);
        return null;
      }

      if (!bugs || bugs.length === 0) {
        return {
          data: [],
          totalBugs: 0,
          typeCount: 0,
          limit,
        };
      }

      // 2. Agréger par bug_type
      const typeCountMap = new Map<string, number>();

      bugs.forEach((bug: any) => {
        const bugType = bug.bug_type || 'Non spécifié';
        typeCountMap.set(bugType, (typeCountMap.get(bugType) || 0) + 1);
      });

      const totalBugs = bugs.length;

      // 3. Convertir en tableau et trier par count décroissant
      let sortedData = Array.from(typeCountMap.entries())
        .map(([bugType, count]) => ({
          bugType,
          count,
          percentage: Math.round((count / totalBugs) * 100),
        }))
        .sort((a, b) => b.count - a.count);

      // 4. Limiter au Top N et regrouper le reste dans "Autres"
      if (sortedData.length > limit) {
        const topN = sortedData.slice(0, limit);
        const others = sortedData.slice(limit);
        
        const othersCount = others.reduce((sum, item) => sum + item.count, 0);
        const othersPercentage = Math.round((othersCount / totalBugs) * 100);
        
        if (othersCount > 0) {
          topN.push({
            bugType: 'Autres',
            count: othersCount,
            percentage: othersPercentage,
          });
        }
        
        sortedData = topN;
      }

      console.log(
        `[getBugsByTypeStats] Found ${sortedData.length} bug types, ${totalBugs} bugs total`
      );

      return {
        data: sortedData,
        totalBugs,
        typeCount: typeCountMap.size,
        limit,
      };
    } catch (error) {
      console.error('[getBugsByTypeStats] Unexpected error:', error);
      return null;
    }
  }
);




