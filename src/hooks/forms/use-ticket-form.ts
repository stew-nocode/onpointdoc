/**
 * Hook personnalisé pour gérer la logique du formulaire de ticket
 * 
 * Séparant la logique métier de la présentation selon les principes Clean Code
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createTicketSchema,
  type CreateTicketInput,
} from '@/lib/validators/ticket';
import type { Product, Module, Submodule, Feature } from '@/services/products';
import type { BasicProfile } from '@/services/users';

type UseTicketFormOptions = {
  products: Product[];
  modules: Module[];
  submodules: Submodule[];
  features: Feature[];
  contacts: BasicProfile[];
  onSubmit: (values: CreateTicketInput, files?: File[]) => Promise<void | string>;
};

type UseTicketFormResult = {
  form: ReturnType<typeof useForm<CreateTicketInput>>;
  selectedProductId: string;
  selectedModuleId: string;
  filteredModules: Module[];
  filteredSubmodules: Submodule[];
  filteredFeatures: Feature[];
  handleSubmit: (files?: File[]) => Promise<void>;
  setSelectedProductId: (productId: string) => void;
  setSelectedModuleId: (moduleId: string) => void;
};

/**
 * Hook pour gérer la logique du formulaire de ticket
 * 
 * @param options - Options de configuration du formulaire
 * @returns État et handlers du formulaire
 * 
 * @example
 * const { form, filteredModules, handleSubmit } = useTicketForm({
 *   products,
 *   modules,
 *   submodules,
 *   features,
 *   contacts,
 *   onSubmit: async (values, files) => { ... }
 * });
 */
export function useTicketForm(options: UseTicketFormOptions): UseTicketFormResult {
  const { products, modules, submodules, features, contacts, onSubmit } = options;

  const form = useForm<CreateTicketInput>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'ASSISTANCE',
      channel: 'Whatsapp',
      productId: products[0]?.id ?? '',
      moduleId: modules[0]?.id ?? '',
      submoduleId: '',
      featureId: '',
      customerContext: '',
      priority: 'Medium',
      contactUserId: contacts[0]?.id ?? '',
      bug_type: null
    }
  });

  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id ?? '');
  const [selectedModuleId, setSelectedModuleId] = useState(modules[0]?.id ?? '');

  // Filtrer les modules selon le produit sélectionné
  const filteredModules = useMemo(
    () => modules.filter((module) => module.product_id === selectedProductId),
    [selectedProductId, modules]
  );

  // Filtrer les sous-modules selon le module sélectionné
  const filteredSubmodules = useMemo(
    () => submodules.filter((sm) => sm.module_id === selectedModuleId),
    [selectedModuleId, submodules]
  );

  // Filtrer les fonctionnalités selon le sous-module sélectionné
  const submoduleId = form.watch('submoduleId');
  const filteredFeatures = useMemo(
    () => features.filter(
      (f) => filteredSubmodules.some((sm) => sm.id === f.submodule_id) && f.submodule_id === submoduleId
    ),
    [features, filteredSubmodules, submoduleId]
  );

  // Pré-sélectionner le produit si un seul est disponible
  useEffect(() => {
    if (products.length === 1 && products[0]?.id) {
      const singleProductId = products[0].id;
      form.setValue('productId', singleProductId);
      setSelectedProductId(singleProductId);
    } else if (products.length > 0 && !form.getValues('productId')) {
      const firstProductId = products[0]?.id ?? '';
      form.setValue('productId', firstProductId);
      setSelectedProductId(firstProductId);
    }
  }, [products, form]);

  // Réinitialiser bug_type si le type change de BUG à autre chose
  const ticketType = form.watch('type');
  useEffect(() => {
    if (ticketType !== 'BUG') {
      form.setValue('bug_type', null);
    }
  }, [ticketType, form]);

  // Réinitialiser le module quand filteredModules change
  useEffect(() => {
    if (filteredModules.length > 0) {
      form.setValue('moduleId', filteredModules[0].id);
      setSelectedModuleId(filteredModules[0].id);
    } else {
      form.setValue('moduleId', '');
      setSelectedModuleId('');
    }
  }, [filteredModules, form]);

  // Handler de soumission
  const handleSubmit = form.handleSubmit(async (values: CreateTicketInput) => {
    await onSubmit(values, []);
    // Réinitialiser le formulaire après soumission
    form.reset({
      title: '',
      description: '',
      type: 'ASSISTANCE',
      channel: 'Whatsapp',
      productId: products[0]?.id ?? '',
      moduleId: modules[0]?.id ?? '',
      submoduleId: '',
      featureId: '',
      customerContext: '',
      priority: 'Medium',
      contactUserId: contacts[0]?.id ?? '',
      bug_type: null
    });
    setSelectedProductId(products[0]?.id ?? '');
    setSelectedModuleId(modules[0]?.id ?? '');
  });

  return {
    form,
    selectedProductId,
    selectedModuleId,
    filteredModules,
    filteredSubmodules,
    filteredFeatures,
    handleSubmit,
    setSelectedProductId,
    setSelectedModuleId
  };
}

