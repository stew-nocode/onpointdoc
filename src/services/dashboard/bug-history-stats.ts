/**
 * Service de statistiques historiques pour les tickets BUG
 * 
 * @description
 * Fournit des statistiques temps réel (non filtrées par période) 
 * pour la section KPIs Statiques du dashboard.
 * 
 * Utilise des requêtes de count pour contourner la limite de 1000 lignes de Supabase.
 * 
 * @see docs/dashboard/REFONTE-DASHBOARD-SPECIFICATION.md - Section 3.1
 */
import { cache } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Type des statistiques BUG
 */
export type BugHistoryStats = {
  total: number;
  ouverts: number;
  resolus: number;
  tauxResolution: number;
  critiquesOuverts: number;
  highOuverts: number;
  mttrHeures: number | null;
};

/**
 * Statuts considérés comme "résolus"
 */
const RESOLVED_STATUSES = ['Terminé(e)', 'Resolue', 'Closed', 'Done'];

/**
 * Récupère les statistiques historiques des BUGs (temps réel)
 * 
 * @param productId - ID du produit (optionnel, tous les produits si non spécifié)
 * @returns Statistiques BUG complètes
 */
async function getBugHistoryStatsInternal(
  productId?: string
): Promise<BugHistoryStats> {
  const supabase = await createSupabaseServerClient();

  // Requête 1: Count total des BUG
  let totalQuery = supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('ticket_type', 'BUG');
  
  if (productId) {
    totalQuery = totalQuery.eq('product_id', productId);
  }

  const { count: total, error: totalError } = await totalQuery;

  if (totalError) {
    console.error('[getBugHistoryStats] Error fetching total count:', totalError);
    return getEmptyStats();
  }

  // Requête 2: Count des BUG résolus
  let resolusQuery = supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('ticket_type', 'BUG')
    .in('status', RESOLVED_STATUSES);

  if (productId) {
    resolusQuery = resolusQuery.eq('product_id', productId);
  }

  const { count: resolus, error: resolusError } = await resolusQuery;

  if (resolusError) {
    console.error('[getBugHistoryStats] Error fetching resolus count:', resolusError);
    return getEmptyStats();
  }

  const totalCount = total ?? 0;
  const resolusCount = resolus ?? 0;
  const ouvertsCount = totalCount - resolusCount;
  const tauxResolution = totalCount > 0 ? Math.round((resolusCount / totalCount) * 100) : 0;

  console.log(`[getBugHistoryStats] BUG stats: total=${totalCount}, ouverts=${ouvertsCount}, resolus=${resolusCount}`);

  return {
    total: totalCount,
    ouverts: ouvertsCount,
    resolus: resolusCount,
    tauxResolution,
    critiquesOuverts: 0, // Retiré de l'affichage
    highOuverts: 0,      // Retiré de l'affichage
    mttrHeures: null,    // Retiré de l'affichage
  };
}

/**
 * Retourne des statistiques vides
 */
function getEmptyStats(): BugHistoryStats {
  return {
    total: 0,
    ouverts: 0,
    resolus: 0,
    tauxResolution: 0,
    critiquesOuverts: 0,
    highOuverts: 0,
    mttrHeures: null,
  };
}

/**
 * Service avec React.cache() pour éviter les appels redondants
 */
export const getBugHistoryStats = cache(getBugHistoryStatsInternal);
