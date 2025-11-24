/**
 * Hook pour compter les re-renders d'un composant
 * 
 * Utile pour identifier les composants qui se re-rendent trop souvent
 * et optimiser les performances.
 */

import { useEffect, useRef } from 'react';

type UseRenderCountOptions = {
  /** Nom du composant (affiché dans les logs) */
  componentName?: string;
  /** Si true, log le nombre de renders dans la console (dev uniquement) */
  logToConsole?: boolean;
  /** Seuil d'alerte si le nombre de renders dépasse cette valeur */
  warningThreshold?: number;
  /** Callback appelé à chaque render */
  onRender?: (count: number) => void;
};

/**
 * Hook pour compter les re-renders d'un composant
 * 
 * @param options - Options de configuration
 * @returns Nombre total de renders
 * 
 * @example
 * function MyComponent() {
 *   const renderCount = useRenderCount({ componentName: 'MyComponent', warningThreshold: 5 });
 *   // ... reste du composant
 * }
 */
export function useRenderCount({
  componentName = 'Component',
  logToConsole = process.env.NODE_ENV === 'development',
  warningThreshold = 10,
  onRender,
}: UseRenderCountOptions = {}): number {
  const renderCountRef = useRef(0);
  const mountTimeRef = useRef<number | null>(null);

  // Incrémenter le compteur à chaque render
  renderCountRef.current += 1;

  useEffect(() => {
    // Enregistrer le temps de montage
    if (mountTimeRef.current === null) {
      mountTimeRef.current = performance.now();
    }

    const currentCount = renderCountRef.current;

    // Appeler le callback si fourni
    if (onRender) {
      onRender(currentCount);
    }

    // Logger en développement
    if (logToConsole && currentCount > 1) {
      // Ne pas logger le premier render (montage normal)
      const icon = currentCount > warningThreshold ? '⚠️' : '🔄';
      const timeSinceMount = mountTimeRef.current
        ? Math.round(performance.now() - mountTimeRef.current)
        : 0;

      console.log(
        `${icon} [Render Count] ${componentName}: ${currentCount} render(s)${timeSinceMount > 0 ? ` (${timeSinceMount}ms depuis le montage)` : ''}`
      );

      if (currentCount > warningThreshold) {
        console.warn(
          `⚠️ [Performance] ${componentName} s'est re-rendu ${currentCount} fois (seuil: ${warningThreshold}). Considérez l'optimisation avec React.memo ou useMemo.`
        );
      }
    }
    // Pas de dépendances : s'exécute après chaque render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });

  return renderCountRef.current;
}

/**
 * Hook pour comparer les props et détecter les changements
 * Utile pour comprendre pourquoi un composant se re-rend
 * 
 * @param props - Props du composant
 * @param componentName - Nom du composant
 * @returns Props qui ont changé depuis le dernier render
 */
export function usePropsComparison<T extends Record<string, any>>(
  props: T,
  componentName?: string
): {
  changedProps: Partial<T>;
  hasChanges: boolean;
} {
  const prevPropsRef = useRef<T | null>(null);
  const changedPropsRef = useRef<Partial<T>>({});

  if (prevPropsRef.current !== null) {
    changedPropsRef.current = {};
    const prevProps = prevPropsRef.current;

    // Comparer chaque prop
    Object.keys(props).forEach((key) => {
      if (prevProps[key] !== props[key]) {
        changedPropsRef.current[key as keyof T] = props[key];

        if (process.env.NODE_ENV === 'development') {
          console.log(
            `🔄 [Props Change] ${componentName || 'Component'}.${key}:`,
            prevProps[key],
            '→',
            props[key]
          );
        }
      }
    });

    prevPropsRef.current = props;
  } else {
    prevPropsRef.current = props;
  }

  return {
    changedProps: changedPropsRef.current,
    hasChanges: Object.keys(changedPropsRef.current).length > 0,
  };
}


