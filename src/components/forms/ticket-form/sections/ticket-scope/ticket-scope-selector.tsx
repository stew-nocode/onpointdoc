/**
 * Sélecteur de portée du ticket
 * 
 * Composant atomique pour choisir entre single/all/multiple
 */

'use client';

import { RadioGroup, RadioCard } from '@/ui/radio-group';
import { Building2, Globe, Briefcase } from 'lucide-react';

type TicketScopeSelectorProps = {
  value: 'single' | 'all' | 'multiple' | undefined;
  onValueChange: (value: 'single' | 'all' | 'multiple') => void;
  isRequired?: boolean;
};

/**
 * Sélecteur de portée du ticket
 */
export function TicketScopeSelector({
  value,
  onValueChange,
  isRequired = false
}: TicketScopeSelectorProps) {
  // ✅ Fix : Toujours passer une valeur définie pour éviter le warning "uncontrolled to controlled"
  // Si value est undefined, utiliser une chaîne vide pour rester en mode controlled
  const controlledValue = value || '';

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Portée du ticket {isRequired && <span className="text-status-danger">*</span>}
      </label>
      <RadioGroup
        value={controlledValue}
        onValueChange={(v) => {
          // Ignorer les changements vers une valeur vide
          if (v) {
            onValueChange(v as 'single' | 'all' | 'multiple');
          }
        }}
        className="grid grid-cols-3 gap-2 w-full"
      >
        <RadioCard
          variant="compact"
          value="single"
          label="Une seule entreprise"
          icon={<Building2 className="h-3 w-3" />}
        />
        <RadioCard
          variant="compact"
          value="all"
          label="Toutes les entreprises"
          icon={<Globe className="h-3 w-3" />}
        />
        <RadioCard
          variant="compact"
          value="multiple"
          label="Plusieurs entreprises"
          icon={<Briefcase className="h-3 w-3" />}
        />
      </RadioGroup>
    </div>
  );
}

