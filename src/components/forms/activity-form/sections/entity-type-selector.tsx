/**
 * Sélecteur de type d'entité liable
 * 
 * Composant atomique pour respecter les principes Clean Code (< 100 lignes)
 */

'use client';

import { RadioGroup, RadioCard } from '@/ui/radio-group';
import { CheckSquare, Bug, HelpCircle, FileText, MessageSquare } from 'lucide-react';
import type { LinkableEntityType } from '@/types/activity-links';

type EntityTypeSelectorProps = {
  value: LinkableEntityType | null;
  onValueChange: (value: LinkableEntityType | null) => void;
};

/**
 * Sélecteur pour choisir le type d'entité à lier à l'activité
 * 
 * @param value - Type d'entité sélectionné
 * @param onValueChange - Callback appelé quand le type change
 */
export function EntityTypeSelector({ value, onValueChange }: EntityTypeSelectorProps) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Lier à
      </label>
      <RadioGroup
        value={value || ''}
        onValueChange={(v) => onValueChange(v ? (v as LinkableEntityType) : null)}
        className="grid grid-cols-2 sm:grid-cols-5 gap-2 w-full"
      >
        <RadioCard
          variant="compact"
          value="task"
          label="Tâche"
          icon={<CheckSquare className="h-3 w-3" />}
        />
        <RadioCard
          variant="compact"
          value="bug"
          label="Bug"
          icon={<Bug className="h-3 w-3" />}
        />
        <RadioCard
          variant="compact"
          value="assistance"
          label="Assistance"
          icon={<HelpCircle className="h-3 w-3" />}
        />
        <RadioCard
          variant="compact"
          value="request"
          label="Requête"
          icon={<FileText className="h-3 w-3" />}
        />
        <RadioCard
          variant="compact"
          value="followup"
          label="Relance"
          icon={<MessageSquare className="h-3 w-3" />}
        />
      </RadioGroup>
    </div>
  );
}
