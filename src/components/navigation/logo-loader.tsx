/**
 * Loader animé avec le logo ON.NEXT
 *
 * Inspiré de l'animation de chargement de Brevo :
 * - Animation de pulse élégante
 * - Effet de fade in/out
 * - Points animés pour indiquer le chargement
 * - Backdrop blur pour l'effet premium
 *
 * Principe Clean Code :
 * - SRP : Uniquement l'affichage du loader
 * - Réutilisable pour toutes les transitions
 * - Performance optimisée avec CSS animations
 */

'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

type LogoLoaderProps = {
  /**
   * Si true, le loader est visible
   */
  isLoading: boolean;

  /**
   * Texte à afficher sous le logo
   * @default "Chargement..."
   */
  loadingText?: string;

  /**
   * Classe CSS additionnelle
   */
  className?: string;

  /**
   * Afficher les points animés
   * @default true
   */
  showDots?: boolean;
};

/**
 * Composant de loader avec animation du logo ON.NEXT
 *
 * Animation style Brevo :
 * - Logo qui pulse et brille
 * - Backdrop blur pour l'effet premium
 * - Points animés pour indiquer l'activité
 * - Transition fluide d'entrée/sortie
 *
 * @param isLoading - État de chargement
 * @param loadingText - Texte sous le logo
 * @param showDots - Afficher les points animés
 *
 * @example
 * <LogoLoader isLoading={isNavigating} />
 */
export function LogoLoader({
  isLoading,
  loadingText = 'Chargement',
  className,
  showDots = true,
}: LogoLoaderProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isLoading) {
      // Afficher immédiatement
      setShouldRender(true);
      // Petit délai pour l'animation d'entrée
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else {
      // Masquer avec transition rapide
      setIsVisible(false);
      // Attendre la fin de l'animation avant de démonter (150ms au lieu de 300ms)
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-[9999] flex items-center justify-center',
        'bg-slate-900/75 dark:bg-black/80',
        'backdrop-blur-sm',
        'transition-opacity duration-150',
        isVisible ? 'opacity-100' : 'opacity-0',
        className
      )}
      aria-live="polite"
      aria-busy={isLoading}
    >
      {/* Contenu centré - Logo flottant directement sur l'overlay */}
      <div className="flex flex-col items-center gap-4">
        {/* Logo animé avec glow subtil */}
        <div className="relative">
          {/* Cercle de glow subtil derrière le logo */}
          <div className="absolute inset-0 -m-6 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-2xl" />

          {/* Logo principal avec animation */}
          <div
            className={cn(
              'relative flex items-center justify-center',
              'animate-logo-pulse'
            )}
          >
            <LogoText />
          </div>
        </div>

        {/* Texte de chargement avec points animés */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-white/90 dark:text-white/80">
            {loadingText}
          </span>
          {showDots && <LoadingDots />}
        </div>
      </div>
    </div>
  );
}

/**
 * Composant du logo On.next avec styling
 */
function LogoText() {
  return (
    <div className="flex items-center" style={{ fontFamily: '"Zalando Sans Expanded", sans-serif' }}>
      {/* On */}
      <span
        className={cn(
          'text-3xl',
          'bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400',
          'bg-clip-text text-transparent'
        )}
        style={{ letterSpacing: '0.02em', fontWeight: 400 }}
      >
        On
      </span>

      {/* Point séparateur */}
      <span
        className={cn(
          'text-3xl text-blue-400'
        )}
        style={{ fontWeight: 400 }}
      >
        .
      </span>

      {/* next */}
      <span
        className={cn(
          'text-3xl',
          'bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400',
          'bg-clip-text text-transparent',
          'lowercase'
        )}
        style={{ letterSpacing: '0.02em', fontWeight: 400 }}
      >
        next
      </span>
    </div>
  );
}

/**
 * Points animés pour indiquer le chargement
 */
function LoadingDots() {
  return (
    <div className="flex gap-0.5">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'w-1 h-1 rounded-full bg-white/70 dark:bg-white/60',
            'animate-bounce'
          )}
          style={{
            animationDelay: `${i * 0.15}s`,
            animationDuration: '0.6s',
          }}
        />
      ))}
    </div>
  );
}
