'use client';

/**
 * Hook pour gérer le chargement infini des campagnes email
 * 
 * Principe Clean Code - Niveau Senior :
 * - SRP : Une seule responsabilité (chargement paginé des campagnes)
 * - Gestion complète de l'état (campaigns, hasMore, isLoading, error)
 * - Logique de retry pour les erreurs réseau
 * - Fusion intelligente des campagnes (évite les doublons)
 * - Réinitialisation automatique lors des changements de filtres
 * 
 * Pattern similaire à useTasksInfiniteLoad et useActivitiesInfiniteLoad pour cohérence
 */

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { flushSync } from 'react-dom';
import type { ReadonlyURLSearchParams } from 'next/navigation';
import type { BrevoEmailCampaign } from '@/types/brevo';
import type { CampaignQuickFilter } from '@/types/campaign-filters';
import type { CampaignSortColumn, SortDirection, CampaignSort } from '@/types/campaign-sort';
import { parseCampaignSort } from '@/types/campaign-sort';
import { useRetryFetch } from '@/hooks/use-retry-fetch';

const ITEMS_PER_PAGE = 25;

type UseCampaignsInfiniteLoadProps = {
  /**
   * Campagnes initiales chargées par le Server Component
   */
  initialCampaigns: BrevoEmailCampaign[];

  /**
   * Indique s'il reste des campagnes à charger
   */
  initialHasMore: boolean;

  /**
   * Filtres pour le chargement
   */
  search?: string;
  quickFilter?: CampaignQuickFilter;

  /**
   * SearchParams de l'URL (stabilisés)
   */
  searchParams: ReadonlyURLSearchParams;
};

type UseCampaignsInfiniteLoadReturn = {
  /**
   * Liste des campagnes chargées
   */
  campaigns: BrevoEmailCampaign[];

  /**
   * Indique s'il reste des campagnes à charger
   */
  hasMore: boolean;

  /**
   * Indique si un chargement est en cours
   */
  isLoading: boolean;

  /**
   * Message d'erreur si un chargement a échoué
   */
  error: string | null;

  /**
   * Fonction pour charger plus de campagnes
   */
  loadMore: () => Promise<void>;

  /**
   * Clé de filtrage pour détecter les changements de filtres
   */
  filterKey: string;
};

/**
 * Fusionne deux tableaux de campagnes sans doublons
 * 
 * @param existing - Campagnes existantes
 * @param newItems - Nouvelles campagnes à fusionner
 * @returns Tableau fusionné sans doublons
 */
function mergeCampaignsWithoutDuplicates(
  existing: BrevoEmailCampaign[],
  newItems: BrevoEmailCampaign[]
): BrevoEmailCampaign[] {
  const existingIds = new Set(existing.map((c) => c.id));
  const uniqueNewItems = newItems.filter((c) => !existingIds.has(c.id));
  return [...existing, ...uniqueNewItems];
}

/**
 * Construit les paramètres de requête pour charger des campagnes
 * 
 * @param offset - Décalage pour la pagination
 * @param limit - Nombre d'éléments par page
 * @param search - Terme de recherche
 * @param quickFilter - Filtre rapide
 * @param sort - Tri (column et direction)
 * @param searchParams - SearchParams de l'URL
 * @returns URLSearchParams pour la requête
 */
function buildCampaignListParams(
  offset: number,
  limit: number,
  search?: string,
  quickFilter?: CampaignQuickFilter,
  sort?: CampaignSort,
  searchParams?: ReadonlyURLSearchParams
): URLSearchParams {
  const params = new URLSearchParams(searchParams?.toString() || '');
  
  params.set('offset', offset.toString());
  params.set('limit', limit.toString());
  
  if (search && search.trim().length > 0) {
    params.set('search', search.trim());
  } else {
    params.delete('search');
  }
  
  if (quickFilter) {
    params.set('quick', quickFilter);
  } else {
    params.delete('quick');
  }
  
  if (sort?.column) {
    params.set('sort', `${sort.column}:${sort.direction}`);
  }
  
  return params;
}

/**
 * Hook pour gérer le chargement infini des campagnes
 * 
 * @param props - Propriétés du hook
 * @returns État et fonctions pour gérer le chargement infini
 */
export function useCampaignsInfiniteLoad({
  initialCampaigns,
  initialHasMore,
  search,
  quickFilter,
  searchParams
}: UseCampaignsInfiniteLoadProps): UseCampaignsInfiniteLoadReturn {
  // Extraire le tri depuis l'URL
  const sortParam = searchParams.get('sort');
  const sort = useMemo(() => {
    return parseCampaignSort(sortParam || undefined);
  }, [sortParam]);

  // Créer une clé de filtrage pour détecter les changements
  const filterKey = useMemo(() => {
    return `${search || ''}-${quickFilter || 'all'}-${sort.column}-${sort.direction}`;
  }, [search, quickFilter, sort.column, sort.direction]);

  // État local pour les campagnes
  const [campaigns, setCampaigns] = useState<BrevoEmailCampaign[]>(initialCampaigns);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Référence pour suivre l'offset actuel
  const currentOffsetRef = useRef(initialCampaigns.length);
  const previousFilterKeyRef = useRef(filterKey);

  // Hook pour retry en cas d'erreur
  const { fetchWithRetry } = useRetryFetch();

  // Réinitialiser les campagnes si les filtres changent
  useEffect(() => {
    if (previousFilterKeyRef.current !== filterKey) {
      // Les filtres ont changé, réinitialiser l'état
      flushSync(() => {
        setCampaigns(initialCampaigns);
        setHasMore(initialHasMore);
        setError(null);
        currentOffsetRef.current = initialCampaigns.length;
      });
      previousFilterKeyRef.current = filterKey;
    }
  }, [filterKey, initialCampaigns, initialHasMore]);

  /**
   * Charge plus de campagnes depuis l'API
   */
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = buildCampaignListParams(
        currentOffsetRef.current,
        ITEMS_PER_PAGE,
        search,
        quickFilter,
        sort,
        searchParams
      );

      const response = await fetchWithRetry(`/api/campaigns/list?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
        throw new Error(errorData.error || `Erreur ${response.status}`);
      }

      const data = await response.json();

      // Fusionner les nouvelles campagnes avec les existantes (sans doublons)
      flushSync(() => {
        setCampaigns((prev) => mergeCampaignsWithoutDuplicates(prev, data.campaigns || []));
        setHasMore(data.hasMore ?? false);
        currentOffsetRef.current += (data.campaigns || []).length;
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des campagnes';
      setError(errorMessage);
      console.error('[useCampaignsInfiniteLoad] Erreur lors du chargement:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, search, quickFilter, sort, searchParams, fetchWithRetry]);

  return {
    campaigns,
    hasMore,
    isLoading,
    error,
    loadMore,
    filterKey
  };
}

