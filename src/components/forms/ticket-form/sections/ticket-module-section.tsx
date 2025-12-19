/**
 * Section Module / Sous-module / Fonctionnalité du formulaire de ticket
 * 
 * Composant atomique pour respecter les principes Clean Code (< 100 lignes)
 */

'use client';

import { useMemo, useCallback } from 'react';
import { Combobox } from '@/ui/combobox';
import type { CreateTicketInput } from '@/lib/validators/ticket';
import type { UseFormReturn } from 'react-hook-form';
import type { Module, Submodule, Feature } from '@/services/products';

type TicketModuleSectionProps = {
  form: UseFormReturn<CreateTicketInput>;
  filteredModules: Module[];
  filteredSubmodules: Submodule[];
  filteredFeatures: Feature[];
  onModuleChange: (moduleId: string) => void;
};

/**
 * Section pour sélectionner le module, sous-module et fonctionnalité
 * 
 * @param form - Instance du formulaire React Hook Form
 * @param filteredModules - Modules filtrés selon le produit
 * @param filteredSubmodules - Sous-modules filtrés selon le module
 * @param filteredFeatures - Fonctionnalités filtrées selon le sous-module
 * @param onModuleChange - Callback appelé lors du changement de module
 */
export function TicketModuleSection({
  form,
  filteredModules,
  filteredSubmodules,
  filteredFeatures,
  onModuleChange
}: TicketModuleSectionProps) {
  const { errors } = form.formState;
  const moduleId = form.watch('moduleId');
  const submoduleId = form.watch('submoduleId');
  const featureId = form.watch('featureId');

  // Mémoriser les options pour éviter les re-renders
  const moduleOptions = useMemo(
    () => filteredModules.map((m) => ({ value: m.id, label: m.name })),
    [filteredModules]
  );

  const submoduleOptions = useMemo(
    () => filteredSubmodules.map((sm) => ({ value: sm.id, label: sm.name })),
    [filteredSubmodules]
  );

  const featureOptions = useMemo(
    () => filteredFeatures.map((f) => ({ value: f.id, label: f.name })),
    [filteredFeatures]
  );

  // Mémoriser les handlers pour éviter les re-renders
  const handleModuleChange = useCallback(
    (v: string) => {
      form.setValue('moduleId', v);
      onModuleChange(v);
      form.setValue('submoduleId', '');
      form.setValue('featureId', '');
    },
    [form, onModuleChange]
  );

  const handleSubmoduleChange = useCallback(
    (v: string) => {
      form.setValue('submoduleId', v);
      form.setValue('featureId', '');
    },
    [form]
  );

  const handleFeatureChange = useCallback(
    (v: string) => {
      form.setValue('featureId', v);
    },
    [form]
  );

  return (
    <div className="grid gap-2 min-w-0">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Module / Sous-module / Fonctionnalité
      </label>
      <div className="grid gap-2 md:grid-cols-3 w-full">
        <Combobox
          options={moduleOptions}
          value={moduleId}
          onValueChange={handleModuleChange}
          placeholder="Module"
          searchPlaceholder="Rechercher un module..."
          emptyText="Aucun module disponible"
          disabled={!filteredModules.length}
        />
        <Combobox
          options={submoduleOptions}
          value={submoduleId || ''}
          onValueChange={handleSubmoduleChange}
          placeholder="Sous-module"
          searchPlaceholder="Rechercher un sous-module..."
          emptyText="Aucun sous-module disponible"
          disabled={!filteredSubmodules.length}
        />
        <Combobox
          options={featureOptions}
          value={featureId || ''}
          onValueChange={handleFeatureChange}
          placeholder="Fonctionnalité"
          searchPlaceholder="Rechercher une fonctionnalité..."
          emptyText="Aucune fonctionnalité disponible"
          disabled={!submoduleId || !filteredFeatures.length}
        />
      </div>
      {errors.moduleId && (
        <p className="text-xs text-status-danger">{errors.moduleId.message}</p>
      )}
    </div>
  );
}

