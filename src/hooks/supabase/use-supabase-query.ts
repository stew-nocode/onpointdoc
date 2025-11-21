/**
 * Hook personnalisé générique pour effectuer des requêtes Supabase
 * 
 * Extrait la logique de requêtes répétée des composants pour une meilleure réutilisabilité
 */

'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
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

  const [state, setState] = useState<UseSupabaseQueryResult<T>>({
    data: null,
    error: null,
    isLoading: true,
    refetch: async () => {} // Placeholder initial
  });

  // Utiliser useRef pour stocker les dépendances précédentes et éviter les re-renders inutiles
  const prevDepsRef = useRef<string>('');

  const executeQuery = useCallback(async () => {
    if (!enabled) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const supabase = createSupabaseBrowserClient();

      // Utiliser queryFn personnalisée si fournie
      if (queryFn) {
        const { data, error } = await queryFn(supabase);
        if (error) {
          throw new Error(error.message || 'Erreur Supabase');
        }
        setState(prev => ({ ...prev, data: data as T, error: null, isLoading: false }));
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

      setState(prev => ({ ...prev, data: data as T, error: null, isLoading: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        data: null,
        error: error instanceof Error ? error : new Error('Erreur inconnue'),
        isLoading: false
      }));
    }
  }, [enabled, table, select, queryFn, filters, orderBy, limit]);

  useEffect(() => {
    // Créer une chaîne de dépendances pour comparaison
    const currentDepsString = JSON.stringify({
      enabled,
      table,
      select,
      filters,
      orderBy,
      limit
    });
    
    // Ne déclencher que si les dépendances ont réellement changé
    if (prevDepsRef.current === currentDepsString) {
      return;
    }
    prevDepsRef.current = currentDepsString;
    
    // Appeler executeQuery sans l'inclure dans les dépendances pour éviter les boucles infinies
    executeQuery();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, table, select, limit]);

  return {
    ...state,
    refetch: executeQuery
  };
}
