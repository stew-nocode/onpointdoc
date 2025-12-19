/**
 * Section Statut du formulaire de ticket
 * 
 * Composant atomique pour respecter les principes Clean Code (< 100 lignes)
 * Affiche uniquement pour les tickets ASSISTANCE en mode édition
 */

'use client';

import { useMemo } from 'react';
import { Combobox } from '@/ui/combobox';
import { ASSISTANCE_LOCAL_STATUSES } from '@/lib/constants/tickets';
import type { CreateTicketInput } from '@/lib/validators/ticket';
import type { UseFormReturn } from 'react-hook-form';

type TicketStatusSectionProps = {
  form: UseFormReturn<CreateTicketInput>;
  mode: 'create' | 'edit';
};

/**
 * Section pour sélectionner le statut (conditionnel)
 * 
 * @param form - Instance du formulaire React Hook Form
 * @param mode - Mode du formulaire (création ou édition)
 */
export function TicketStatusSection({ form, mode }: TicketStatusSectionProps) {
  const { errors } = form.formState;
  const ticketType = form.watch('type');
  const status = form.watch('status');

  // Mémoriser les options pour éviter les re-renders
  const statusOptions = useMemo(
    () =>
      ASSISTANCE_LOCAL_STATUSES.map((status) => ({
        value: status,
        label: status.replace('_', ' '),
        searchable: status
      })),
    []
  );

  // Afficher uniquement pour ASSISTANCE en mode édition
  if (mode !== 'edit' || ticketType !== 'ASSISTANCE') {
    return null;
  }

  return (
    <div className="grid gap-2 min-w-0">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Statut
      </label>
      <Combobox
        options={statusOptions}
        value={status ?? ''}
        onValueChange={(v) => form.setValue('status', v as CreateTicketInput['status'])}
        placeholder="Sélectionner un statut"
        searchPlaceholder="Rechercher un statut..."
        emptyText="Aucun statut disponible"
      />
      {errors.status && (
        <p className="text-xs text-status-danger">{errors.status.message}</p>
      )}
    </div>
  );
}

