/**
 * Service de statistiques historiques pour les tickets BUG
 * 
 * @description
 * Fournit des statistiques temps réel (non filtrées par période) 
 * pour la section KPIs Statiques du dashboard.
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

  // Construction de la requête de base
  let query = supabase
    .from('tickets')
    .select('id, status, priority, created_at, resolved_at')
    .eq('ticket_type', 'BUG');

  // Filtre par produit si spécifié
  if (productId) {
    query = query.eq('product_id', productId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[getBugHistoryStats] Erreur Supabase:', error);
    return getEmptyStats();
  }

  if (!data || data.length === 0) {
    return getEmptyStats();
  }

  // Calculs des statistiques
  const total = data.length;
  const resolus = data.filter(t => RESOLVED_STATUSES.includes(t.status)).length;
  const ouverts = total - resolus;
  const tauxResolution = total > 0 ? Math.round((resolus / total) * 100) : 0;

  // Comptage par priorité (ouverts uniquement)
  const ouvertsData = data.filter(t => !RESOLVED_STATUSES.includes(t.status));
  const critiquesOuverts = ouvertsData.filter(t => t.priority === 'Critical').length;
  const highOuverts = ouvertsData.filter(t => t.priority === 'High').length;

  // Calcul MTTR (Mean Time To Resolution)
  const mttrHeures = calculateMTTR(data);

  return {
    total,
    ouverts,
    resolus,
    tauxResolution,
    critiquesOuverts,
    highOuverts,
    mttrHeures,
  };
}

/**
 * Calcule le MTTR moyen en heures
 */
function calculateMTTR(
  tickets: Array<{ created_at: string | null; resolved_at: string | null; status: string }>
): number | null {
  const resolvedTickets = tickets.filter(
    t => t.resolved_at && t.created_at && RESOLVED_STATUSES.includes(t.status)
  );

  if (resolvedTickets.length === 0) return null;

  const totalHours = resolvedTickets.reduce((acc, ticket) => {
    const created = new Date(ticket.created_at!);
    const resolved = new Date(ticket.resolved_at!);
    const hours = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60);
    return acc + hours;
  }, 0);

  return Math.round(totalHours / resolvedTickets.length);
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


