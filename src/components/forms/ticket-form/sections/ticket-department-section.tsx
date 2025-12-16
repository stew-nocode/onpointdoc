/**
 * Section Départements du formulaire de ticket
 * 
 * Composant atomique pour respecter les principes Clean Code (< 100 lignes)
 */

'use client';

import { DepartmentMultiSelect, type BasicDepartment } from './department-multi-select';
import type { CreateTicketInput } from '@/lib/validators/ticket';
import type { UseFormReturn } from 'react-hook-form';

type TicketDepartmentSectionProps = {
  form: UseFormReturn<CreateTicketInput>;
  departments: BasicDepartment[];
  isSubmitting?: boolean;
};

/**
 * Section pour sélectionner les départements concernés (optionnel)
 * 
 * @param form - Instance du formulaire React Hook Form
 * @param departments - Liste des départements disponibles
 * @param isSubmitting - État de soumission
 */
export function TicketDepartmentSection({
  form,
  departments,
  isSubmitting = false
}: TicketDepartmentSectionProps) {
  const selectedDepartmentIds = form.watch('selectedDepartmentIds') || [];

  // ✅ Protection : vérifier que departments est défini avant d'accéder à .length
  if (!departments || departments.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Départements concernés
        <span className="ml-1 text-xs text-slate-500">(optionnel)</span>
      </label>
      <DepartmentMultiSelect
        departments={departments}
        selectedIds={selectedDepartmentIds}
        onSelectionChange={(ids) => form.setValue('selectedDepartmentIds', ids)}
        placeholder="Sélectionner des départements pour le suivi..."
        searchPlaceholder="Rechercher un département..."
        emptyText="Aucun département disponible"
        disabled={isSubmitting}
      />
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Les membres des départements sélectionnés pourront voir et suivre ce ticket.
      </p>
    </div>
  );
}

