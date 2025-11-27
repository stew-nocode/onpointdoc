'use client';

import { useSearchParams } from 'next/navigation';
import { useRef, useMemo } from 'react';

/**
 * Hook pour stabiliser useSearchParams et éviter les re-renders inutiles
 * 
 * Compare les valeurs réelles des paramètres plutôt que la référence de l'objet
 * pour éviter les re-renders quand les paramètres n'ont pas changé.
 * 
 * @returns Objet stable avec les méthodes de searchParams
 */
export function useStableSearchParams() {
  const searchParams = useSearchParams();
  const prevParamsStringRef = useRef<string | null>(null);
  const stableParamsRef = useRef<ReturnType<typeof useSearchParams>>(searchParams);
  
  // Créer une chaîne de tous les paramètres pour comparaison (memoizé)
  const paramsString = useMemo(() => {
    const params: string[] = [];
    searchParams.forEach((value, key) => {
      params.push(`${key}=${value}`);
    });
    return params.sort().join('&');
  }, [searchParams]);
  
  // Mettre à jour la référence seulement si les paramètres ont réellement changé
  // Utiliser une comparaison synchrone pour éviter les re-renders
  if (prevParamsStringRef.current !== paramsString) {
    prevParamsStringRef.current = paramsString;
    stableParamsRef.current = searchParams;
  }
  
  // Retourner toujours la référence stable (ne change que si paramsString change)
  return stableParamsRef.current;
}

