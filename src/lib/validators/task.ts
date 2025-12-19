import { z } from 'zod';

// Valeurs alignées avec l'enum task_status_t dans Supabase
export const taskStatuses = [
  'A_faire',
  'En_cours',
  'Termine',
  'Annule',
  'Bloque'
] as const;

/**
 * Helper pour valider une date de début dans un contexte Zod
 * 
 * @param startDate - String de date à valider
 * @param ctx - Contexte Zod pour ajouter des issues
 * @param path - Chemin du champ dans l'objet (défaut: 'startDate')
 * @returns true si la date est valide ou absente, false sinon
 */
function validateStartDate(
  startDate: unknown,
  ctx: z.RefinementCtx,
  path: ['startDate'] = ['startDate']
): boolean {
  if (!startDate || typeof startDate !== 'string' || startDate.trim().length === 0) {
    return true; // Date optionnelle, absence = valide
  }

  try {
    const parsedDate = new Date(startDate);
    
    if (isNaN(parsedDate.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La date de début n\'est pas valide',
        path,
      });
      return false;
    }
    
    return true;
  } catch {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'La date de début n\'est pas valide',
      path,
    });
    return false;
  }
}

/**
 * Helper pour valider la cohérence date de début + durée
 * 
 * @param data - Données du formulaire
 * @param ctx - Contexte Zod pour ajouter des issues
 * @returns true si cohérent, false sinon
 */
function validateStartDateAndDuration(
  data: { startDate?: string; estimatedDurationHours?: number },
  ctx: z.RefinementCtx
): boolean {
  const hasStartDate = !!(data.startDate && typeof data.startDate === 'string' && data.startDate.trim().length > 0);
  const hasDuration = typeof data.estimatedDurationHours === 'number' && data.estimatedDurationHours > 0;

  // Si l'un est défini, l'autre doit l'être aussi
  if (hasStartDate && !hasDuration) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'La durée estimée est requise si une date de début est définie',
      path: ['estimatedDurationHours'],
    });
    return false;
  }

  if (hasDuration && !hasStartDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'La date de début est requise si une durée est définie',
      path: ['startDate'],
    });
    return false;
  }

  return true;
}

/**
 * Schéma pour la création d'une tâche
 * 
 * Différences avec createActivitySchema :
 * - startDate + estimatedDurationHours au lieu de plannedStart/plannedEnd (période)
 * - assigned_to (UUID unique) au lieu de participantIds (array)
 * - is_planned (boolean) au lieu de dates planifiées
 * - description optionnel
 * - Pas d'activity_type
 */
export const createTaskSchema = z
  .object({
    title: z.string().min(4, 'Le titre doit contenir au moins 4 caractères').max(180, 'Le titre ne peut pas dépasser 180 caractères'),
    description: z.string().optional(),
    // Date de début optionnelle (validation stricte dans superRefine)
    startDate: z.string().optional(),
    // Durée estimée en heures (optionnelle, positive)
    estimatedDurationHours: z.number().positive('La durée doit être positive').optional(),
    // Assigné à un utilisateur (optionnel)
    assignedTo: z.string().uuid().optional(),
    // Tickets liés : tableau d'IDs de tickets (optionnel)
    linkedTicketIds: z.array(z.string().uuid()).optional(),
    // Activités liées : tableau d'IDs d'activités (optionnel)
    linkedActivityIds: z.array(z.string().uuid()).optional(),
    // Compte-rendu optionnel
    reportContent: z.string().optional(),
    // Indicateur de planification (boolean)
    isPlanned: z.boolean().optional()
  })
  .superRefine((data, ctx) => {
    validateStartDate(data.startDate, ctx);
    validateStartDateAndDuration(data, ctx);
  });

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

/**
 * Schéma pour la mise à jour d'une tâche
 * Tous les champs sont optionnels sauf l'ID
 */
export const updateTaskSchema = z
  .object({
    id: z.string().uuid({ message: 'ID de tâche invalide' }),
    title: z.string().min(4).max(180).optional(),
    description: z.string().optional(),
    startDate: z.string().optional(),
    estimatedDurationHours: z.number().positive().optional(),
    assignedTo: z.string().uuid().optional(),
    status: z.enum(taskStatuses).optional(),
    linkedTicketIds: z.array(z.string().uuid()).optional(),
    linkedActivityIds: z.array(z.string().uuid()).optional(),
    reportContent: z.string().optional().nullable(),
    isPlanned: z.boolean().optional()
  })
  .superRefine((data, ctx) => {
    validateStartDate(data.startDate, ctx);
    validateStartDateAndDuration(data, ctx);
  });

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

