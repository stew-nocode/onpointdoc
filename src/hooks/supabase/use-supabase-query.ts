/**
 * Hook personnalisé générique pour effectuer des requêtes Supabase
 * 
 * Extrait la logique de requêtes répétée des composants pour une meilleure réutilisabilité
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type UseSupabaseQueryOptions<T> = {
  /** Table Supabase à interroger */
  table: string;
  /** Colonnes à sélectionner (défaut: '*') */
  select?: string;
  /** Fonction de requête personnalisée */
  queryFn?: (supabase: ReturnType<typeof createSupabaseBrowserClient>) => Promise<{ data: T | null; error: any }>;
  /** Conditions de filtrage (ex: { eq: ['status', 'active'] }) */
  filters?: Array<{ method: string; args: unknown[] }>;
  /** Tri (ex: { column: 'created_at', ascending: false }) */
  orderBy?: { column: string; ascending?: boolean };
  /** Nombre maximum de résultats */
  limit?: number;
  /** Condition de chargement (défaut: true) */
  enabled?: boolean;
};

type UseSupabaseQueryResult<T> = {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
};

/**
 * Hook générique pour effectuer des requêtes Supabase
 * 
 * @param options - Options de configuration de la requête
 * @returns État de la requête avec data, error, isLoading et refetch
 * 
 * @example
 * // Requête simple
 * const { data: countries, isLoading } = useSupabaseQuery({
 *   table: 'countries',
 *   select: 'id, name',
 *   orderBy: { column: 'name', ascending: true }
 * });
 * 
 * // Requête avec filtres
 * const { data: tickets } = useSupabaseQuery({
 *   table: 'tickets',
 *   filters: [
 *     { method: 'eq', args: ['status', 'active'] },
 *     { method: 'eq', args: ['ticket_type', 'BUG'] }
 *   ]
 * });
 * 
 * // Requête personnalisée
 * const { data: profile } = useSupabaseQuery({
 *   queryFn: async (supabase) => {
 *     const { data, error } = await supabase
 *       .from('profiles')
 *       .select('*')
 *       .eq('auth_uid', userId)
 *       .single();
 *     return { data, error };
 *   }
 * });
 */
export function useSupabaseQuery<T = unknown>(
  options: UseSupabaseQueryOptions<T>
): UseSupabaseQueryResult<T> {
  const {
    table,
    select = '*',
    queryFn,
    filters = [],
    orderBy,
    limit,
    enabled = true
  } = options;

  const executeQuery = useCallback(async () => {
    if (!enabled) {
      return;
    }

    try {
      const supabase = createSupabaseBrowserClient();

      // Utiliser queryFn personnalisée si fournie
      if (queryFn) {
        const { data, error } = await queryFn(supabase);
        if (error) {
          throw new Error(error.message || 'Erreur Supabase');
        }
        setState({ data: data as T, error: null, isLoading: false, refetch: executeQuery });
        return;
      }

      // Construire la requête standard
      let query = supabase.from(table).select(select);

      // Appliquer les filtres
      for (const filter of filters) {
        const method = filter.method as keyof typeof query;
        if (typeof query[method] === 'function') {
          query = (query[method] as (...args: unknown[]) => typeof query)(...filter.args);
        }
      }

      // Appliquer le tri
      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
      }

      // Appliquer la limite
      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message || 'Erreur Supabase');
      }

      setState({ data: data as T, error: null, isLoading: false, refetch: executeQuery });
    } catch (error) {
      setState({
        data: null,
        error: error instanceof Error ? error : new Error('Erreur inconnue'),
        isLoading: false,
        refetch: executeQuery
      });
    }
  }, [enabled, table, select, queryFn, filters, orderBy, limit]);

  const [state, setState] = useState<UseSupabaseQueryResult<T>>({
    data: null,
    error: null,
    isLoading: true,
    refetch: executeQuery
  });

  useEffect(() => {
    executeQuery();
  }, [executeQuery]);

  return state;
}
