/**
 * Section Assigné du formulaire de tâche
 * 
 * Composant atomique pour respecter les principes Clean Code (< 100 lignes)
 * Utilise un Combobox pour sélectionner un seul utilisateur (vs MultiSelect pour participants)
 * 
 * Pattern similaire à ActivityParticipantsSection mais avec sélection unique
 */

'use client';

import { useWatch } from 'react-hook-form';
import { Combobox } from '@/ui/combobox';
import type { CreateTaskInput } from '@/lib/validators/task';
import type { UseFormReturn } from 'react-hook-form';
import type { BasicProfile } from '@/services/users';

type TaskAssignedSectionProps = {
  form: UseFormReturn<CreateTaskInput>;
  profiles: BasicProfile[];
};

/**
 * Section pour assigner la tâche à un utilisateur
 * 
 * @param form - Instance du formulaire React Hook Form
 * @param profiles - Liste des utilisateurs disponibles
 */
export function TaskAssignedSection({ form, profiles }: TaskAssignedSectionProps) {
  // Utiliser useWatch pour optimiser les re-renders (isole les re-renders au niveau du hook)
  const assignedTo = useWatch({
    control: form.control,
    name: 'assignedTo'
  });

  // Formater les options pour le Combobox
  const options = profiles.map((profile) => {
    const displayName = profile.company_name 
      ? `${profile.full_name} (${profile.company_name})`
      : profile.full_name;
    
    return {
      value: profile.id,
      label: displayName,
      searchable: `${profile.full_name} ${profile.email} ${profile.company_name || ''}`.trim()
    };
  });

  // Gérer le changement de sélection
  const handleValueChange = (value: string) => {
    form.setValue('assignedTo', value || undefined);
  };

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Assigné à
      </label>
      <Combobox
        options={options}
        value={assignedTo || ''}
        onValueChange={handleValueChange}
        placeholder="Sélectionner un utilisateur..."
        searchPlaceholder="Rechercher un utilisateur..."
        emptyText="Aucun utilisateur disponible"
      />
    </div>
  );
}
