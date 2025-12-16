/**
 * Formulaire de création d'activité
 * 
 * Composant principal : orchestration des sections atomiques
 * Respecte les principes Clean Code (< 100 lignes)
 */

'use client';

import { useCallback } from 'react';
import type { CreateActivityInput } from '@/lib/validators/activity';
import type { BasicProfile } from '@/services/users';
import { useActivityForm } from '@/hooks/forms/use-activity-form';
import {
  ActivityTitleSection,
  ActivityTypeSection,
  ActivityDatesSection,
  ActivityParticipantsSection,
  ActivityTicketsSection,
  ActivityLocationSection,
  ActivityReportSection,
  ActivitySubmitButtons,
} from './activity-form/sections';

type ActivityFormProps = {
  onSubmit: (values: CreateActivityInput) => Promise<void | string>;
  onSubmitAndContinue?: (values: CreateActivityInput) => Promise<void | string>;
  isSubmitting?: boolean;
  participants: BasicProfile[];
  initialValues?: Partial<CreateActivityInput>;
  /**
   * Si true, masque la section de sélection des tickets liés
   * Utile quand les tickets sont pré-remplis (ex: création depuis un ticket)
   */
  hideTicketsSection?: boolean;
};

/**
 * Formulaire de création d'activité
 * 
 * Orchestrateur des sections atomiques selon les principes Clean Code
 */
export const ActivityForm = ({
  onSubmit,
  onSubmitAndContinue,
  isSubmitting = false,
  participants,
  initialValues,
  hideTicketsSection = false
}: ActivityFormProps) => {
  // Gestion du formulaire avec le hook personnalisé
  const activityForm = useActivityForm({
    participants,
    initialValues,
    onSubmit: async (values: CreateActivityInput) => {
      await onSubmit(values);
    }
  });

  // Gestion de la soumission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      await activityForm.form.handleSubmit(async (values) => {
        await onSubmit(values);
      })();
    },
    [activityForm.form, onSubmit]
  );

  const handleSubmitAndContinue = useCallback(
    async () => {
      if (!onSubmitAndContinue) return;
      const isValid = await activityForm.form.trigger();
      if (isValid) {
        const values = activityForm.form.getValues();
        await onSubmitAndContinue(values);
        // Réinitialiser le formulaire
        activityForm.form.reset();
      }
    },
    [activityForm.form, onSubmitAndContinue]
  );

  return (
    <form className="space-y-3 w-full" onSubmit={handleSubmit}>
      <ActivityTitleSection form={activityForm.form} />
      <ActivityTypeSection form={activityForm.form} />
      <ActivityDatesSection form={activityForm.form} />
      <ActivityLocationSection form={activityForm.form} />
      <ActivityParticipantsSection
        form={activityForm.form}
        participants={participants}
      />
      {!hideTicketsSection && (
        <ActivityTicketsSection
          form={activityForm.form}
        />
      )}
      <ActivityReportSection form={activityForm.form} />
      <ActivitySubmitButtons
        isSubmitting={isSubmitting}
        onSubmitAndContinue={onSubmitAndContinue ? handleSubmitAndContinue : undefined}
      />
    </form>
  );
};
