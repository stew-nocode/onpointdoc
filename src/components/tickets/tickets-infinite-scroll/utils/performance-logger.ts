/**
 * Utilitaires pour logger les performances de chargement des tickets
 * 
 * Centralisé pour respecter DRY et Clean Code
 */

/**
 * Log le temps de chargement d'un batch de tickets
 */
export function logTicketsLoadPerformance(
  duration: number,
  ticketsCount: number
): void {
  if (process.env.NODE_ENV !== 'development') return;

  const rating = duration < 500 ? '✅' : duration < 1000 ? '⚠️' : '❌';
  console.log(
    `${rating} TicketsLoadMore: ${Math.round(duration)}ms (${ticketsCount} tickets)`
  );
}

