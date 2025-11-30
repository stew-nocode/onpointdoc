/**
 * Hook pour gérer le changement de portée du ticket
 * 
 * Séparant la logique métier selon les principes Clean Code
 */

'use client';

import { useCallback } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { CreateTicketInput } from '@/lib/validators/ticket';

type UseTicketScopeChangeOptions = {
  form: UseFormReturn<CreateTicketInput>;
  contactCompanyId: string | null;
  companyId: string | undefined;
};

/**
 * Hook pour gérer le changement de portée
 */
export function useTicketScopeChange({
  form,
  contactCompanyId,
  companyId
}: UseTicketScopeChangeOptions) {
  const handleScopeChange = useCallback(
    (newScope: 'single' | 'all' | 'multiple') => {
      form.setValue('scope', newScope);

      if (newScope === 'all') {
        form.setValue('affectsAllCompanies', true);
        form.setValue('companyId', '');
        form.setValue('selectedCompanyIds', []);
      } else if (newScope === 'single') {
        form.setValue('affectsAllCompanies', false);
        form.setValue('selectedCompanyIds', []);

        if (contactCompanyId && !companyId) {
          form.setValue('companyId', contactCompanyId);
        }
      } else if (newScope === 'multiple') {
        form.setValue('affectsAllCompanies', false);
        form.setValue('companyId', '');

        const currentSelected = form.getValues('selectedCompanyIds') || [];
        if (contactCompanyId && !currentSelected.includes(contactCompanyId)) {
          form.setValue('selectedCompanyIds', [contactCompanyId, ...currentSelected]);
        }
      }
    },
    [form, contactCompanyId, companyId]
  );

  return { handleScopeChange };
}

