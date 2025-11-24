/**
 * Hook pour mesurer les performances custom
 * 
 * Permet de mesurer des temps d'exécution spécifiques comme :
 * - Temps de chargement d'une page/composant
 * - Temps de rendu d'un composant
 * - Temps d'exécution d'une fonction
 * - Temps de chargement des données
 */

import { useEffect, useRef, useCallback } from 'react';

type PerformanceMeasure = {
  name: string;
  startTime: number;
  endTime: number | null;
  duration: number | null;
};

type UsePerformanceMeasureOptions = {
  /** Nom de la mesure (affiché dans les logs) */
  name: string;
  /** Si true, mesure automatiquement le temps de rendu du composant */
  measureRender?: boolean;
  /** Callback appelé quand la mesure est terminée */
  onComplete?: (duration: number) => void;
  /** Si true, log la mesure dans la console (dev uniquement) */
  logToConsole?: boolean;
};

/**
 * Hook pour mesurer les performances custom
 * 
 * @param options - Options de configuration
 * @returns Fonctions pour démarrer/arrêter la mesure manuellement
 * 
 * @example
 * // Mesurer automatiquement le temps de rendu
 * usePerformanceMeasure({ name: 'DashboardRender', measureRender: true });
 * 
 * @example
 * // Mesurer manuellement une opération
 * const { startMeasure, endMeasure } = usePerformanceMeasure({ name: 'DataLoad' });
 * 
 * async function loadData() {
 *   startMeasure();
 *   await fetchData();
 *   endMeasure(); // Affiche le temps écoulé
 * }
 */
export function usePerformanceMeasure({
  name,
  measureRender = false,
  onComplete,
  logToConsole = process.env.NODE_ENV === 'development',
}: UsePerformanceMeasureOptions) {
  const measureRef = useRef<PerformanceMeasure | null>(null);
  const renderStartTime = useRef<number | null>(null);

  /**
   * Démarre une mesure
   */
  const startMeasure = useCallback(() => {
    const startTime = performance.now();
    measureRef.current = {
      name,
      startTime,
      endTime: null,
      duration: null,
    };

    // Marquer dans Performance API
    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.mark(`${name}-start`);
    }

    if (logToConsole) {
      console.time(`⏱️ ${name}`);
    }
  }, [name, logToConsole]);

  /**
   * Arrête une mesure et calcule la durée
   */
  const endMeasure = useCallback(() => {
    if (!measureRef.current) {
      if (logToConsole) {
        console.warn(`[usePerformanceMeasure] No measure started for "${name}"`);
      }
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - measureRef.current.startTime;

    measureRef.current.endTime = endTime;
    measureRef.current.duration = duration;

    // Mesurer dans Performance API
    if (typeof window !== 'undefined' && 'performance' in window) {
      try {
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
      } catch (error) {
        // Ignorer si les marks n'existent pas
      }
    }

    if (logToConsole) {
      console.timeEnd(`⏱️ ${name}`);
      const rating = duration < 100 ? '✅' : duration < 500 ? '⚠️' : '❌';
      console.log(`${rating} ${name}: ${Math.round(duration)}ms`);
    }

    if (onComplete) {
      onComplete(duration);
    }

    const result = duration;
    measureRef.current = null;
    return result;
  }, [name, onComplete, logToConsole]);

  /**
   * Mesure le temps d'exécution d'une fonction
   */
  const measureFunction = useCallback(
    <T,>(fn: () => T | Promise<T>): T | Promise<T> => {
      startMeasure();
      try {
        const result = fn();
        if (result instanceof Promise) {
          return result.finally(() => endMeasure()) as Promise<T>;
        }
        endMeasure();
        return result;
      } catch (error) {
        endMeasure();
        throw error;
      }
    },
    [startMeasure, endMeasure]
  );

  // Mesurer automatiquement le temps de rendu si demandé
  useEffect(() => {
    if (!measureRender) return;

    renderStartTime.current = performance.now();
    startMeasure();

    return () => {
      if (renderStartTime.current !== null) {
        endMeasure();
      }
    };
  }, [measureRender, startMeasure, endMeasure]);

  return {
    startMeasure,
    endMeasure,
    measureFunction,
  };
}

/**
 * Mesure simple du temps d'exécution d'une fonction
 * 
 * @param name - Nom de la mesure
 * @param fn - Fonction à mesurer
 * @returns Résultat de la fonction et durée d'exécution
 * 
 * @example
 * const [result, duration] = measureExecution('fetchData', () => fetch('/api/data'));
 */
export function measureExecution<T>(name: string, fn: () => T | Promise<T>): [T, number] | [Promise<T>, Promise<number>] {
  const startTime = performance.now();

  if (process.env.NODE_ENV === 'development') {
    console.time(`⏱️ ${name}`);
  }

  try {
    const result = fn();

    if (result instanceof Promise) {
      return [
        result,
        result.then(() => {
          const duration = performance.now() - startTime;
          if (process.env.NODE_ENV === 'development') {
            console.timeEnd(`⏱️ ${name}`);
            console.log(`✅ ${name}: ${Math.round(duration)}ms`);
          }
          return duration;
        }),
      ] as [Promise<T>, Promise<number>];
    }

    const duration = performance.now() - startTime;
    if (process.env.NODE_ENV === 'development') {
      console.timeEnd(`⏱️ ${name}`);
      console.log(`✅ ${name}: ${Math.round(duration)}ms`);
    }

    return [result, duration] as [T, number];
  } catch (error) {
    const duration = performance.now() - startTime;
    if (process.env.NODE_ENV === 'development') {
      console.timeEnd(`⏱️ ${name}`);
      console.error(`❌ ${name} failed after ${Math.round(duration)}ms:`, error);
    }
    throw error;
  }
}

