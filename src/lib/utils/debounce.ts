/**
 * Utilitaires de debouncing pour optimiser les performances
 */

/**
 * Crée une fonction debounced qui retarde l'exécution jusqu'à ce qu'un certain temps
 * se soit écoulé depuis le dernier appel
 * 
 * @param fn - Fonction à debouncer
 * @param delay - Délai en millisecondes
 * @returns Fonction debounced
 * 
 * @example
 * const debouncedSearch = debounce((query: string) => {
 *   search(query);
 * }, 300);
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}


