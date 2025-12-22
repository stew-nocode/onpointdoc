import { useMemo } from 'react';
import * as React from 'react';

/**
 * Hook optimisé pour créer des tooltips memoizés pour les charts Recharts
 *
 * Résout les problèmes de performance liés aux tooltips :
 * - Tooltip recréé à chaque render du chart parent
 * - Calculs refaits à chaque hover
 * - Re-renders du chart complet sur hover
 *
 * @example
 * ```tsx
 * const tooltip = useChartTooltip((active, payload, label) => {
 *   if (!active || !payload?.length) return null;
 *   return (
 *     <div className="rounded-lg border bg-background p-2">
 *       <p>{label}</p>
 *       {payload.map(item => <p key={item.name}>{item.value}</p>)}
 *     </div>
 *   );
 * });
 *
 * <Tooltip content={tooltip} />
 * ```
 */
export function useChartTooltip<TPayload = any>(
  renderer: (
    active: boolean | undefined,
    payload: TPayload[] | undefined,
    label: string | undefined
  ) => React.ReactNode
) {
  // Memoizer le composant tooltip pour éviter recréation
  const TooltipComponent = useMemo(
    () =>
      React.memo<{
        active?: boolean;
        payload?: TPayload[];
        label?: string;
      }>(
        ({ active, payload, label }) => {
          return <>{renderer(active, payload, label)}</>;
        },
        // Comparaison custom pour éviter re-renders inutiles
        (prev, next) =>
          prev.active === next.active &&
          prev.label === next.label &&
          JSON.stringify(prev.payload) === JSON.stringify(next.payload)
      ),
    [renderer]
  );

  // Retourner l'instance du composant (pas un élément React)
  // Recharts accepte un composant ou un élément
  return TooltipComponent;
}

/**
 * Hook pour mémoriser des calculs coûteux dans les tooltips
 *
 * Évite de recalculer reduce, map, filter à chaque hover
 *
 * @example
 * ```tsx
 * const total = useTooltipCalculation(
 *   payload,
 *   (data) => data.reduce((sum, item) => sum + item.value, 0)
 * );
 * ```
 */
export function useTooltipCalculation<TPayload = any, TResult = any>(
  payload: TPayload[] | undefined,
  calculator: (payload: TPayload[]) => TResult
): TResult | null {
  return useMemo(() => {
    if (!payload?.length) return null;
    return calculator(payload);
  }, [payload, calculator]);
}

/**
 * Types helper pour Recharts Tooltip
 */
export type TooltipProps<TPayload = any> = {
  active?: boolean;
  payload?: TPayload[];
  label?: string;
};

export type ChartTooltipPayload = {
  name?: string;
  value?: number | string;
  color?: string;
  fill?: string;
  dataKey?: string;
  payload?: any;
  [key: string]: any;
};
