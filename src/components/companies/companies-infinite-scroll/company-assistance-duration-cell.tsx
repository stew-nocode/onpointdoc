'use client';

/**
 * Composant spécifique pour afficher la durée d'assistance cumulée
 * 
 * Principe Clean Code :
 * - SRP : Affichage de la durée d'assistance formatée
 * - Utilise formatAssistanceDuration pour le formatage
 */

import { Clock } from 'lucide-react';
import { formatAssistanceDuration } from '../utils/format-assistance-duration';
import { CompanyInsightCell } from './company-insight-cell';

type CompanyAssistanceDurationCellProps = {
  /**
   * Durée en minutes
   */
  durationMinutes: number;
};

/**
 * Composant pour afficher la durée d'assistance cumulée
 * 
 * @param props - Propriétés du composant
 */
export function CompanyAssistanceDurationCell({
  durationMinutes
}: CompanyAssistanceDurationCellProps) {
  const formatted = formatAssistanceDuration(durationMinutes);
  const tooltip = durationMinutes === 0 
    ? "Aucune assistance enregistrée"
    : `${durationMinutes} minutes d'assistance cumulée (${formatted})`;
  
  return (
    <CompanyInsightCell
      icon={<Clock className="h-3.5 w-3.5 text-slate-500" />}
      value={durationMinutes === 0 ? "-" : formatted}
      tooltip={tooltip}
      variant={durationMinutes > 0 ? 'info' : 'default'}
    />
  );
}
