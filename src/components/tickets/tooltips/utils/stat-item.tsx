/**
 * Composant réutilisable pour afficher une ligne de statistique
 * 
 * Affiche :
 * - Label à gauche
 * - Valeur à droite avec suffixe optionnel
 */

type StatItemProps = {
  label: string;
  value: number | string;
  suffix?: string;
};

/**
 * Composant pour afficher une ligne de statistique
 * 
 * @param label - Libellé de la statistique
 * @param value - Valeur de la statistique
 * @param suffix - Suffixe optionnel (ex: "jours", "%")
 */
export function StatItem({ label, value, suffix }: StatItemProps) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-medium text-slate-900 dark:text-slate-100">
        {value}
        {suffix && ` ${suffix}`}
      </span>
    </div>
  );
}

