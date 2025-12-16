/**
 * Section Description du formulaire de tâche
 * 
 * Composant atomique pour respecter les principes Clean Code (< 100 lignes)
 * Utilise un textarea simple pour la description (optionnel)
 * 
 * Best Practice Clean Code : Input simple plutôt que RichTextEditor pour rester léger
 */

'use client';

import { TEXTAREA_CLASS } from '@/lib/constants/form-styles';
import type { CreateTaskInput } from '@/lib/validators/task';
import type { UseFormReturn } from 'react-hook-form';

type TaskDescriptionSectionProps = {
  form: UseFormReturn<CreateTaskInput>;
};

/**
 * Section pour saisir la description de la tâche
 * 
 * @param form - Instance du formulaire React Hook Form
 */
export function TaskDescriptionSection({ form }: TaskDescriptionSectionProps) {
  const { errors } = form.formState;

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Description
      </label>
      <textarea
        className={TEXTAREA_CLASS}
        placeholder="Décrivez la tâche en détail..."
        rows={4}
        {...form.register('description')}
      />
      {errors.description && (
        <p className="text-xs text-status-danger">{errors.description.message}</p>
      )}
    </div>
  );
}
