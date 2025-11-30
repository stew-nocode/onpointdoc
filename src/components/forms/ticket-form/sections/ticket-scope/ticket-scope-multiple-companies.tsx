/**
 * Section pour sélectionner plusieurs entreprises
 * 
 * Composant atomique pour la portée "multiple"
 */

'use client';

import { CompanyMultiSelect } from '../company-multi-select';

type TicketScopeMultipleCompaniesProps = {
  companies: Array<{ id: string; name: string }>;
  selectedCompanyIds: string[];
  onSelectionChange: (ids: string[]) => void;
  preselectedId?: string;
};

/**
 * Section pour sélectionner plusieurs entreprises
 */
export function TicketScopeMultipleCompanies({
  companies,
  selectedCompanyIds,
  onSelectionChange,
  preselectedId
}: TicketScopeMultipleCompaniesProps) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Entreprises concernées <span className="text-status-danger">*</span>
        <span className="ml-2 text-xs font-normal text-slate-500">(minimum 2)</span>
      </label>
      <CompanyMultiSelect
        companies={companies}
        selectedIds={selectedCompanyIds}
        onSelectionChange={onSelectionChange}
        preselectedId={preselectedId}
      />
      {selectedCompanyIds.length > 0 && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          ✅ {selectedCompanyIds.length} entreprise(s) sélectionnée(s)
        </p>
      )}
    </div>
  );
}

