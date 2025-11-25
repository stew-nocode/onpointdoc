'use client';

/**
 * Wrapper client pour la page tickets avec mesures de performance
 * 
 * Mesure :
 * - Temps de rendu de la page
 * - Re-renders du composant principal
 * 
 * Optimisé pour éviter les re-renders inutiles.
 * Tous les hooks sont appelés de manière inconditionnelle pour respecter les règles des hooks React.
 */

import { useRef, useEffect } from 'react';
import { usePerformanceMeasure, useRenderCount } from '@/hooks/performance';

type TicketsPageClientWrapperProps = {
  children: React.ReactNode;
};

/**
 * Wrapper client pour mesurer les performances de la page tickets
 * 
 * IMPORTANT : Tous les hooks doivent être appelés dans le même ordre à chaque render.
 * Pas de React.memo pour éviter les problèmes d'ordre de hooks.
 */
export function TicketsPageClientWrapper({ children }: TicketsPageClientWrapperProps) {
  const hasLoggedRef = useRef(false);

  // Tous les hooks doivent être appelés dans le même ordre à chaque render
  // 1. usePerformanceMeasure (toujours appelé, inconditionnel)
  usePerformanceMeasure({
    name: 'TicketsPageRender',
    measureRender: true,
    logToConsole: process.env.NODE_ENV === 'development',
  });

  // 2. useRenderCount (toujours appelé, inconditionnel)
  useRenderCount({
    componentName: 'TicketsPage',
    warningThreshold: 5,
    logToConsole: process.env.NODE_ENV === 'development',
  });

  // 3. useEffect pour le logging (toujours appelé, inconditionnel)
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

  return <>{children}</>;
}

