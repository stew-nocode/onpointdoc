'use client';

/**
 * Wrapper client pour la page tickets avec mesures de performance
 * 
 * OPTIMISÉ : En production, ce wrapper est complètement désactivé (passe-through).
 * En développement, il mesure les performances mais se désactive automatiquement
 * après un certain nombre de re-renders pour éviter le spam.
 * 
 * IMPORTANT : Les Server Components de Next.js se re-rendent naturellement
 * quand les searchParams changent. C'est un comportement normal et attendu.
 * Ce wrapper ne doit PAS empêcher ces re-renders, seulement les mesurer.
 */

import React, { useRef, useEffect, useState } from 'react';
import { usePerformanceMeasure, useRenderCount } from '@/hooks/performance';

type TicketsPageClientWrapperProps = {
  children: React.ReactNode;
};

/**
 * Composant wrapper optimisé
 * 
 * En production : passe-through direct (pas de mesures, pas de re-renders inutiles)
 * En développement : mesures de performance avec auto-désactivation
 */
function TicketsPageClientWrapperComponent({ children }: TicketsPageClientWrapperProps) {
  // Tous les hooks doivent être appelés AVANT tout return conditionnel
  const hasLoggedRef = useRef(false);
  const renderCountRef = useRef(0);
  const isPerformanceDisabledRef = useRef(false);
  const [shouldMeasure, setShouldMeasure] = useState(
    process.env.NODE_ENV !== 'production'
  );

  // Tous les hooks doivent être appelés dans le même ordre à chaque render
  usePerformanceMeasure({
    name: 'TicketsPageRender',
    measureRender: shouldMeasure,
    logToConsole: shouldMeasure,
  });

  useRenderCount({
    componentName: 'TicketsPage',
    warningThreshold: 5,
    logToConsole: shouldMeasure,
  });

  useEffect(() => {
    // Ne rien faire en production
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    // Incrémenter le compteur après le render
    renderCountRef.current += 1;
    const currentCount = renderCountRef.current;

    // Mettre à jour shouldMeasure basé sur les refs (déplacé du render)
    const newShouldMeasure = !isPerformanceDisabledRef.current && currentCount < 10;
    if (newShouldMeasure !== shouldMeasure) {
      setShouldMeasure(newShouldMeasure);
    }

    if (newShouldMeasure && !hasLoggedRef.current) {
      console.group('📊 Tickets Page Performance (Dev Mode)');
      console.log('✅ Page montée');
      console.log('⏱️ Mesures automatiques activées (max 10 re-renders)');
      console.log('ℹ️ Note: Les Server Components se re-rendent normalement quand les searchParams changent');
      console.groupEnd();
      hasLoggedRef.current = true;
    }

    // Désactiver les mesures si trop de re-renders
    if (currentCount >= 10 && !isPerformanceDisabledRef.current) {
      isPerformanceDisabledRef.current = true;
      setShouldMeasure(false);
      console.warn('⚠️ [Performance] Mesures désactivées après 10 re-renders. C\'est normal pour un Server Component qui réagit aux searchParams.');
    }
  }, [shouldMeasure]);

  // En production, retourner directement les children sans mesures
  if (process.env.NODE_ENV === 'production') {
    return <>{children}</>;
  }

  return <>{children}</>;
}

/**
 * Wrapper client optimisé
 * 
 * En production : passe-through direct (pas de memo, pas de overhead)
 * En développement : memo pour éviter les re-renders inutiles du wrapper lui-même
 * 
 * IMPORTANT : Les Server Components de Next.js créent de nouvelles références
 * pour les children à chaque render. C'est normal et ne peut pas être évité.
 * Ce wrapper ne doit PAS empêcher ces re-renders, seulement les mesurer en dev.
 */
export const TicketsPageClientWrapper = 
  process.env.NODE_ENV === 'production'
    ? TicketsPageClientWrapperComponent // En production, pas de memo (passe-through)
    : React.memo(
        TicketsPageClientWrapperComponent,
        (prevProps, nextProps) => {
          // En développement, comparer les children par référence
          // Mais accepter les re-renders si les children changent (comportement normal)
          return prevProps.children === nextProps.children;
        }
      );

// Assigner displayName avec assertion de type pour compatibilité TypeScript
(TicketsPageClientWrapper as React.NamedExoticComponent | React.FunctionComponent).displayName = 'TicketsPageClientWrapper';

