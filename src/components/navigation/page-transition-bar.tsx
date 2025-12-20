/**
 * Barre de progression pour les transitions de page
 * 
 * Affiche une barre de progression animée en haut de la page
 * lors des changements de route.
 * 
 * Utilise des transitions CSS pour une animation fluide.
 * Respecte le principe SRP : uniquement l'affichage de la barre.
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

type PageTransitionBarProps = {
  /**
   * Indique si la transition est en cours
   */
  isTransitioning: boolean;

  /**
   * Durée de la transition en millisecondes
   * @default 300
   */
  duration?: number;

  /**
   * Classe CSS additionnelle (optionnel)
   */
  className?: string;
};

/**
 * Barre de progression pour les transitions de page
 * 
 * @param isTransitioning - État de transition
 * @param duration - Durée de la transition en ms
 * @param className - Classe CSS additionnelle
 * 
 * @example
 * <PageTransitionBar isTransitioning={isTransitioning} />
 */
export function PageTransitionBar({
  isTransitioning,
  duration = 300,
  className,
}: PageTransitionBarProps) {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const previousTransitioningRef = useRef(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const frameIdRef = useRef<number | null>(null);

  useEffect(() => {
    // Nettoyer les timeouts et animations précédents
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    if (frameIdRef.current !== null) {
      cancelAnimationFrame(frameIdRef.current);
      frameIdRef.current = null;
    }

    if (isTransitioning) {
      // Afficher la barre et démarrer l'animation
       
      setIsVisible(true);
       
      setProgress(0);
      previousTransitioningRef.current = true;

      // Animation de progression jusqu'à 90%
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const newProgress = Math.min((elapsed / duration) * 100, 90);

        setProgress(newProgress);

        if (newProgress < 90) {
          frameIdRef.current = requestAnimationFrame(animate);
        }
      };

      frameIdRef.current = requestAnimationFrame(animate);
    } else if (previousTransitioningRef.current) {
      // La transition vient de se terminer, compléter la barre
      previousTransitioningRef.current = false;
      setProgress(100);

      // Masquer la barre après un court délai
      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
        hideTimeoutRef.current = null;
      }, 150);
    }

    // Cleanup
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
      if (frameIdRef.current !== null) {
        cancelAnimationFrame(frameIdRef.current);
        frameIdRef.current = null;
      }
    };
  }, [isTransitioning, duration]); // Dépendances stables et constantes

  if (!isVisible && progress === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-[9999] h-1 bg-transparent',
        className
      )}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Chargement de la page"
    >
      <div
        className="h-full bg-brand transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
          transform: 'translateX(0)',
        }}
      />
    </div>
  );
}

