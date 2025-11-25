/**
 * Composant de transition de page amélioré
 * 
 * Orchestre la barre de progression, l'overlay et le fade du contenu.
 * Utilise le contexte de navigation pour détecter les transitions au clic.
 * 
 * Respecte les principes Clean Code :
 * - SRP : Orchestration de la transition complète
 * - DRY : Réutilisation des composants
 * - KISS : Solution simple et efficace
 */

'use client';

import { useEffect, useRef } from 'react';
import { useNavigation } from '@/contexts/navigation-context';
import { usePathname } from 'next/navigation';
import { PageTransitionBar } from './page-transition-bar';
import { cn } from '@/lib/utils';

type PageTransitionProps = {
  /**
   * Durée de la transition en millisecondes
   * @default 1200
   */
  duration?: number;

  /**
   * Délai avant de considérer la transition comme terminée
   * @default 300
   */
  completionDelay?: number;
};

/**
 * Composant de transition de page amélioré
 * 
 * Affiche une barre de progression, un overlay et gère le fade
 * lors des changements de route.
 * 
 * @param duration - Durée de la transition en ms (défaut: 1200ms)
 * @param completionDelay - Délai de complétion en ms (défaut: 300ms)
 * 
 * @example
 * <PageTransition />
 */
export function PageTransition({
  duration = 1200,
  completionDelay = 300,
}: PageTransitionProps) {
  const { isNavigating, completeNavigation } = useNavigation();
  const pathname = usePathname();

  /**
   * Compléter la transition quand le pathname change pendant une navigation
   * 
   * Attend un peu pour que la nouvelle page se charge complètement
   * avant de terminer la transition.
   */
  const previousPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    // Ignorer le premier rendu
    if (previousPathnameRef.current === null) {
      previousPathnameRef.current = pathname;
      return;
    }

    // Si on navigue et que le pathname a changé, terminer la transition
    if (isNavigating && previousPathnameRef.current !== pathname) {
      previousPathnameRef.current = pathname;

      // Attendre que la page soit chargée avant de terminer la transition
      const timer = setTimeout(() => {
        completeNavigation();
      }, completionDelay);

      return () => {
        clearTimeout(timer);
      };
    } else if (!isNavigating) {
      // Mettre à jour la référence même si on ne navigue pas
      previousPathnameRef.current = pathname;
    }
  }, [pathname, isNavigating, completeNavigation, completionDelay]);

  return (
    <>
      {/* Barre de progression */}
      <PageTransitionBar isTransitioning={isNavigating} duration={duration} />

      {/* Overlay avec fade pour effet de chargement */}
      <div
        className={cn(
          'fixed inset-0 z-[9998] bg-white/40 dark:bg-slate-950/40 backdrop-blur-sm transition-opacity duration-500 pointer-events-none',
          isNavigating ? 'opacity-100' : 'opacity-0'
        )}
        aria-hidden="true"
      />
    </>
  );
}

