/**
 * Hook pour gérer l'auto-remplissage de la portée du ticket
 * 
 * Séparant la logique métier selon les principes Clean Code
 */

'use client';

import { useEffect } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { CreateTicketInput } from '@/lib/validators/ticket';

type UseTicketScopeAutoFillOptions = {
  form: UseFormReturn<CreateTicketInput>;
  contactCompanyId: string | null;
  contactUserId: string | undefined;
  scope: 'single' | 'all' | 'multiple' | undefined;
  companyId: string | undefined;
  channel: CreateTicketInput['channel'];
};

/**
 * Hook pour auto-remplir la portée et l'entreprise selon le contact sélectionné
 */
export function useTicketScopeAutoFill({
  form,
  contactCompanyId,
  contactUserId,
  scope,
  companyId,
  channel
}: UseTicketScopeAutoFillOptions) {
  useEffect(() => {
    if (channel === 'Constat Interne') {
      // Pas d'auto-remplissage pour constat interne
      return;
    }

    if (contactCompanyId && !scope && !companyId) {
      // Contact sélectionné avec entreprise → auto-remplir
      form.setValue('companyId', contactCompanyId);
      form.setValue('scope', 'single');
    }
  }, [contactCompanyId, contactUserId, scope, companyId, channel, form]);
}

