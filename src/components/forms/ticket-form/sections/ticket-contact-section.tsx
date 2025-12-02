/**
 * Section Contact du formulaire de ticket
 * 
 * Composant atomique pour respecter les principes Clean Code (< 100 lignes)
 */

'use client';

import { useMemo } from 'react';
import { Plus } from 'lucide-react';
import { Combobox } from '@/ui/combobox';
import { Button } from '@/ui/button';
import { CreateContactDialog } from '@/components/contacts/create-contact-dialog';
import type { CreateTicketInput } from '@/lib/validators/ticket';
import type { UseFormReturn } from 'react-hook-form';
import type { BasicProfile } from '@/services/users';
import { formatContactLabel, getContactSearchableText } from '../utils/format-contact-label';

type TicketContactSectionProps = {
  form: UseFormReturn<CreateTicketInput>;
  contacts: BasicProfile[];
  isSubmitting?: boolean;
  onContactsRefresh?: () => void;
};

/**
 * Section pour sélectionner le contact
 * 
 * @param form - Instance du formulaire React Hook Form
 * @param contacts - Liste des contacts disponibles
 * @param isSubmitting - État de soumission
 * @param onContactsRefresh - Callback pour rafraîchir la liste des contacts après création
 */
export function TicketContactSection({
  form,
  contacts,
  isSubmitting = false,
  onContactsRefresh
}: TicketContactSectionProps) {
  const { errors } = form.formState;
  const channel = form.watch('channel');
  const contactUserId = form.watch('contactUserId');
  const companyId = form.watch('companyId');

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

  const handleContactCreated = (contactId: string) => {
    // Sélectionner automatiquement le contact créé
    form.setValue('contactUserId', contactId);
    // Rafraîchir la liste des contacts si callback fourni
    if (onContactsRefresh) {
      onContactsRefresh();
    }
  };

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Contact {isRequired && <span className="text-status-danger">*</span>}
        </label>
        {!isInternalReport && (
          <CreateContactDialog
            defaultCompanyId={companyId || undefined}
            onContactCreated={handleContactCreated}
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              disabled={isSubmitting}
            >
              <Plus className="mr-1 h-3 w-3" />
              Nouveau contact
            </Button>
          </CreateContactDialog>
        )}
      </div>
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

