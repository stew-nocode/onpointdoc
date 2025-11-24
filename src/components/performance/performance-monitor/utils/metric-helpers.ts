/**
 * Utilitaires pour formater et évaluer les métriques Web Vitals
 * 
 * Extraits du composant PerformanceMonitor pour respecter le principe SRP.
 * Fonctions pures, réutilisables et testables.
 */

export type MetricRating = 'good' | 'needs-improvement' | 'poor';

/**
 * Retourne la couleur Tailwind CSS pour un rating donné
 * 
 * @param rating - Le rating de la métrique
 * @returns La classe CSS pour la couleur
 */
export function getRatingColor(rating: MetricRating): string {
  switch (rating) {
    case 'good':
      return 'bg-green-500';
    case 'needs-improvement':
      return 'bg-yellow-500';
    case 'poor':
      return 'bg-red-500';
  }
}

/**
 * Retourne la variante de Badge pour un rating donné
 * 
 * @param rating - Le rating de la métrique
 * @returns La variante de Badge correspondante
 */
export function getRatingBadgeVariant(rating: MetricRating): 'success' | 'warning' | 'danger' {
  switch (rating) {
    case 'good':
      return 'success';
    case 'needs-improvement':
      return 'warning';
    case 'poor':
      return 'danger';
  }
}

/**
 * Formate une valeur de métrique pour l'affichage
 * 
 * @param name - Le nom de la métrique (ex: 'LCP', 'CLS')
 * @param value - La valeur numérique
 * @returns La valeur formatée en string
 */
export function formatMetricValue(name: string, value: number): string {
  if (name === 'CLS') {
    return value.toFixed(3);
  }
  return `${Math.round(value)}ms`;
}

/**
 * Retourne l'icône correspondant au rating
 * 
 * @param rating - Le rating de la métrique
 * @returns L'icône (✓, !, ou ✗)
 */
export function getRatingIcon(rating: MetricRating): string {
  switch (rating) {
    case 'good':
      return '✓';
    case 'needs-improvement':
      return '!';
    case 'poor':
      return '✗';
  }
}

