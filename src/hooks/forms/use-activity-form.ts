/**
 * Hook personnalisé pour gérer la logique du formulaire d'activité
 * 
 * Séparant la logique métier de la présentation selon les principes Clean Code
 */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createActivitySchema,
  type CreateActivityInput,
} from '@/lib/validators/activity';

type ParticipantProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type UseActivityFormOptions = {
  participants: ParticipantProfile[];
  onSubmit: (values: CreateActivityInput) => Promise<void | string>;
  initialValues?: Partial<CreateActivityInput>;
};

type UseActivityFormResult = {
  form: ReturnType<typeof useForm<CreateActivityInput>>;
};

/**
 * Hook pour gérer la logique du formulaire d'activité
 * 
 * @param options - Options de configuration du formulaire
 * @returns État et handlers du formulaire
 */
export function useActivityForm(options: UseActivityFormOptions): UseActivityFormResult {
  const { participants, onSubmit, initialValues } = options;

  // Valeurs par défaut pour création
  // Les dates sont optionnelles : null si non planifiée (éviter undefined selon React Hook Form)
  const defaultValues: CreateActivityInput = {
    title: initialValues?.title ?? '',
    activityType: initialValues?.activityType ?? 'Revue',
    plannedStart: initialValues?.plannedStart ?? undefined,
    plannedEnd: initialValues?.plannedEnd ?? undefined,
    participantIds: initialValues?.participantIds ?? [],
    linkedTicketIds: initialValues?.linkedTicketIds ?? [],
    locationMode: initialValues?.locationMode ?? undefined,
    reportContent: initialValues?.reportContent ?? undefined
  };

  const form = useForm<CreateActivityInput>({
    resolver: zodResolver(createActivitySchema),
    defaultValues
  });

  return {
    form
  };
}
