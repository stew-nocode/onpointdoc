/**
 * Section Type de Bug du formulaire de ticket
 * 
 * Composant atomique pour respecter les principes Clean Code (< 100 lignes)
 * Affiche uniquement si le type de ticket est BUG
 */

'use client';

import { useMemo } from 'react';
import { Combobox } from '@/ui/combobox';
import { BUG_TYPES } from '@/lib/constants/tickets';
import type { CreateTicketInput } from '@/lib/validators/ticket';
import type { UseFormReturn } from 'react-hook-form';

type TicketBugTypeSectionProps = {
  form: UseFormReturn<CreateTicketInput>;
};

/**
 * Section pour sélectionner le type de bug (conditionnel)
 * 
 * @param form - Instance du formulaire React Hook Form
 */
export function TicketBugTypeSection({ form }: TicketBugTypeSectionProps) {
  const { errors } = form.formState;
  const ticketType = form.watch('type');
  const bugType = form.watch('bug_type');

  // Mémoriser les options pour éviter les re-renders
  const bugTypeOptions = useMemo(
    () =>
      BUG_TYPES.map((type) => ({
        value: type,
        label: type,
        searchable: type
      })),
    []
  );

  if (ticketType !== 'BUG') {
    return null;
  }

  return (
    <div className="grid gap-2 min-w-0">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Type de bug <span className="text-status-danger">*</span>
      </label>
      <Combobox
        options={bugTypeOptions}
        value={bugType ?? ''}
        onValueChange={(v) => form.setValue('bug_type', v as CreateTicketInput['bug_type'])}
        placeholder="Sélectionner un type de bug"
        searchPlaceholder="Rechercher un type de bug..."
        emptyText="Aucun type de bug disponible"
      />
      {errors.bug_type && (
        <p className="text-xs text-status-danger">{errors.bug_type.message}</p>
      )}
    </div>
  );
}

