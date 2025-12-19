'use client';

import { useSearchParams } from 'next/navigation';
import { useRef, useMemo } from 'react';

/**
 * Hook pour stabiliser useSearchParams et éviter les re-renders inutiles
 * 
 * OPTIMISÉ : Utilise useMemo pour éviter de créer un array à chaque render.
 * Compare uniquement le string résultant pour déterminer si les params ont changé.
 * 
 * @returns Objet stable avec les méthodes de searchParams
 */
export function useStableSearchParams() {
  const searchParams = useSearchParams();
  const stableParamsRef = useRef<ReturnType<typeof useSearchParams>>(searchParams);
  
  // OPTIMISÉ : Utiliser useMemo pour éviter de recréer le string à chaque render
  // Comparer uniquement le string final, pas les arrays intermédiaires
  const paramsString = useMemo(() => {
    const params: string[] = [];
    searchParams.forEach((value, key) => {
      params.push(`${key}=${value}`);
    });
    return params.sort().join('&');
  }, [searchParams]);
  
  const prevParamsStringRef = useRef<string | null>(null);
  
  // Mettre à jour la référence seulement si les paramètres ont réellement changé
  if (prevParamsStringRef.current !== paramsString) {
    prevParamsStringRef.current = paramsString;
    stableParamsRef.current = searchParams;
  }
  
  // Retourner toujours la référence stable (ne change que si paramsString change)
  return stableParamsRef.current;
}

