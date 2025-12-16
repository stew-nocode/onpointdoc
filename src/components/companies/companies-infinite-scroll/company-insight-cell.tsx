'use client';

/**
 * Composant générique pour afficher une cellule d'insight
 * 
 * Principe Clean Code :
 * - SRP : Affichage d'un insight avec icône, valeur et tooltip
 * - Réutilisable pour tous les types d'insights
 */

import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip';
import { Badge } from '@/ui/badge';

type CompanyInsightCellProps = {
  /**
   * Icône à afficher (React node)
   */
  icon: React.ReactNode;
  
  /**
   * Valeur à afficher (nombre ou texte formaté)
   */
  value: number | string;
  
  /**
   * Texte du tooltip
   */
  tooltip: string;
  
  /**
   * Variante de badge pour le style
   */
  variant?: 'default' | 'secondary' | 'danger' | 'success' | 'info';
};

/**
 * Composant pour afficher une cellule d'insight dans le tableau des entreprises
 * 
 * @param props - Propriétés du composant
 */
export function CompanyInsightCell({
  icon,
  value,
  tooltip,
  variant = 'default'
}: CompanyInsightCellProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1.5">
          {icon}
          <Badge variant={variant} className="text-[10px] px-1.5 py-0.5">
            {value}
          </Badge>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}
