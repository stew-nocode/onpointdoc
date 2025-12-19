/**
 * Formulaire de création de tâche
 * 
 * Composant principal : orchestration des sections atomiques
 * Respecte les principes Clean Code (< 100 lignes)
 */

'use client';

import { useCallback } from 'react';
import type { CreateTaskInput } from '@/lib/validators/task';
import type { BasicProfile } from '@/services/users';
import { useTaskForm } from '@/hooks/forms/use-task-form';
import {
  TaskTitleSection,
  TaskDescriptionSection,
  TaskPlanningSection,
  TaskAssignedSection,
  TaskLinksSection,
  TaskReportSection,
  TaskSubmitButtons,
} from './task-form/sections';

type TaskFormProps = {
  onSubmit: (values: CreateTaskInput) => Promise<void | string>;
  onSubmitAndContinue?: (values: CreateTaskInput) => Promise<void | string>;
  isSubmitting?: boolean;
  profiles: BasicProfile[];
  initialValues?: Partial<CreateTaskInput>;
};

/**
 * Formulaire de création de tâche
 * 
 * Orchestrateur des sections atomiques selon les principes Clean Code
 */
export const TaskForm = ({
  onSubmit,
  onSubmitAndContinue,
  isSubmitting = false,
  profiles,
  initialValues
}: TaskFormProps) => {
  // Gestion du formulaire avec le hook personnalisé
  const taskForm = useTaskForm({
    profiles,
    initialValues,
    onSubmit: async (values: CreateTaskInput) => {
      await onSubmit(values);
    }
  });

  // Gestion de la soumission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      await taskForm.form.handleSubmit(async (values) => {
        await onSubmit(values);
      })();
    },
    [taskForm.form, onSubmit]
  );

  const handleSubmitAndContinue = useCallback(
    async () => {
      if (!onSubmitAndContinue) return;
      const isValid = await taskForm.form.trigger();
      if (isValid) {
        const values = taskForm.form.getValues();
        await onSubmitAndContinue(values);
        // Réinitialiser le formulaire
        taskForm.form.reset();
      }
    },
    [taskForm.form, onSubmitAndContinue]
  );

  return (
    <form className="space-y-3 w-full" onSubmit={handleSubmit}>
      <TaskTitleSection form={taskForm.form} />
      <TaskDescriptionSection form={taskForm.form} />
      <TaskPlanningSection form={taskForm.form} />
      <TaskAssignedSection form={taskForm.form} profiles={profiles} />
      <TaskLinksSection form={taskForm.form} />
      <TaskReportSection form={taskForm.form} />
      <TaskSubmitButtons
        isSubmitting={isSubmitting}
        onSubmitAndContinue={onSubmitAndContinue ? handleSubmitAndContinue : undefined}
      />
    </form>
  );
};
