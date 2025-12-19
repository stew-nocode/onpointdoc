/**
 * Service de statistiques historiques pour les tickets ASSISTANCE
 * 
 * @description
 * Fournit des statistiques temps réel (non filtrées par période) 
 * pour la section KPIs Statiques du dashboard.
 * 
 * Utilise des requêtes de count pour contourner la limite de 1000 lignes de Supabase.
 * 
 * Structure des statuts ASSISTANCE :
 * - Nouveau, En_cours → "Ouvertes" (en attente de traitement)
 * - Resolue → "Résolues" (traitement direct Support)
 * - Transfere → "Transférées" (escalade vers IT/JIRA)
 * 
 * @see docs/dashboard/REFONTE-DASHBOARD-SPECIFICATION.md - Section 3.1
 */
import { cache } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Type des statistiques ASSISTANCE
 */
export type AssistanceHistoryStats = {
  /** Nombre total d'assistances */
  total: number;
  /** Assistances ouvertes (Nouveau + En_cours) */
  ouvertes: number;
  /** Assistances résolues directement par le Support */
  resolues: number;
  /** Assistances transférées vers IT (escalade JIRA) */
  transferees: number;
  /** Taux de résolution directe (%) */
  tauxResolutionDirecte: number;
  /** Taux de transfert IT (%) */
  tauxTransfert: number;
};

/**
 * Statuts considérés comme "Ouvertes" (en attente de traitement)
 */
const OPEN_STATUSES = ['Nouveau', 'En_cours'];

/**
 * Statuts considérés comme "Résolues" (traitement direct Support)
 */
const RESOLVED_STATUSES = ['Resolue'];

/**
 * Statuts considérés comme "Transférées" (escalade IT/JIRA)
 */
const TRANSFERRED_STATUSES = ['Transfere'];

/**
 * Récupère les statistiques historiques des ASSISTANCE (temps réel)
 * 
 * @param productId - ID du produit pour filtrer (optionnel)
 * @returns Statistiques ASSISTANCE ou null en cas d'erreur
 */
export const getAssistanceHistoryStats = cache(
  async (productId?: string): Promise<AssistanceHistoryStats | null> => {
    const supabase = await createSupabaseServerClient();

    try {
      // === 1. Compter le total ===
      let totalQuery = supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('ticket_type', 'ASSISTANCE');
      
      if (productId) {
        totalQuery = totalQuery.eq('product_id', productId);
      }
      
      const { count: total, error: totalError } = await totalQuery;

      if (totalError) {
        console.error('[getAssistanceHistoryStats] Error counting total:', totalError);
        return null;
      }

      // === 2. Compter les ouvertes (Nouveau + En_cours) ===
      let ouvertesQuery = supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('ticket_type', 'ASSISTANCE')
        .in('status', OPEN_STATUSES);
      
      if (productId) {
        ouvertesQuery = ouvertesQuery.eq('product_id', productId);
      }
      
      const { count: ouvertes, error: ouvertesError } = await ouvertesQuery;

      if (ouvertesError) {
        console.error('[getAssistanceHistoryStats] Error counting ouvertes:', ouvertesError);
        return null;
      }

      // === 3. Compter les résolues directement ===
      let resoluesQuery = supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('ticket_type', 'ASSISTANCE')
        .in('status', RESOLVED_STATUSES);
      
      if (productId) {
        resoluesQuery = resoluesQuery.eq('product_id', productId);
      }
      
      const { count: resolues, error: resoluesError } = await resoluesQuery;

      if (resoluesError) {
        console.error('[getAssistanceHistoryStats] Error counting resolues:', resoluesError);
        return null;
      }

      // === 4. Compter les transférées ===
      let transfereesQuery = supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('ticket_type', 'ASSISTANCE')
        .in('status', TRANSFERRED_STATUSES);
      
      if (productId) {
        transfereesQuery = transfereesQuery.eq('product_id', productId);
      }
      
      const { count: transferees, error: transfereesError } = await transfereesQuery;

      if (transfereesError) {
        console.error('[getAssistanceHistoryStats] Error counting transferees:', transfereesError);
        return null;
      }

      // === 5. Calculer les métriques ===
      const totalCount = total ?? 0;
      const ouvertesCount = ouvertes ?? 0;
      const resoluesCount = resolues ?? 0;
      const transfereesCount = transferees ?? 0;
      
      // Taux de résolution directe (résolues / total traité)
      const totalTraitees = resoluesCount + transfereesCount;
      const tauxResolutionDirecte = totalTraitees > 0 
        ? Math.round((resoluesCount / totalTraitees) * 100) 
        : 0;
      
      // Taux de transfert IT
      const tauxTransfert = totalTraitees > 0 
        ? Math.round((transfereesCount / totalTraitees) * 100) 
        : 0;

      console.log(`[getAssistanceHistoryStats] Stats: total=${totalCount}, ouvertes=${ouvertesCount}, resolues=${resoluesCount}, transferees=${transfereesCount}`);

      return {
        total: totalCount,
        ouvertes: ouvertesCount,
        resolues: resoluesCount,
        transferees: transfereesCount,
        tauxResolutionDirecte,
        tauxTransfert,
      };
    } catch (error) {
      console.error('[getAssistanceHistoryStats] Unexpected error:', error);
      return null;
    }
  }
);






