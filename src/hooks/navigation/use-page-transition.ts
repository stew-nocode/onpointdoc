/**
 * Hook pour gérer les transitions de page
 * 
 * Détecte les changements de route et gère l'état de transition.
 * Utilise usePathname pour détecter les changements de route.
 * 
 * @returns État de transition (isTransitioning) et fonction pour forcer la fin
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';

type UsePageTransitionOptions = {
  /**
   * Durée de la transition en millisecondes
   * @default 300
   */
  duration?: number;

  /**
   * Délai avant de considérer la transition comme terminée
   * Permet d'attendre que la nouvelle page soit chargée
   * @default 100
   */
  completionDelay?: number;
};

type UsePageTransitionReturn = {
  /**
   * Indique si une transition est en cours
   */
  isTransitioning: boolean;

  /**
   * Force la fin de la transition (utile pour les cas d'erreur)
   */
  completeTransition: () => void;
};

/**
 * Hook pour gérer les transitions de page
 * 
 * @param options - Options de configuration
 * @returns État de transition et fonction de complétion
 * 
 * @example
 * const { isTransitioning, completeTransition } = usePageTransition();
 */
export function usePageTransition(
  options: UsePageTransitionOptions = {}
): UsePageTransitionReturn {
  const { duration = 300, completionDelay = 100 } = options;
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const previousPathnameRef = useRef<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Force la fin de la transition
   */
  const completeTransition = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsTransitioning(false);
  };

  useEffect(() => {
    // Ignorer le premier rendu (pas de transition au montage initial)
    if (previousPathnameRef.current === null) {
      previousPathnameRef.current = pathname;
      return;
    }

    // Si le pathname n'a pas changé, ne pas déclencher de transition
    if (previousPathnameRef.current === pathname) {
      return;
    }

    // Nettoyer le timeout précédent si présent
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Démarrer la transition
    setIsTransitioning(true);

    // Mettre à jour la référence du pathname précédent
    previousPathnameRef.current = pathname;

    // Terminer la transition après le délai de complétion
    timeoutRef.current = setTimeout(() => {
      setIsTransitioning(false);
      timeoutRef.current = null;
    }, duration + completionDelay);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [pathname, duration, completionDelay]);

  return {
    isTransitioning,
    completeTransition,
  };
}

