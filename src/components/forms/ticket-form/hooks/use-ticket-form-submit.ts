/**
 * Hook pour gérer la soumission du formulaire de ticket
 * 
 * Séparant la logique de soumission selon les principes Clean Code
 */

'use client';

import { useCallback } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { CreateTicketInput } from '@/lib/validators/ticket';
import type { Product } from '@/services/products';
import type { BasicProfile } from '@/services/users';
import { getDefaultFormValues } from '../utils/reset-form';

type UseTicketFormSubmitOptions = {
  form: UseFormReturn<CreateTicketInput>;
  products: Product[];
  contacts: BasicProfile[];
  modules: { id: string }[];
  mode: 'create' | 'edit';
  onSubmit: (values: CreateTicketInput, files?: File[]) => Promise<void | string>;
  onSubmitAndContinue?: (values: CreateTicketInput, files?: File[]) => Promise<void | string>;
  files: File[];
  clearFiles: () => void;
  setSelectedProductId: (id: string) => void;
  setSelectedModuleId: (id: string) => void;
};

type UseTicketFormSubmitResult = {
  handleSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  handleSubmitAndContinue: () => Promise<void>;
  resetFormAfterSubmit: () => void;
};

/**
 * Hook pour gérer la soumission du formulaire
 */
export function useTicketFormSubmit({
  form,
  products,
  contacts,
  modules,
  mode,
  onSubmit,
  onSubmitAndContinue,
  files,
  clearFiles,
  setSelectedProductId,
  setSelectedModuleId
}: UseTicketFormSubmitOptions): UseTicketFormSubmitResult {
  /**
   * Réinitialise le formulaire après soumission
   */
  const resetFormAfterSubmit = useCallback(() => {
    const defaultValues = getDefaultFormValues(products, contacts);
    form.reset({
      ...defaultValues,
      moduleId: modules[0]?.id ?? ''
    });
    setSelectedProductId(defaultValues.productId ?? '');
    setSelectedModuleId(modules[0]?.id ?? '');
  }, [products, contacts, modules, form, setSelectedProductId, setSelectedModuleId]);

  /**
   * Handler de soumission (ferme le dialog)
   */
  const handleSubmit = form.handleSubmit(async (values: CreateTicketInput) => {
    await onSubmit(values, files);
    clearFiles();
    if (mode === 'create') {
      resetFormAfterSubmit();
    }
  });

  /**
   * Handler de soumission avec continuation (garde le dialog ouvert)
   */
  const handleSubmitAndContinue = form.handleSubmit(async (values: CreateTicketInput) => {
    if (onSubmitAndContinue) {
      await onSubmitAndContinue(values, files);
    } else {
      await onSubmit(values, files);
    }
    clearFiles();
    if (mode === 'create') {
      resetFormAfterSubmit();
    }
  });

  return {
    handleSubmit,
    handleSubmitAndContinue,
    resetFormAfterSubmit
  };
}

