/**
 * Section Description du formulaire de ticket
 * 
 * Composant atomique pour respecter les principes Clean Code (< 100 lignes)
 */

'use client';

import { SimpleTextEditor } from '@/components/editors/simple-text-editor';
import type { CreateTicketInput } from '@/lib/validators/ticket';
import type { UseFormReturn } from 'react-hook-form';

type TicketDescriptionSectionProps = {
  form: UseFormReturn<CreateTicketInput>;
  isSubmitting?: boolean;
};

/**
 * Section pour saisir la description du ticket
 * 
 * @param form - Instance du formulaire React Hook Form
 * @param isSubmitting - État de soumission
 */
export function TicketDescriptionSection({
  form,
  isSubmitting = false
}: TicketDescriptionSectionProps) {
  const { errors } = form.formState;
  const description = form.watch('description');

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Description
      </label>
      <SimpleTextEditor
        value={description || ''}
        onChange={(value) => form.setValue('description', value, { shouldValidate: true })}
        placeholder="Détails fournis par le client"
        disabled={isSubmitting}
        minHeight={150}
      />
      {errors.description && (
        <p className="text-xs text-status-danger">{errors.description.message}</p>
      )}
    </div>
  );
}

