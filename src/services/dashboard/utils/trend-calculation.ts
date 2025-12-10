/**
 * Utilitaire pour calculer les tendances en pourcentage
 * 
 * Centralise la logique de calcul de tendance utilisée dans plusieurs services.
 */

/**
 * Calcule la tendance en pourcentage entre deux valeurs
 * 
 * @param current - Valeur actuelle
 * @param previous - Valeur précédente
 * @returns Pourcentage de variation (arrondi à l'entier)
 * 
 * @example
 * calculateTrend(120, 100) // 20 (augmentation de 20%)
 * calculateTrend(80, 100) // -20 (diminution de 20%)
 * calculateTrend(50, 0) // 100 (nouvelle valeur, pas de base)
 * 
 * Note: Pour les taux (résolution, critique, etc.), les valeurs doivent être plafonnées à 100%
 * avant d'appeler cette fonction pour éviter les incohérences mathématiques.
 */
export function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}


