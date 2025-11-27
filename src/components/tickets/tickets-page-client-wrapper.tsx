'use client';

/**
 * Wrapper client pour la page tickets avec mesures de performance
 * 
 * Mesure :
 * - Temps de rendu de la page
 * - Re-renders du composant principal
 * 
 * Optimisé avec React.memo pour éviter les re-renders inutiles.
 * Tous les hooks sont appelés de manière inconditionnelle pour respecter les règles des hooks React.
 */

import React, { useRef, useEffect } from 'react';
import { usePerformanceMeasure, useRenderCount } from '@/hooks/performance';

type TicketsPageClientWrapperProps = {
  children: React.ReactNode;
};

/**
 * Composant interne non memoizé pour les hooks
 * 
 * Les hooks DOIVENT être appelés dans le même ordre à chaque render.
 * React.memo n'affecte PAS l'ordre des hooks - c'est une fausse croyance.
 * 
 * OPTIMISÉ : Désactive les mesures de performance si trop de re-renders détectés
 * pour éviter le spam de logs en développement.
 */
function TicketsPageClientWrapperComponent({ children }: TicketsPageClientWrapperProps) {
  const hasLoggedRef = useRef(false);
  const renderCountRef = useRef(0);
  const isPerformanceDisabledRef = useRef(false);

  // Incrémenter le compteur à chaque render
  renderCountRef.current += 1;

  // Désactiver les mesures si trop de re-renders (évite le spam)
  const shouldMeasure = 
    process.env.NODE_ENV === 'development' && 
    !isPerformanceDisabledRef.current &&
    renderCountRef.current < 20; // Désactiver après 20 re-renders

  // Tous les hooks doivent être appelés dans le même ordre à chaque render
  // 1. usePerformanceMeasure (toujours appelé, inconditionnel)
  usePerformanceMeasure({
    name: 'TicketsPageRender',
    measureRender: shouldMeasure,
    logToConsole: shouldMeasure,
  });

  // 2. useRenderCount (toujours appelé, inconditionnel)
  // Désactiver les logs si trop de re-renders
  useRenderCount({
    componentName: 'TicketsPage',
    warningThreshold: 5,
    logToConsole: shouldMeasure,
  });

  // 3. useEffect pour le logging (toujours appelé, inconditionnel)
  useEffect(() => {
    if (shouldMeasure && !hasLoggedRef.current) {
      console.group('📊 Tickets Page Performance');
      console.log('✅ Page montée');
      console.log('⏱️ Mesures automatiques activées :');
      console.log('   - Temps de rendu (TicketsPageRender)');
      console.log('   - Compteur de re-renders');
      console.groupEnd();
      hasLoggedRef.current = true;
    }

    // Désactiver les mesures si trop de re-renders
    if (renderCountRef.current >= 20 && !isPerformanceDisabledRef.current) {
      isPerformanceDisabledRef.current = true;
      console.warn('⚠️ [Performance] Trop de re-renders détectés. Mesures de performance désactivées pour éviter le spam.');
    }
  }, [shouldMeasure]);

  return <>{children}</>;
}

/**
 * Wrapper client optimisé avec React.memo
 * 
 * Ne se re-rend que si les children changent réellement (référence différente).
 * 
 * NOTE : En production, ce wrapper peut être supprimé car les mesures de performance
 * ne sont pas nécessaires. En développement, il aide à identifier les problèmes.
 * 
 * IMPORTANT : React.memo n'affecte PAS l'ordre des hooks.
 * Les hooks sont toujours appelés dans le même ordre à chaque render.
 */
export const TicketsPageClientWrapper = React.memo(
  TicketsPageClientWrapperComponent,
  (prevProps, nextProps) => {
    // En développement, comparer les children pour éviter les re-renders inutiles
    // En production, toujours re-render (mais le wrapper devrait être supprimé)
    if (process.env.NODE_ENV === 'development') {
      return prevProps.children === nextProps.children;
    }
    // En production, permettre le re-render (mais idéalement supprimer le wrapper)
    return false;
  }
);

TicketsPageClientWrapper.displayName = 'TicketsPageClientWrapper';

