/**
 * Composant UI réutilisable pour les cartes de planning
 * 
 * Layout standardisé :
 * - Icône de distinction à gauche
 * - Titre en haut sur une ligne
 * - Statut et personne en charge en bas
 * - Menu contextuel (roue) à droite
 * 
 * Principe Clean Code :
 * - Composant réutilisable et modulaire
 * - Props typées explicitement
 * - Présentation uniquement (pas de logique métier)
 */

'use client';

import { ReactNode } from 'react';
import { Card } from '@/ui/card';

type PlanningItemCardProps = {
  /** Icône de distinction à afficher à gauche */
  icon: ReactNode;
  /** Titre à afficher en haut */
  title: string;
  /** Contenu du bas (statut, personne en charge, etc.) */
  bottomContent: ReactNode;
  /** Menu contextuel à afficher à droite (optionnel) */
  menu?: ReactNode;
  /** Actions supplémentaires à droite après le menu (optionnel) */
  actions?: ReactNode;
  /** Classes CSS supplémentaires pour la carte */
  className?: string;
  /** Handler de clic sur la carte (optionnel) */
  onClick?: () => void;
};

/**
 * Carte standardisée pour les items de planning (tâches/activités)
 * 
 * Layout :
 * ```
 * [Icône] | [Titre]                    | [Menu]
 *         | [Statut + Personne]        |
 * ```
 */
export function PlanningItemCard({
  icon,
  title,
  bottomContent,
  menu,
  actions,
  className,
  onClick
}: PlanningItemCardProps) {
  return (
    <Card
      className={`p-3 transition-shadow hover:shadow-md border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 ${className || ''}`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Icône à gauche */}
        <div className="flex-shrink-0 mt-0.5">
          {icon}
        </div>

        {/* Contenu principal - prend l'espace disponible */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          {/* Titre en haut sur une ligne */}
          <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate leading-tight">
            {title}
          </h3>

          {/* Statut et personne en charge en bas */}
          <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600 dark:text-slate-400">
            {bottomContent}
          </div>
        </div>

        {/* Actions et menu à droite */}
        <div className="flex items-start gap-2 flex-shrink-0">
          {actions}
          {menu}
        </div>
      </div>
    </Card>
  );
}



