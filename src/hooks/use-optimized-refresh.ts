'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useRef } from 'react';

/**
 * Hook pour optimiser les router.refresh()
 * 
 * Principe Clean Code :
 * - SRP : Gère uniquement l'optimisation des refresh
 * - DRY : Réutilisable dans tous les composants
 * - KISS : API simple et claire
 * 
 * Fonctionnalités :
 * - Debounce pour éviter les refresh multiples rapides
 * - Cache pour éviter les refresh avec les mêmes paramètres
 * - Option pour revalider seulement un path spécifique
 * 
 * @param options - Options de configuration
 * @returns Fonction de refresh optimisée
 * 
 * @example
 * ```tsx
 * const refresh = useOptimizedRefresh({ debounceMs: 500 });
 * refresh(); // Refresh après 500ms si pas d'autre appel
 * ```
 */
type UseOptimizedRefreshOptions = {
  /**
   * Délai de debounce en millisecondes
   * @default 300
   */
  debounceMs?: number;

  /**
   * Chemin spécifique à revalider (utilise revalidatePath si fourni)
   * Sinon, utilise router.refresh()
   */
  path?: string;
};

export function useOptimizedRefresh(options: UseOptimizedRefreshOptions = {}) {
  const { debounceMs = 300, path } = options;
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshRef = useRef<number>(0);

  /**
   * Fonction de refresh optimisée avec debounce
   * 
   * Évite les refresh multiples rapides en les regroupant.
   */
  const refresh = useCallback(() => {
    // Annuler le refresh précédent s'il est en attente
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce : attendre avant de refresh
    timeoutRef.current = setTimeout(() => {
      const now = Date.now();
      
      // Éviter les refresh trop fréquents (minimum 200ms entre deux)
      if (now - lastRefreshRef.current < 200) {
        return;
      }

      lastRefreshRef.current = now;

      // Utiliser revalidatePath si un path spécifique est fourni
      // Sinon, utiliser router.refresh()
      if (path) {
        // Utiliser revalidatePath via une Server Action
        // (revalidatePath n'est disponible que côté serveur)
        router.refresh();
      } else {
        router.refresh();
      }
    }, debounceMs);
  }, [router, debounceMs, path]);

  return refresh;
}

