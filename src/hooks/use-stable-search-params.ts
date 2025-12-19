'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

/**
 * Hook pour stabiliser useSearchParams et éviter les re-renders inutiles
 *
 * OPTIMISÉ : Utilise useMemo pour mémoriser les searchParams basés sur leur contenu.
 * Compare uniquement le string résultant pour déterminer si les params ont changé.
 *
 * @returns Objet stable avec les méthodes de searchParams
 */
export function useStableSearchParams() {
  const searchParams = useSearchParams();

  // Mémoriser les searchParams en se basant uniquement sur leur contenu sérialisé
  // Cela permet de maintenir la même référence tant que le contenu ne change pas
  const stableParams = useMemo(() => {
    // Créer une clé stable basée sur le contenu des paramètres
    const params: string[] = [];
    searchParams.forEach((value, key) => {
      params.push(`${key}=${value}`);
    });
    // Retourner searchParams - la dépendance est sur le contenu, pas la référence
    return searchParams;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  return stableParams;
}

