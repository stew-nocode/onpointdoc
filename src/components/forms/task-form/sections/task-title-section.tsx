/**
 * Section Titre du formulaire de tâche
 * 
 * Composant atomique pour respecter les principes Clean Code (< 100 lignes)
 * 
 * Pattern identique à ActivityTitleSection pour cohérence
 */

'use client';

import { INPUT_CLASS } from '@/lib/constants/form-styles';
import type { CreateTaskInput } from '@/lib/validators/task';
import type { UseFormReturn } from 'react-hook-form';

type TaskTitleSectionProps = {
  form: UseFormReturn<CreateTaskInput>;
};

/**
 * Section pour saisir le titre de la tâche
 * 
 * @param form - Instance du formulaire React Hook Form
 */
export function TaskTitleSection({ form }: TaskTitleSectionProps) {
  const { errors } = form.formState;

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Titre <span className="text-status-danger">*</span>
      </label>
      <input
        className={INPUT_CLASS}
        placeholder="Ex: Implémenter la fonctionnalité X"
        {...form.register('title')}
      />
      {errors.title && (
        <p className="text-xs text-status-danger">{errors.title.message}</p>
      )}
    </div>
  );
}
