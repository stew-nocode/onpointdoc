/**
 * Section Titre du formulaire de ticket
 * 
 * Composant atomique pour respecter les principes Clean Code (< 100 lignes)
 */

'use client';

import { INPUT_CLASS } from '@/lib/constants/form-styles';
import type { CreateTicketInput } from '@/lib/validators/ticket';
import type { UseFormReturn } from 'react-hook-form';

type TicketTitleSectionProps = {
  form: UseFormReturn<CreateTicketInput>;
};

/**
 * Section pour saisir le titre du ticket
 * 
 * @param form - Instance du formulaire React Hook Form
 */
export function TicketTitleSection({ form }: TicketTitleSectionProps) {
  const { errors } = form.formState;

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Titre
      </label>
      <input
        className={INPUT_CLASS}
        placeholder="Résumé du besoin"
        {...form.register('title')}
      />
      {errors.title && (
        <p className="text-xs text-status-danger">{errors.title.message}</p>
      )}
    </div>
  );
}

