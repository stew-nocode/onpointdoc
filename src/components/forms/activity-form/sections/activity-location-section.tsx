/**
 * Section Mode de localisation du formulaire d'activité
 * 
 * Composant atomique pour respecter les principes Clean Code (< 100 lignes)
 */

'use client';

import { memo } from 'react';
import { useWatch } from 'react-hook-form';
import { Combobox } from '@/ui/combobox';
import { activityLocationModes } from '@/lib/validators/activity';
import type { CreateActivityInput } from '@/lib/validators/activity';
import type { UseFormReturn } from 'react-hook-form';

type ActivityLocationSectionProps = {
  form: UseFormReturn<CreateActivityInput>;
};

/**
 * Section pour sélectionner le mode de localisation (présentiel ou en ligne)
 * 
 * Optimisé avec React.memo pour éviter les re-renders inutiles
 * 
 * @param form - Instance du formulaire React Hook Form
 */
export const ActivityLocationSection = memo(function ActivityLocationSection({ form }: ActivityLocationSectionProps) {
  // Destructurer formState pour activer les optimisations Proxy
  const { errors } = form.formState;
  
  // Utiliser useWatch pour optimiser les re-renders (isole les re-renders au niveau du hook)
  const locationMode = useWatch({
    control: form.control,
    name: 'locationMode'
  });

  // Mapper les valeurs de l'enum vers des labels plus lisibles
  const locationOptions = activityLocationModes.map((mode) => ({
    value: mode,
    label: mode === 'Presentiel' ? 'Présentiel' : 'En ligne',
    searchable: mode === 'Presentiel' ? 'présentiel' : 'en ligne'
  }));

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Mode de localisation
      </label>
      <Combobox
        options={locationOptions}
        value={locationMode || ''}
        onValueChange={(v) => form.setValue('locationMode', v ? (v as CreateActivityInput['locationMode']) : undefined)}
        placeholder="Sélectionner un mode (optionnel)"
        searchPlaceholder="Rechercher un mode..."
        emptyText="Aucun mode disponible"
      />
      {errors.locationMode && (
        <p className="text-xs text-status-danger">{errors.locationMode.message}</p>
      )}
    </div>
  );
});








