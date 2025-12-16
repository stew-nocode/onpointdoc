/**
 * Section Type d'activité du formulaire
 * 
 * Composant atomique pour respecter les principes Clean Code (< 100 lignes)
 */

'use client';

import { memo } from 'react';
import { useWatch } from 'react-hook-form';
import { Combobox } from '@/ui/combobox';
import { activityTypes } from '@/lib/validators/activity';
import type { CreateActivityInput } from '@/lib/validators/activity';
import type { UseFormReturn } from 'react-hook-form';

type ActivityTypeSectionProps = {
  form: UseFormReturn<CreateActivityInput>;
};

/**
 * Section pour sélectionner le type d'activité
 * 
 * Optimisé avec React.memo pour éviter les re-renders inutiles
 * 
 * @param form - Instance du formulaire React Hook Form
 */
export const ActivityTypeSection = memo(function ActivityTypeSection({ form }: ActivityTypeSectionProps) {
  // Destructurer formState pour activer les optimisations Proxy
  const { errors } = form.formState;
  
  // Utiliser useWatch pour optimiser les re-renders (isole les re-renders au niveau du hook)
  const activityType = useWatch({
    control: form.control,
    name: 'activityType',
    defaultValue: 'Revue'
  });

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Type d'activité <span className="text-status-danger">*</span>
      </label>
      <Combobox
        options={activityTypes.map((type) => ({
          value: type,
          label: type,
          searchable: type
        }))}
        value={activityType}
        onValueChange={(v) => form.setValue('activityType', v as CreateActivityInput['activityType'])}
        placeholder="Sélectionner un type"
        searchPlaceholder="Rechercher un type..."
        emptyText="Aucun type disponible"
      />
      {errors.activityType && (
        <p className="text-xs text-status-danger">{errors.activityType.message}</p>
      )}
    </div>
  );
});
