'use client';

/**
 * Composant générique pour afficher une cellule d'insight
 * 
 * Principe Clean Code :
 * - SRP : Affichage d'un insight avec valeur et tooltip
 * - Réutilisable pour tous les types d'insights
 */

import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip';

type CompanyInsightCellProps = {
  /**
   * Valeur à afficher (nombre ou texte formaté)
   */
  value: number | string;
  
  /**
   * Texte du tooltip
   */
  tooltip: string;
};

/**
 * Composant pour afficher une cellule d'insight dans le tableau des entreprises
 * 
 * @param props - Propriétés du composant
 */
export function CompanyInsightCell({
  value,
  tooltip
}: CompanyInsightCellProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="text-xs text-slate-600 dark:text-slate-300">
          {value}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}
