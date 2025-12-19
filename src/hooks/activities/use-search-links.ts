/**
 * Hook personnalisé pour la recherche d'entités liables aux activités
 * 
 * Utilise useDeferredValue (React 18+) pour une recherche non-bloquante
 * Gère AbortController pour annuler les requêtes précédentes
 * 
 * Pattern recommandé par React pour les recherches dynamiques
 */

'use client';

import { useState, useEffect, useDeferredValue, useRef } from 'react';
import type { LinkableEntity, LinkableEntityType } from '@/types/activity-links';

type UseSearchLinksResult = {
  results: LinkableEntity[];
  isSearching: boolean;
  error: string | null;
};

/**
 * Hook pour rechercher des entités liables avec lazy loading
 * 
 * @param entityType - Type d'entité à rechercher
 * @param searchKey - Clé de recherche (sera deferrée avec useDeferredValue)
 * @returns État de la recherche (résultats, chargement, erreur)
 * 
 * @example
 * const { results, isSearching } = useSearchLinks('bug', 'PROJ-123');
 */
export function useSearchLinks(
  entityType: LinkableEntityType | null,
  searchKey: string
): UseSearchLinksResult {
  const [results, setResults] = useState<LinkableEntity[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Utiliser useDeferredValue pour deferrer la recherche (pattern React recommandé)
  const deferredSearchKey = useDeferredValue(searchKey);
  
  // Ref pour l'AbortController pour annuler les requêtes précédentes
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Nettoyer la requête précédente si elle existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Si pas de type sélectionné ou clé trop courte, ne pas rechercher
    if (!entityType || !deferredSearchKey || deferredSearchKey.trim().length < 2) {
      setResults([]);
      setIsSearching(false);
      setError(null);
      return;
    }

    // Créer un nouveau AbortController pour cette requête
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Fonction de recherche
    const performSearch = async () => {
      setIsSearching(true);
      setError(null);

      try {
        const response = await fetch('/api/activities/search-links', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            entityType,
            searchKey: deferredSearchKey.trim(),
            limit: 10
          }),
          signal: abortController.signal
        });

        // Vérifier si la requête a été annulée
        if (abortController.signal.aborted) {
          return;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `Erreur ${response.status}`);
        }

        const data = await response.json();

        // Vérifier à nouveau si annulée après le fetch
        if (abortController.signal.aborted) {
          return;
        }

        setResults(data.entities || []);
        setError(null);
      } catch (err) {
        // Ignorer les erreurs d'annulation (AbortError)
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }

        // Ne pas mettre à jour l'état si la requête a été annulée
        if (!abortController.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Erreur lors de la recherche');
          setResults([]);
        }
      } finally {
        // Ne pas mettre à jour isSearching si la requête a été annulée
        if (!abortController.signal.aborted) {
          setIsSearching(false);
        }
      }
    };

    performSearch();

    // Cleanup : annuler la requête si le composant est démonté ou les dépendances changent
    return () => {
      abortController.abort();
    };
  }, [entityType, deferredSearchKey]);

  return {
    results,
    isSearching,
    error
  };
}
