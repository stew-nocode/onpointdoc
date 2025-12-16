/**
 * Section Titre du formulaire d'activité
 * 
 * Composant atomique pour respecter les principes Clean Code (< 100 lignes)
 */

'use client';

import { INPUT_CLASS } from '@/lib/constants/form-styles';
import type { CreateActivityInput } from '@/lib/validators/activity';
import type { UseFormReturn } from 'react-hook-form';

type ActivityTitleSectionProps = {
  form: UseFormReturn<CreateActivityInput>;
};

/**
 * Section pour saisir le titre de l'activité
 * 
 * @param form - Instance du formulaire React Hook Form
 */
export function ActivityTitleSection({ form }: ActivityTitleSectionProps) {
  const { errors } = form.formState;

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Titre <span className="text-status-danger">*</span>
      </label>
      <input
        className={INPUT_CLASS}
        placeholder="Ex: Revue de process RH"
        {...form.register('title')}
      />
      {errors.title && (
        <p className="text-xs text-status-danger">{errors.title.message}</p>
      )}
    </div>
  );
}
