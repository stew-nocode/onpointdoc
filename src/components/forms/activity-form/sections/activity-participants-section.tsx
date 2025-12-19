/**
 * Section Participants du formulaire d'activité
 * 
 * Composant atomique pour respecter les principes Clean Code (< 100 lignes)
 */

'use client';

import { useWatch } from 'react-hook-form';
import { MultiSelect } from '@/ui/multi-select';
import type { CreateActivityInput } from '@/lib/validators/activity';
import type { UseFormReturn } from 'react-hook-form';
import type { BasicProfile } from '@/services/users';

type ActivityParticipantsSectionProps = {
  form: UseFormReturn<CreateActivityInput>;
  participants: BasicProfile[];
};

/**
 * Section pour sélectionner les participants de l'activité
 * 
 * @param form - Instance du formulaire React Hook Form
 * @param participants - Liste des utilisateurs disponibles
 */
export function ActivityParticipantsSection({ form, participants }: ActivityParticipantsSectionProps) {
  // Utiliser useWatch pour optimiser les re-renders (isole les re-renders au niveau du hook)
  const selectedParticipantIds = useWatch({
    control: form.control,
    name: 'participantIds',
    defaultValue: []
  }) || [];

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Participants
      </label>
      <MultiSelect
        options={participants.map((participant) => ({
          value: participant.id,
          label: participant.company_name 
            ? `${participant.full_name || 'Sans nom'} (${participant.company_name})`
            : participant.full_name || 'Sans nom',
          searchable: `${participant.full_name || ''} ${participant.email || ''} ${participant.company_name || ''}`.trim()
        }))}
        value={selectedParticipantIds}
        onValueChange={(ids) => form.setValue('participantIds', ids)}
        placeholder="Sélectionner des participants"
        searchPlaceholder="Rechercher un participant..."
        emptyText="Aucun participant disponible"
      />
    </div>
  );
}
