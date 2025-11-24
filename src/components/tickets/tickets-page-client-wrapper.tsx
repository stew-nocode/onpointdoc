'use client';

/**
 * Wrapper client pour la page tickets avec mesures de performance
 * 
 * Mesure :
 * - Temps de rendu de la page
 * - Re-renders du composant principal
 * 
 * Optimisé pour éviter les re-renders inutiles.
 */

import { useEffect, useRef } from 'react';
import { memo } from 'react';
import { usePerformanceMeasure, useRenderCount } from '@/hooks/performance';

type TicketsPageClientWrapperProps = {
  children: React.ReactNode;
};

/**
 * Logger les métriques une seule fois au montage
 * Utilise useRef pour éviter les re-renders causés par useEffect
 */
function useMountLogging() {
  const hasLoggedRef = useRef(false);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && !hasLoggedRef.current) {
      console.group('📊 Tickets Page Performance');
      console.log('✅ Page montée');
      console.log('⏱️ Mesures automatiques activées :');
      console.log('   - Temps de rendu (TicketsPageRender)');
      console.log('   - Compteur de re-renders');
      console.groupEnd();
      hasLoggedRef.current = true;
    }
  }, []);
}

/**
 * Wrapper client pour mesurer les performances de la page tickets
 * 
 * Mémorisé avec React.memo pour éviter les re-renders inutiles si les children ne changent pas.
 */
function TicketsPageClientWrapperComponent({ children }: TicketsPageClientWrapperProps) {
  // Mesurer le temps de rendu
  usePerformanceMeasure({
    name: 'TicketsPageRender',
    measureRender: true,
    logToConsole: process.env.NODE_ENV === 'development',
  });

  // Compter les re-renders (sans logger dans useEffect pour éviter les cycles)
  useRenderCount({
    componentName: 'TicketsPage',
    warningThreshold: 5,
    logToConsole: process.env.NODE_ENV === 'development',
  });

  // Logger une seule fois au montage (sans dépendance à renderCount)
  useMountLogging();

  return <>{children}</>;
}

/**
 * Wrapper mémorisé pour éviter les re-renders si les children sont identiques
 */
export const TicketsPageClientWrapper = memo(TicketsPageClientWrapperComponent);
TicketsPageClientWrapper.displayName = 'TicketsPageClientWrapper';

