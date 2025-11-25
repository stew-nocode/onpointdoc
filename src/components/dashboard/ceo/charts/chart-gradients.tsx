/**
 * Définitions SVG pour les gradients des graphiques
 */

/**
 * Gradient pour l'Area Chart MTTR (Indigo → Violet → Indigo)
 */
export function MTTRAreaGradients() {
  return (
    <defs>
      <linearGradient id="mttrGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#6366F1" stopOpacity={0.5} />
        <stop offset="50%" stopColor="#8B5CF6" stopOpacity={0.25} />
        <stop offset="100%" stopColor="#6366F1" stopOpacity={0.05} />
      </linearGradient>
      <linearGradient id="mttrLineGradient" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#6366F1" />
        <stop offset="50%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#6366F1" />
      </linearGradient>
    </defs>
  );
}

