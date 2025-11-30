/**
 * Section Contact du formulaire de ticket
 * 
 * Composant atomique pour respecter les principes Clean Code (< 100 lignes)
 */

'use client';

import { useMemo } from 'react';
import { Combobox } from '@/ui/combobox';
import type { CreateTicketInput } from '@/lib/validators/ticket';
import type { UseFormReturn } from 'react-hook-form';
import type { BasicProfile } from '@/services/users';
import { formatContactLabel, getContactSearchableText } from '../utils/format-contact-label';

type TicketContactSectionProps = {
  form: UseFormReturn<CreateTicketInput>;
  contacts: BasicProfile[];
  isSubmitting?: boolean;
};

/**
 * Section pour sélectionner le contact
 * 
 * @param form - Instance du formulaire React Hook Form
 * @param contacts - Liste des contacts disponibles
 * @param isSubmitting - État de soumission
 */
export function TicketContactSection({
  form,
  contacts,
  isSubmitting = false
}: TicketContactSectionProps) {
  const { errors } = form.formState;
  const channel = form.watch('channel');
  const contactUserId = form.watch('contactUserId');

  const isInternalReport = channel === 'Constat Interne';
  const isRequired = !isInternalReport;

  // Mémoriser les options pour éviter les re-renders
  const contactOptions = useMemo(
    () =>
      contacts.map((c) => ({
        value: c.id,
        label: formatContactLabel(c),
        searchable: getContactSearchableText(c)
      })),
    [contacts]
  );

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Contact {isRequired && <span className="text-status-danger">*</span>}
      </label>
      <Combobox
        options={contactOptions}
        value={contactUserId || ''}
        onValueChange={(v) => form.setValue('contactUserId', v || '')}
        placeholder="Sélectionner un contact"
        searchPlaceholder="Rechercher un contact (nom, email ou entreprise)..."
        emptyText="Aucun contact disponible"
        disabled={!contacts.length || isInternalReport || isSubmitting}
      />
      {isInternalReport && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Le champ Contact n&apos;est pas disponible pour un constat interne. Sélectionnez la portée et l&apos;entreprise ci-dessous.
        </p>
      )}
      {!isInternalReport && errors.contactUserId && (
        <p className="text-xs text-status-danger">{errors.contactUserId.message}</p>
      )}
    </div>
  );
}

