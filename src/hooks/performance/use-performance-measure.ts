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
 * Log le résultat de la performance dans la console
 * 
 * Fonction extraite pour respecter Clean Code (SRP)
 */
function logPerformanceResult(name: string, duration: number, logToConsole: boolean): void {
  if (!logToConsole) return;

  const rating = duration < 100 ? '✅' : duration < 500 ? '⚠️' : '❌';
  console.log(`${rating} ${name}: ${Math.round(duration)}ms`);
}

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
  const renderMeasureRef = useRef<{ startTime: number } | null>(null);
  const onCompleteRef = useRef(onComplete);
  const logToConsoleRef = useRef(logToConsole);
  const nameRef = useRef(name);

  // Mettre à jour les refs si les valeurs changent
  useEffect(() => {
    onCompleteRef.current = onComplete;
    logToConsoleRef.current = logToConsole;
    nameRef.current = name;
  }, [onComplete, logToConsole, name]);

  /**
   * Démarre une mesure
   */
  const startMeasure = useCallback(() => {
    const startTime = performance.now();
    measureRef.current = {
      name: nameRef.current,
      startTime,
      endTime: null,
      duration: null,
    };

    // Marquer dans Performance API
    if (typeof window !== 'undefined' && 'performance' in window) {
      try {
        performance.mark(`${nameRef.current}-start`);
      } catch {
        // Ignorer les erreurs de performance API
      }
    }

    if (logToConsoleRef.current) {
      console.time(`⏱️ ${nameRef.current}`);
    }
  }, []); // Pas de dépendances - utilise des refs

  /**
   * Arrête une mesure et calcule la durée
   */
  const endMeasure = useCallback(() => {
    if (!measureRef.current) {
      if (logToConsoleRef.current) {
        console.warn(`[usePerformanceMeasure] No measure started for "${nameRef.current}"`);
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
        performance.mark(`${nameRef.current}-end`);
        performance.measure(nameRef.current, `${nameRef.current}-start`, `${nameRef.current}-end`);
      } catch {
        // Ignorer si les marks n'existent pas
      }
    }

    if (logToConsoleRef.current) {
      console.timeEnd(`⏱️ ${nameRef.current}`);
      logPerformanceResult(nameRef.current, duration, logToConsoleRef.current);
    }

    if (onCompleteRef.current) {
      onCompleteRef.current(duration);
    }

    const result = duration;
    measureRef.current = null;
    return result;
  }, []); // Pas de dépendances - utilise des refs

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

  /**
   * Mesure le temps de rendu du composant
   * 
   * Utilise un useEffect séparé pour éviter les boucles infinies.
   * La mesure commence au montage et se termine au démontage.
   */
  useEffect(() => {
    if (!measureRender) return;

    const startTime = performance.now();
    renderMeasureRef.current = { startTime };

    if (logToConsoleRef.current) {
      console.time(`⏱️ ${nameRef.current}`);
    }

    if (typeof window !== 'undefined' && 'performance' in window) {
      try {
        performance.mark(`${nameRef.current}-start`);
      } catch {
        // Ignorer les erreurs
      }
    }

    return () => {
      if (renderMeasureRef.current) {
        const endTime = performance.now();
        const duration = endTime - renderMeasureRef.current.startTime;

        if (logToConsoleRef.current) {
          console.timeEnd(`⏱️ ${nameRef.current}`);
          logPerformanceResult(nameRef.current, duration, logToConsoleRef.current);
        }

        if (onCompleteRef.current) {
          onCompleteRef.current(duration);
        }

        if (typeof window !== 'undefined' && 'performance' in window) {
          try {
            performance.mark(`${nameRef.current}-end`);
            performance.measure(nameRef.current, `${nameRef.current}-start`, `${nameRef.current}-end`);
          } catch {
            // Ignorer les erreurs
          }
        }

        renderMeasureRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measureRender]); // Seulement measureRender - pas de dépendances aux callbacks

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
            logPerformanceResult(name, duration, true);
          }
          return duration;
        }),
      ] as [Promise<T>, Promise<number>];
    }

    const duration = performance.now() - startTime;
    if (process.env.NODE_ENV === 'development') {
      console.timeEnd(`⏱️ ${name}`);
      logPerformanceResult(name, duration, true);
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
