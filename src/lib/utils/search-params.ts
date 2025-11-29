import { cache } from 'react';

/**
 * Type pour les searchParams stabilisés
 * 
 * Utilisé pour créer un objet immuable à partir des searchParams
 * qui peut être comparé de manière stable.
 */
export type StabilizedSearchParams = Record<string, string>;

/**
 * Fonction cache pour résoudre les searchParams
 * 
 * Principe Clean Code - Niveau Senior :
 * - Utilise React cache() pour mémoriser la résolution des searchParams
 * - Évite les recompilations inutiles du Server Component
 * - Fonction stable (pas recréée à chaque render)
 * - Type-safe avec génériques
 * 
 * Cette fonction mémorise la résolution des searchParams Promise
 * pour éviter de résoudre plusieurs fois les mêmes params dans
 * le même render tree (même si Next.js les passe en Promise).
 * 
 * @param searchParams - Les searchParams à résoudre (Promise ou objet direct)
 * @returns Les searchParams résolus
 * 
 * @example
 * ```tsx
 * const resolved = await getCachedSearchParams(searchParams);
 * ```
 */
export const getCachedSearchParams = cache(
  async <T extends Record<string, string | string[] | undefined>>(
    searchParams: Promise<T> | T
  ): Promise<T> => {
    return await searchParams;
  }
);

/**
 * Stabilise les searchParams en créant un objet immuable
 * 
 * Principe Clean Code - Niveau Senior :
 * - SRP : Une seule responsabilité (normaliser les searchParams)
 * - Fonction pure (pas d'effets de bord)
 * - Type-safe (retourne un type explicite)
 * - Gère les Promises (Next.js 15+) et les objets directs
 * - Normalise les arrays (prend la première valeur selon conventions REST)
 * 
 * Cette fonction normalise les searchParams pour :
 * - Résoudre les Promises si nécessaire (Next.js 15+)
 * - Convertir les arrays en strings (convention REST)
 * - Filtrer les valeurs undefined/null
 * - Créer un objet stable et immuable
 * 
 * @param searchParams - Les searchParams à stabiliser (peut être une Promise en Next.js 15+)
 * @returns Un objet Record<string, string> immuable et normalisé
 * 
 * @example
 * ```tsx
 * const stabilized = await stabilizeSearchParams(searchParams);
 * // { type: "BUG", status: "Open", search: "test" }
 * ```
 */
export async function stabilizeSearchParams(
  searchParams: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>
): Promise<StabilizedSearchParams> {
  // Résoudre la Promise si nécessaire (Next.js 15+)
  const resolved = await searchParams;
  
  const stabilized: StabilizedSearchParams = {};
  
  // Parcourir toutes les clés et normaliser les valeurs
  for (const [key, value] of Object.entries(resolved)) {
    if (value === undefined || value === null) {
      continue;
    }
    
    // Normaliser les arrays en strings (prendre la première valeur)
    // En suivant les conventions REST, on utilise la première valeur pour les query params multiples
    const normalizedValue = Array.isArray(value) ? value[0] : value;
    
    if (normalizedValue && normalizedValue !== '') {
      stabilized[key] = String(normalizedValue);
    }
  }
  
  return stabilized;
}

/**
 * Crée une clé de cache stable à partir des searchParams
 * 
 * Principe Clean Code - Niveau Senior :
 * - Fonction pure (pas d'effets de bord)
 * - Déterministe (même entrée = même sortie)
 * - Utilisée pour créer des clés de cache cohérentes
 * - Gère l'encodage URL correctement
 * - Trie les clés pour garantir l'ordre (déterministe)
 * 
 * Cette fonction crée une clé de cache déterministe en :
 * - Triant les clés alphabétiquement
 * - Filtrant les valeurs vides
 * - Encodant correctement les valeurs URL
 * - Créant une string stable et reproductible
 * 
 * @param params - Les searchParams stabilisés
 * @returns Une clé de cache (string) qui peut être utilisée pour le caching
 * 
 * @example
 * ```tsx
 * const key = createSearchParamsCacheKey(stabilized);
 * // "search=test&status=Open&type=BUG"
 * ```
 */
export function createSearchParamsCacheKey(
  params: StabilizedSearchParams
): string {
  // Créer un array de paires clé=valeur triées pour garantir l'ordre
  const entries = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== '' && value !== null)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB, 'en', { numeric: true, sensitivity: 'base' }));
  
  // Convertir en string pour utilisation comme clé de cache
  return entries
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}

/**
 * Compare deux objets de searchParams stabilisés pour déterminer s'ils sont identiques
 * 
 * Principe Clean Code - Niveau Senior :
 * - Fonction pure (pas d'effets de bord)
 * - Comparaison profonde (tous les champs)
 * - Type-safe
 * - Optimisée (retourne false rapidement si différentes longueurs)
 * - Compare les clés ET les valeurs
 * 
 * Cette fonction compare deux objets de searchParams en :
 * - Vérifiant d'abord le nombre de clés (optimisation)
 * - Comparant chaque clé et valeur
 * - Retournant false dès la première différence
 * 
 * @param params1 - Premiers searchParams
 * @param params2 - Seconds searchParams
 * @returns true si les params sont identiques, false sinon
 * 
 * @example
 * ```tsx
 * const areEqual = areSearchParamsEqual(params1, params2);
 * ```
 */
export function areSearchParamsEqual(
  params1: StabilizedSearchParams,
  params2: StabilizedSearchParams
): boolean {
  const keys1 = Object.keys(params1).sort();
  const keys2 = Object.keys(params2).sort();
  
  // Vérifier si le nombre de clés est identique (optimisation rapide)
  if (keys1.length !== keys2.length) {
    return false;
  }
  
  // Vérifier chaque clé et valeur
  for (let i = 0; i < keys1.length; i++) {
    const key = keys1[i];
    if (key !== keys2[i] || params1[key] !== params2[key]) {
      return false;
    }
  }
  
  return true;
}
