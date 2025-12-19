/**
 * Section Durée du formulaire de ticket
 * 
 * Composant atomique pour respecter les principes Clean Code (< 100 lignes)
 */

'use client';

import { INPUT_CLASS } from '@/lib/constants/form-styles';
import type { CreateTicketInput } from '@/lib/validators/ticket';
import type { UseFormReturn } from 'react-hook-form';

type TicketDurationSectionProps = {
  form: UseFormReturn<CreateTicketInput>;
};

/**
 * Section pour saisir la durée de l'assistance en minutes
 * 
 * @param form - Instance du formulaire React Hook Form
 */
export function TicketDurationSection({ form }: TicketDurationSectionProps) {
  const { errors } = form.formState;

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-4">
        <label
          htmlFor="durationMinutes"
          className="text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Durée de l&apos;assistance (minutes)
        </label>
        <div className="flex items-center gap-2">
          <input
            id="durationMinutes"
            type="number"
            min={0}
            className={`${INPUT_CLASS} w-24`}
            placeholder="Ex: 45"
            {...form.register('durationMinutes', { valueAsNumber: true })}
          />
          <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
            min
          </span>
        </div>
      </div>
      {errors.durationMinutes && (
        <p className="text-xs text-status-danger">{errors.durationMinutes.message}</p>
      )}
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Obligatoire pour les tickets Assistance.
      </p>
    </div>
  );
}

