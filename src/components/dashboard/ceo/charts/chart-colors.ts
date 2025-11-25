/**
 * Palette de couleurs élégante et harmonieuse pour les graphiques du dashboard
 */
export const CHART_COLORS = [
  '#6366F1', // Indigo - élégant et doux
  '#8B5CF6', // Violet - moderne
  '#EC4899', // Rose - vibrant
  '#F59E0B', // Ambre - chaleureux
  '#10B981', // Émeraude - frais
  '#06B6D4', // Cyan - lumineux
  '#3B82F6', // Bleu - confiance
  '#84CC16'  // Vert lime - énergique
] as const;

/**
 * Récupère une couleur de la palette selon l'index
 * 
 * @param index - Index dans la palette
 * @returns Couleur hexadécimale
 */
export function getChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

