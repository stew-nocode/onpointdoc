/**
 * Hook pour mesurer le temps de chargement des pages
 * 
 * Mesure automatiquement :
 * - Temps de chargement total de la page
 * - Temps jusqu'au DOMContentLoaded
 * - Temps jusqu'au load complet
 * - Temps de navigation (Next.js)
 * 
 * @example
 * const { pageLoadTime, domContentLoaded, fullLoadTime } = usePageLoadTime();
 */

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export type PageLoadMetrics = {
  /** Temps de chargement total (ms) */
  pageLoadTime: number | null;
  /** Temps jusqu'à DOMContentLoaded (ms) */
  domContentLoaded: number | null;
  /** Temps jusqu'au load complet (ms) */
  fullLoadTime: number | null;
  /** Temps de navigation Next.js (ms) */
  navigationTime: number | null;
  /** URL de la page mesurée */
  pagePath: string;
  /** Timestamp de la mesure */
  timestamp: number;
};

/**
 * Hook pour mesurer le temps de chargement des pages
 * 
 * @param options Options de configuration
 * @param options.logToConsole Si true, log les métriques dans la console (défaut: true en dev)
 * @param options.measureNavigation Si true, mesure aussi le temps de navigation Next.js (défaut: true)
 * 
 * @returns Métriques de chargement de la page
 */
export function usePageLoadTime(options?: {
  logToConsole?: boolean;
  measureNavigation?: boolean;
}): PageLoadMetrics {
  const { logToConsole = process.env.NODE_ENV === 'development', measureNavigation = true } = options || {};
  const pathname = usePathname();
  const [metrics, setMetrics] = useState<PageLoadMetrics>({
    pageLoadTime: null,
    domContentLoaded: null,
    fullLoadTime: null,
    navigationTime: null,
    pagePath: pathname,
    timestamp: Date.now(),
  });

  useEffect(() => {
    // Réinitialiser les métriques à chaque changement de page
    setMetrics({
      pageLoadTime: null,
      domContentLoaded: null,
      fullLoadTime: null,
      navigationTime: null,
      pagePath: pathname,
      timestamp: Date.now(),
    });

    if (typeof window === 'undefined') return;

    const startTime = performance.now();
    let domContentLoadedTime: number | null = null;
    let fullLoadTime: number | null = null;

    // Mesurer DOMContentLoaded
    const handleDOMContentLoaded = () => {
      domContentLoadedTime = performance.now() - startTime;
      setMetrics((prev) => ({
        ...prev,
        domContentLoaded: domContentLoadedTime,
      }));
    };

    // Mesurer load complet
    const handleLoad = () => {
      fullLoadTime = performance.now() - startTime;
      setMetrics((prev) => ({
        ...prev,
        fullLoadTime,
        pageLoadTime: fullLoadTime,
      }));

      if (logToConsole) {
        console.log(`📄 [Page Load] ${pathname}`);
        console.log(`  ⏱️  DOMContentLoaded: ${domContentLoadedTime?.toFixed(2)}ms`);
        console.log(`  ⏱️  Full Load: ${fullLoadTime.toFixed(2)}ms`);
      }
    };

    // Utiliser Performance Navigation Timing si disponible
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
        const loadComplete = navigation.loadEventEnd - navigation.loadEventStart;
        const totalTime = navigation.loadEventEnd - navigation.fetchStart;

        setMetrics((prev) => ({
          ...prev,
          domContentLoaded: domContentLoaded > 0 ? domContentLoaded : null,
          fullLoadTime: loadComplete > 0 ? loadComplete : null,
          pageLoadTime: totalTime > 0 ? totalTime : null,
        }));

        if (logToConsole && totalTime > 0) {
          console.log(`📄 [Page Load] ${pathname}`);
          console.log(`  ⏱️  Total: ${totalTime.toFixed(2)}ms`);
          console.log(`  ⏱️  DOMContentLoaded: ${domContentLoaded > 0 ? domContentLoaded.toFixed(2) : 'N/A'}ms`);
          console.log(`  ⏱️  Load Complete: ${loadComplete > 0 ? loadComplete.toFixed(2) : 'N/A'}ms`);
        }
      }
    }

    // Écouter les événements si Performance API n'est pas disponible
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', handleDOMContentLoaded);
    } else {
      // Déjà chargé
      domContentLoadedTime = 0;
      setMetrics((prev) => ({
        ...prev,
        domContentLoaded: 0,
      }));
    }

    if (document.readyState !== 'complete') {
      window.addEventListener('load', handleLoad);
    } else {
      // Déjà chargé
      fullLoadTime = performance.now() - startTime;
      setMetrics((prev) => ({
        ...prev,
        fullLoadTime,
        pageLoadTime: fullLoadTime,
      }));
    }

    // Mesurer le temps de navigation Next.js (si disponible)
    if (measureNavigation && 'performance' in window) {
      const measureNavigationTime = () => {
        const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
        if (navEntries.length > 0) {
          const nav = navEntries[0];
          const navTime = nav.loadEventEnd - nav.fetchStart;
          setMetrics((prev) => ({
            ...prev,
            navigationTime: navTime > 0 ? navTime : null,
          }));
        }
      };

      // Attendre un peu pour que les métriques soient disponibles
      setTimeout(measureNavigationTime, 100);
    }

    return () => {
      document.removeEventListener('DOMContentLoaded', handleDOMContentLoaded);
      window.removeEventListener('load', handleLoad);
    };
  }, [pathname, logToConsole, measureNavigation]);

  return metrics;
}

