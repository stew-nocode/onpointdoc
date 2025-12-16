/**
 * Hook personnalisé pour gérer la logique du formulaire de tâche
 * 
 * Séparant la logique métier de la présentation selon les principes Clean Code
 * 
 * Best Practices Context7 :
 * - Utilise zodResolver pour l'intégration Zod + React Hook Form
 * - defaultValues fournis pour éviter undefined (requis par React Hook Form)
 * - Type inference automatique depuis CreateTaskInput (Zod schema)
 */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createTaskSchema,
  type CreateTaskInput,
} from '@/lib/validators/task';
import type { BasicProfile } from '@/services/users';

type UseTaskFormOptions = {
  profiles: BasicProfile[];
  onSubmit: (values: CreateTaskInput) => Promise<void | string>;
  initialValues?: Partial<CreateTaskInput>;
};

type UseTaskFormResult = {
  form: ReturnType<typeof useForm<CreateTaskInput>>;
};

/**
 * Hook pour gérer la logique du formulaire de tâche
 * 
 * @param options - Options de configuration du formulaire
 * @returns État et handlers du formulaire
 */
export function useTaskForm(options: UseTaskFormOptions): UseTaskFormResult {
  const { profiles, onSubmit, initialValues } = options;

  // Valeurs par défaut pour création
  // ✅ Best Practice Context7 : Éviter undefined, utiliser des valeurs par défaut explicites
  const defaultValues: CreateTaskInput = {
    title: initialValues?.title ?? '',
    description: initialValues?.description ?? undefined,
    dueDate: initialValues?.dueDate ?? undefined,
    assignedTo: initialValues?.assignedTo ?? undefined,
    linkedTicketIds: initialValues?.linkedTicketIds ?? [],
    linkedActivityIds: initialValues?.linkedActivityIds ?? [],
    reportContent: initialValues?.reportContent ?? undefined,
    isPlanned: initialValues?.isPlanned ?? false
  };

  const form = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues
  });

  return {
    form
  };
}
