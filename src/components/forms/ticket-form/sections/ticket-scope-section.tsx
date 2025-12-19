/**
 * Section Portée du Ticket
 * 
 * Orchestrateur des sous-composants atomiques
 * Respecte les principes Clean Code (< 100 lignes)
 */

'use client';

import { useMemo } from 'react';
import type { CreateTicketInput } from '@/lib/validators/ticket';
import type { UseFormReturn } from 'react-hook-form';
import type { BasicCompany } from '@/services/companies';
import type { BasicProfile } from '@/services/users';
import {
  TicketScopeSelector,
  TicketScopeSingleCompany,
  TicketScopeAllCompanies,
  TicketScopeMultipleCompanies,
  useTicketScopeAutoFill,
  useTicketScopeChange
} from './ticket-scope';

type TicketScopeSectionProps = {
  form: UseFormReturn<CreateTicketInput>;
  contacts: BasicProfile[];
  companies: BasicCompany[];
  selectedContactId?: string;
  channel: CreateTicketInput['channel'];
};

/**
 * Section pour sélectionner la portée du ticket et les entreprises concernées
 * 
 * Orchestrateur des sous-composants atomiques
 */
export function TicketScopeSection({
  form,
  contacts,
  companies,
  selectedContactId,
  channel
}: TicketScopeSectionProps) {
  const scope = form.watch('scope');
  const companyId = form.watch('companyId');
  const selectedCompanyIds = form.watch('selectedCompanyIds') || [];

  // Trouver le contact sélectionné pour récupérer son entreprise
  const selectedContact = useMemo(() => {
    if (!selectedContactId) return null;
    return contacts.find((c) => c.id === selectedContactId) || null;
  }, [contacts, selectedContactId]);

  const contactCompanyId = selectedContact?.company_id || null;
  const contactCompanyName = selectedContact?.company_name || null;

  // Auto-remplissage via hook
  useTicketScopeAutoFill({
    form,
    contactCompanyId,
    contactUserId: selectedContactId,
    scope,
    companyId,
    channel
  });

  // Gérer le changement de portée via hook
  const { handleScopeChange } = useTicketScopeChange({
    form,
    contactCompanyId,
    companyId
  });

  const isScopeRequired = channel === 'Constat Interne';
  const effectiveScope = scope || (isScopeRequired ? 'single' : undefined);

  return (
    <div className="grid gap-3">
      <TicketScopeSelector
        value={effectiveScope}
        onValueChange={handleScopeChange}
        isRequired={isScopeRequired}
      />

      {effectiveScope === 'single' && (
        <TicketScopeSingleCompany
          companies={companies}
          selectedCompanyId={companyId || ''}
          onCompanyChange={(v) => form.setValue('companyId', v)}
          contactCompanyId={contactCompanyId}
          contactCompanyName={contactCompanyName}
        />
      )}

      {effectiveScope === 'all' && (
        <TicketScopeAllCompanies
          contactUserId={selectedContactId}
          contactCompanyName={contactCompanyName}
          contacts={contacts}
        />
      )}

      {effectiveScope === 'multiple' && (
        <TicketScopeMultipleCompanies
          companies={companies}
          selectedCompanyIds={selectedCompanyIds}
          onSelectionChange={(ids) => form.setValue('selectedCompanyIds', ids)}
          preselectedId={contactCompanyId || undefined}
        />
      )}
    </div>
  );
}
