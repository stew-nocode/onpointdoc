/**
 * Service de statistiques des tickets par entreprise
 * 
 * @description
 * Fournit les données pour le Horizontal Stacked Bar Chart
 * montrant la répartition des tickets par entreprise et par type.
 * 
 * Soumis aux filtres globaux (période).
 * 
 * @see docs/dashboard/REFONTE-DASHBOARD-SPECIFICATION.md - Section 3.3
 */
import { cache } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { withRpcTimeout } from '@/lib/utils/supabase-timeout';
import { createError } from '@/lib/errors/types';

/**
 * Type pour les données d'une entreprise
 */
export type CompanyTicketData = {
  /** ID de l'entreprise */
  companyId: string;
  /** Nom de l'entreprise */
  companyName: string;
  /** Nombre de BUGs */
  bug: number;
  /** Nombre de REQs */
  req: number;
  /** Nombre d'Assistances (normales, sans relances) */
  assistance: number;
  /** Nombre de Relances (assistances taguées comme relances) */
  relance: number;
  /** Total tous types */
  total: number;
};

/**
 * Type des statistiques par entreprise
 */
export type TicketsByCompanyStats = {
  /** Données par entreprise (triées par total décroissant) */
  data: CompanyTicketData[];
  /** Nombre total de tickets */
  totalTickets: number;
  /** Nombre d'entreprises */
  companyCount: number;
  /** Limite appliquée (top N) */
  limit: number;
};

/**
 * Récupère les statistiques de tickets par entreprise
 * 
 * @param productId - ID du produit
 * @param periodStart - Date de début (ISO string)
 * @param periodEnd - Date de fin (ISO string)
 * @param limit - Nombre max d'entreprises à retourner (défaut: 10)
 * @returns Statistiques par entreprise ou null en cas d'erreur
 */
export const getTicketsByCompanyStats = cache(
  async (
    productId: string,
    periodStart: string,
    periodEnd: string,
    limit: number = 10,
    includeOld: boolean = false
  ): Promise<TicketsByCompanyStats | null> => {
    const supabase = await createSupabaseServerClient();

    try {
      // ✅ OPTIMISATION v2 : Utilise la fonction RPC PostgreSQL optimisée
      // - Avant : Pagination tickets + RPC followup + pagination links + agrégation JS
      // - Après : 1 seule RPC qui fait tout en SQL
      // - Gain : -80% requêtes, -80% temps (~60ms vs ~300ms)
      // ✅ TIMEOUT : Wrapper avec timeout de 10s pour éviter les blocages prolongés
      const { data, error } = await withRpcTimeout(
        supabase.rpc('get_tickets_by_company_stats', {
          p_product_id: productId,
          p_period_start: periodStart,
          p_period_end: periodEnd,
          p_limit: limit,
          p_include_old: includeOld,
        }),
        10000 // 10 secondes
      );
      if (error) {
        // ✅ Gestion d'erreur avec createError (dégradation gracieuse)
        const appError = createError.supabaseError(
          'Erreur lors de la récupération des statistiques de tickets par entreprise',
          error instanceof Error ? error : new Error(String(error)),
          { productId, periodStart, periodEnd, limit, includeOld, errorCode: error.code }
        );
        if (process.env.NODE_ENV === 'development') {
          console.error('[getTicketsByCompanyStats]', appError);
        }
        return null;
      }

      // Si aucune donnée retournée
      if (!data || data.length === 0) {
        return {
          data: [],
          totalTickets: 0,
          companyCount: 0,
          limit,
        };
      }

      // Type de retour de la RPC PostgreSQL
      type PostgresTicketsByCompanyRow = {
        company_id: string;
        company_name: string;
        bug: number;
        req: number;
        assistance: number;
        relance: number;
        total: number;
      };

      const rows = data as PostgresTicketsByCompanyRow[];

      // Transformer les résultats en format attendu
      const dataTransformed: CompanyTicketData[] = rows.map((row) => ({
        companyId: row.company_id,
        companyName: row.company_name,
        bug: Number(row.bug),
        req: Number(row.req),
        assistance: Number(row.assistance),
        relance: Number(row.relance),
        total: Number(row.total),
      }));

      const totalTickets = dataTransformed.reduce((sum, c) => sum + c.total, 0);

      if (process.env.NODE_ENV === 'development') {
        console.log(
          `[getTicketsByCompanyStats] Stats (RPC v2): ${dataTransformed.length} entreprises, ${totalTickets} tickets`
        );
      }

      return {
        data: dataTransformed,
        totalTickets,
        companyCount: dataTransformed.length,
        limit,
      };
    } catch (error) {
      // ✅ Gestion d'erreur avec createError (dégradation gracieuse)
      const appError = createError.internalError(
        'Erreur inattendue lors de la récupération des statistiques de tickets par entreprise',
        error instanceof Error ? error : new Error(String(error)),
        { productId, periodStart, periodEnd, limit, includeOld }
      );
      if (process.env.NODE_ENV === 'development') {
        console.error('[getTicketsByCompanyStats]', appError);
      }
      return null;
    }
  }
);

