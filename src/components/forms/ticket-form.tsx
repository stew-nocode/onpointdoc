'use client';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createTicketSchema,
  type CreateTicketInput,
  ticketChannels,
  ticketTypes
} from '@/lib/validators/ticket';
import type { Product, Module } from '@/services/products';
import { Button } from '@/ui/button';

type TicketFormProps = {
  onSubmit: (values: CreateTicketInput) => Promise<void>;
  isSubmitting?: boolean;
  products: Product[];
  modules: Module[];
};

export const TicketForm = ({ onSubmit, isSubmitting, products, modules }: TicketFormProps) => {
  const form = useForm<CreateTicketInput>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'ASSISTANCE',
      channel: 'Whatsapp',
      productId: products[0]?.id ?? '',
      moduleId: modules[0]?.id ?? '',
      customerContext: '',
      priority: 'Medium'
    }
  });
  const { errors } = form.formState;
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id ?? '');
  const filteredModules = useMemo(
    () => modules.filter((module) => module.product_id === selectedProductId),
    [selectedProductId, modules]
  );
  const inputClass =
    'rounded-lg border border-slate-200 px-3 py-2 text-sm focus-visible:outline-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500';

  useEffect(() => {
    if (filteredModules.length > 0) {
      form.setValue('moduleId', filteredModules[0].id);
    } else {
      form.setValue('moduleId', '');
    }
  }, [filteredModules, form]);

  const productField = form.register('productId');

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
    form.reset({
      title: '',
      description: '',
      type: 'ASSISTANCE',
      channel: 'Whatsapp',
      productId: products[0]?.id ?? '',
      moduleId: modules[0]?.id ?? '',
      customerContext: '',
      priority: 'Medium'
    });
    setSelectedProductId(products[0]?.id ?? '');
  });

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <label className="text-sm font-medium text-slate-700">Titre</label>
        <input className={inputClass} placeholder="Résumé du besoin" {...form.register('title')} />
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-medium text-slate-700">Description</label>
        <textarea
          rows={4}
          className={inputClass}
          placeholder="Détails fournis par le client"
          {...form.register('description')}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-700">Type</label>
          <select className={inputClass} {...form.register('type')}>
            {ticketTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-700">Canal</label>
          <select className={inputClass} {...form.register('channel')}>
            {ticketChannels.map((channel) => (
              <option key={channel} value={channel}>
                {channel}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-700">Produit concerné</label>
          <select
            className={inputClass}
            {...productField}
            onChange={(event) => {
              productField.onChange(event);
              setSelectedProductId(event.target.value);
            }}
          >
            {products.length === 0 && <option value="">Aucun produit disponible</option>}
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
          {errors.productId && (
            <p className="text-xs text-status-danger">{errors.productId.message}</p>
          )}
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-700">Module impacté</label>
          <select
            className={inputClass}
            {...form.register('moduleId')}
            disabled={!filteredModules.length}
          >
            {filteredModules.length === 0 && <option value="">Aucun module disponible</option>}
            {filteredModules.map((module) => (
              <option key={module.id} value={module.id}>
                {module.name}
              </option>
            ))}
          </select>
          {errors.moduleId && (
            <p className="text-xs text-status-danger">{errors.moduleId.message}</p>
          )}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-700">Priorité</label>
          <select className={inputClass} {...form.register('priority')}>
            {['Low', 'Medium', 'High', 'Critical'].map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-700">
            Durée de l’assistance (minutes)
          </label>
          <input
            type="number"
            min={0}
            className={inputClass}
            placeholder="Ex: 45"
            {...form.register('durationMinutes', { valueAsNumber: true })}
          />
          <p className="text-xs text-slate-500">
            Obligatoire pour les tickets Assistance afin d’alimenter les KPIs Support.
          </p>
        </div>
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-medium text-slate-700">Contexte client</label>
        <textarea
          rows={3}
          className={inputClass}
          placeholder="Entreprise, point focal, environnement, relance..."
          {...form.register('customerContext')}
        />
      </div>
      <Button className="w-full" disabled={isSubmitting} type="submit">
        Enregistrer le ticket
      </Button>
    </form>
  );
};

