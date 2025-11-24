/**
 * Hook pour mesurer les Core Web Vitals
 * 
 * Utilise l'API Web Vitals du navigateur pour mesurer :
 * - LCP (Largest Contentful Paint) - Temps de chargement du contenu principal
 * - FID (First Input Delay) / INP (Interaction to Next Paint) - Réactivité aux interactions
 * - CLS (Cumulative Layout Shift) - Stabilité visuelle
 * - FCP (First Contentful Paint) - Temps jusqu'au premier rendu
 * - TTFB (Time to First Byte) - Temps jusqu'à la première réponse serveur
 */

import { useEffect, useState } from 'react';

export type WebVitalMetric = {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  id: string;
};

type WebVitalsState = {
  LCP: WebVitalMetric | null;
  FID: WebVitalMetric | null;
  INP: WebVitalMetric | null;
  CLS: WebVitalMetric | null;
  FCP: WebVitalMetric | null;
  TTFB: WebVitalMetric | null;
};

/**
 * Seuils pour évaluer les métriques (en millisecondes ou score)
 * Basés sur les recommandations Google Core Web Vitals
 */
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 }, // ms
  FID: { good: 100, poor: 300 }, // ms
  INP: { good: 200, poor: 500 }, // ms
  CLS: { good: 0.1, poor: 0.25 }, // score
  FCP: { good: 1800, poor: 3000 }, // ms
  TTFB: { good: 800, poor: 1800 }, // ms
};

/**
 * Détermine le rating d'une métrique selon les seuils
 */
function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Formate une métrique Web Vital
 */
function formatMetric(name: string, value: number, delta?: number): WebVitalMetric {
  return {
    name,
    value: Math.round(value),
    rating: getRating(name, value),
    delta: delta ? Math.round(delta) : undefined,
    id: `${name}-${Date.now()}`,
  };
}

/**
 * Hook pour mesurer les Core Web Vitals
 * 
 * @returns État contenant toutes les métriques Web Vitals mesurées
 * 
 * @example
 * const { LCP, FID, CLS } = useWebVitals();
 * console.log('LCP:', LCP?.value, LCP?.rating);
 */
export function useWebVitals() {
  const [metrics, setMetrics] = useState<WebVitalsState>({
    LCP: null,
    FID: null,
    INP: null,
    CLS: null,
    FCP: null,
    TTFB: null,
  });

  useEffect(() => {
    // Charger la bibliothèque web-vitals dynamiquement (si disponible)
    const loadWebVitals = async () => {
      try {
        // En développement, on peut utiliser l'API Performance directement
        // ou charger web-vitals depuis npm si nécessaire
        if (typeof window === 'undefined') return;

        // Mesurer TTFB via Performance API
        if ('performance' in window && 'getEntriesByType' in performance) {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          if (navigation) {
            const ttfb = navigation.responseStart - navigation.requestStart;
            setMetrics((prev) => ({
              ...prev,
              TTFB: formatMetric('TTFB', ttfb),
            }));
          }

          // Mesurer FCP
          const paintEntries = performance.getEntriesByType('paint');
          const fcpEntry = paintEntries.find((entry) => entry.name === 'first-contentful-paint');
          if (fcpEntry) {
            setMetrics((prev) => ({
              ...prev,
              FCP: formatMetric('FCP', fcpEntry.startTime),
            }));
          }
        }

        // Observer LCP via PerformanceObserver
        if ('PerformanceObserver' in window) {
          try {
            const lcpObserver = new PerformanceObserver((list) => {
              const entries = list.getEntries();
              const lastEntry = entries[entries.length - 1] as any;
              if (lastEntry) {
                setMetrics((prev) => ({
                  ...prev,
                  LCP: formatMetric('LCP', lastEntry.renderTime || lastEntry.loadTime),
                }));
              }
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

            // Observer CLS
            const clsObserver = new PerformanceObserver((list) => {
              let clsValue = 0;
              for (const entry of list.getEntries()) {
                if (!(entry as any).hadRecentInput) {
                  clsValue += (entry as any).value;
                }
              }
              setMetrics((prev) => ({
                ...prev,
                CLS: formatMetric('CLS', clsValue),
              }));
            });
            clsObserver.observe({ entryTypes: ['layout-shift'] });

            // Observer FID/INP
            const fidObserver = new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                const fid = (entry as any).processingStart - entry.startTime;
                setMetrics((prev) => ({
                  ...prev,
                  FID: formatMetric('FID', fid),
                }));
              }
            });
            fidObserver.observe({ entryTypes: ['first-input'] });

            // Observer INP (si disponible)
            const inpObserver = new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                const inp = (entry as any).duration;
                setMetrics((prev) => ({
                  ...prev,
                  INP: formatMetric('INP', inp),
                }));
              }
            });
            inpObserver.observe({ entryTypes: ['event'] });

            return () => {
              lcpObserver.disconnect();
              clsObserver.disconnect();
              fidObserver.disconnect();
              inpObserver.disconnect();
            };
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('[useWebVitals] PerformanceObserver not fully supported:', error);
            }
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[useWebVitals] Error loading web vitals:', error);
        }
      }
    };

    loadWebVitals();

    // Logger les métriques en développement
    if (process.env.NODE_ENV === 'development') {
      const logInterval = setInterval(() => {
        const hasMetrics = Object.values(metrics).some((m) => m !== null);
        if (hasMetrics) {
          console.group('📊 Web Vitals');
          Object.entries(metrics).forEach(([key, metric]) => {
            if (metric) {
              const icon = metric.rating === 'good' ? '✅' : metric.rating === 'needs-improvement' ? '⚠️' : '❌';
              console.log(`${icon} ${metric.name}: ${metric.value}ms (${metric.rating})`);
            }
          });
          console.groupEnd();
          clearInterval(logInterval);
        }
      }, 1000);

      return () => clearInterval(logInterval);
    }
  }, []);

  return metrics;
}

