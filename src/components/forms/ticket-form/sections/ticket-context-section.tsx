/**
 * Section Contexte Client du formulaire de ticket
 * 
 * Composant atomique pour respecter les principes Clean Code (< 100 lignes)
 */

'use client';

import { INPUT_CLASS } from '@/lib/constants/form-styles';
import type { CreateTicketInput } from '@/lib/validators/ticket';
import type { UseFormReturn } from 'react-hook-form';

type TicketContextSectionProps = {
  form: UseFormReturn<CreateTicketInput>;
};

/**
 * Section pour saisir le contexte client
 * 
 * @param form - Instance du formulaire React Hook Form
 */
export function TicketContextSection({ form }: TicketContextSectionProps) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Contexte client
      </label>
      <textarea
        rows={3}
        className={INPUT_CLASS}
        placeholder="Entreprise, point focal, environnement, relance..."
        {...form.register('customerContext')}
      />
    </div>
  );
}

