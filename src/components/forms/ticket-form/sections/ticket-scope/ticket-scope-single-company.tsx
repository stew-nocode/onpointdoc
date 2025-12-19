/**
 * Section pour sélectionner une seule entreprise
 * 
 * Composant atomique pour la portée "single"
 */

'use client';

import { useMemo } from 'react';
import { Combobox } from '@/ui/combobox';
import type { BasicCompany } from '@/services/companies';

type TicketScopeSingleCompanyProps = {
  companies: BasicCompany[];
  selectedCompanyId: string;
  onCompanyChange: (companyId: string) => void;
  contactCompanyId?: string | null;
  contactCompanyName?: string | null;
};

/**
 * Section pour sélectionner une seule entreprise
 */
export function TicketScopeSingleCompany({
  companies,
  selectedCompanyId,
  onCompanyChange,
  contactCompanyId,
  contactCompanyName
}: TicketScopeSingleCompanyProps) {
  // Mémoriser les options pour éviter les re-renders
  const companyOptions = useMemo(
    () =>
      companies.map((c) => ({
        value: c.id,
        label: c.name,
        searchable: c.name
      })),
    [companies]
  );

  const isAutoFilled = contactCompanyId && selectedCompanyId === contactCompanyId;

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Entreprise concernée <span className="text-status-danger">*</span>
      </label>
      <Combobox
        options={companyOptions}
        value={selectedCompanyId || ''}
        onValueChange={(v) => onCompanyChange(v || '')}
        placeholder="Sélectionner une entreprise"
        searchPlaceholder="Rechercher une entreprise..."
        emptyText="Aucune entreprise disponible"
      />
      {isAutoFilled && contactCompanyName && (
        <p className="text-xs text-green-600 dark:text-green-400">
          ✅ Entreprise déduite du contact : {contactCompanyName}
        </p>
      )}
    </div>
  );
}

