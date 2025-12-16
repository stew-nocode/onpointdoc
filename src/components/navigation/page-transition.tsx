/**
 * Composant de transition de page avec LogoLoader
 *
 * Affiche une animation élégante du logo ON.NEXT style Brevo
 * lors des changements de route.
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
import { LogoLoader } from './logo-loader';

type PageTransitionProps = {
  /**
   * Délai avant de considérer la transition comme terminée
   * @default 100
   */
  completionDelay?: number;

  /**
   * Texte à afficher sous le logo
   * @default "Chargement"
   */
  loadingText?: string;
};

/**
 * Composant de transition de page avec LogoLoader
 *
 * Affiche le logo ON.NEXT animé lors des changements de route.
 *
 * @param completionDelay - Délai de complétion en ms (défaut: 100ms)
 * @param loadingText - Texte sous le logo
 *
 * @example
 * <PageTransition />
 */
export function PageTransition({
  completionDelay = 100,
  loadingText = 'Chargement',
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

  return <LogoLoader isLoading={isNavigating} loadingText={loadingText} />;
}

