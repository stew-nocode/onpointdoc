import { cache } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Statistiques d'historique pour les tickets REQ
 */
export type ReqHistoryStats = {
  /** Nombre total de requêtes */
  total: number;
  /** Requêtes en cours de développement */
  enCours: number;
  /** Requêtes implémentées/terminées */
  implementees: number;
  /** Taux d'implémentation (%) */
  tauxImplementation: number;
};

/**
 * Statuts considérés comme "En cours" pour les REQ
 * (en développement, en validation, etc.)
 */
const IN_PROGRESS_STATUSES = [
  'In Progress',
  'En cours',
  'En développement',
  'Development',
  'In Review',
  'En validation',
  'Testing',
  'En test',
];

/**
 * Statuts considérés comme "Implémentées" pour les REQ
 * (terminées, livrées, deployed, etc.)
 */
const IMPLEMENTED_STATUSES = [
  'Done',
  'Terminé(e)',
  'Closed',
  'Resolved',
  'Resolue',
  'Implemented',
  'Implémentée',
  'Deployed',
  'Live',
  'Released',
];

/**
 * Service - Récupération des statistiques d'historique des REQ
 *
 * Utilise des requêtes de count pour contourner la limite de 1000 lignes de Supabase.
 *
 * @param productId - ID du produit (ex: OBC)
 * @returns Statistiques REQ ou null si erreur
 *
 * @see docs/dashboard/REFONTE-DASHBOARD-SPECIFICATION.md - Section 3.1
 */
export const getReqHistoryStats = cache(
  async (productId: string): Promise<ReqHistoryStats | null> => {
    const supabase = await createSupabaseServerClient();

    // Requête 1: Count total des REQ
    const { count: total, error: totalError } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('ticket_type', 'REQ')
      .eq('product_id', productId);

    if (totalError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[getReqHistoryStats] Error fetching total count:', totalError);
      }
      return null;
    }

    // Requête 2: Count des REQ "En cours"
    const { count: enCours, error: enCoursError } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('ticket_type', 'REQ')
      .eq('product_id', productId)
      .in('status', IN_PROGRESS_STATUSES);

    if (enCoursError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[getReqHistoryStats] Error fetching en cours count:', enCoursError);
      }
      return null;
    }

    // Requête 3: Count des REQ "Implémentées"
    const { count: implementees, error: implementeesError } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('ticket_type', 'REQ')
      .eq('product_id', productId)
      .in('status', IMPLEMENTED_STATUSES);

    if (implementeesError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[getReqHistoryStats] Error fetching implementees count:', implementeesError);
      }
      return null;
    }

    const totalCount = total ?? 0;
    const enCoursCount = enCours ?? 0;
    const implementeesCount = implementees ?? 0;

    console.log(`[getReqHistoryStats] REQ stats: total=${totalCount}, enCours=${enCoursCount}, implementees=${implementeesCount}`);

    const tauxImplementation = totalCount > 0 ? Math.round((implementeesCount / totalCount) * 100) : 0;

    return {
      total: totalCount,
      enCours: enCoursCount,
      implementees: implementeesCount,
      tauxImplementation,
    };
  }
);
