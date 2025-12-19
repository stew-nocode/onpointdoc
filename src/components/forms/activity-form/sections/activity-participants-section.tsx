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

type ParticipantProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type ActivityParticipantsSectionProps = {
  form: UseFormReturn<CreateActivityInput>;
  participants: ParticipantProfile[];
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
          label: participant.full_name || participant.email || 'Sans nom',
          searchable: `${participant.full_name || ''} ${participant.email || ''}`.trim()
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
