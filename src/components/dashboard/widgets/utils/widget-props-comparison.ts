import type { ComponentType } from 'react';
import type { WidgetProps } from '@/types/dashboard-widget-props';

type MemoizedWidgetProps = {
  component: ComponentType<WidgetProps>;
  props: WidgetProps;
};

/**
 * Compare les composants entre deux props
 * 
 * @param prevComponent - Composant précédent
 * @param nextComponent - Composant suivant
 * @returns true si les composants sont identiques
 */
function compareComponents(
  prevComponent: ComponentType<WidgetProps>,
  nextComponent: ComponentType<WidgetProps>
): boolean {
  return prevComponent === nextComponent;
}

/**
 * Compare la période entre deux props
 * 
 * @param prevProps - Props précédentes
 * @param nextProps - Props suivantes
 * @returns true si la période n'a pas changé
 */
function comparePeriod(prevProps: WidgetProps, nextProps: WidgetProps): boolean {
  if (!('period' in prevProps) || !('period' in nextProps)) {
    return true; // Pas de période à comparer
  }

  const periodChanged = prevProps.period !== nextProps.period;
  
  if (periodChanged && process.env.NODE_ENV === 'development') {
    console.log('[MemoizedWidget] Period changed, re-rendering:', {
      prev: prevProps.period,
      next: nextProps.period,
    });
  }

  return !periodChanged;
}

/**
 * Compare les clés des props entre deux objets
 * 
 * @param prevProps - Props précédentes
 * @param nextProps - Props suivantes
 * @returns true si toutes les clés ont des valeurs identiques
 */
function comparePropsKeys(prevProps: WidgetProps, nextProps: WidgetProps): boolean {
  const prevKeys = Object.keys(prevProps);
  const nextKeys = Object.keys(nextProps);

  if (prevKeys.length !== nextKeys.length) {
    return false;
  }

  for (const key of prevKeys) {
    if (prevProps[key] !== nextProps[key]) {
      // Ignorer period car déjà comparé
      if (key === 'period') continue;

      if (process.env.NODE_ENV === 'development') {
        console.log('[MemoizedWidget] Prop changed, re-rendering:', key);
      }

      return false;
    }
  }

  return true;
}

/**
 * Comparaison optimisée pour React.memo
 * 
 * Détecte les changements de :
 * - component : comparaison par référence
 * - period (string) : comparaison par valeur
 * - autres props : comparaison par référence
 * 
 * @param prevProps - Props précédentes
 * @param nextProps - Props suivantes
 * @returns true si les props sont identiques (pas de re-render)
 */
export function areWidgetPropsEqual(
  prevProps: MemoizedWidgetProps,
  nextProps: MemoizedWidgetProps
): boolean {
  // Si le composant change, re-render
  if (!compareComponents(prevProps.component, nextProps.component)) {
    return false;
  }

  // Comparer la période si présente
  if (!comparePeriod(prevProps.props, nextProps.props)) {
    return false;
  }

  // Comparer les autres props
  return comparePropsKeys(prevProps.props, nextProps.props);
}

