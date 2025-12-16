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
 * Helper pour valider une date d'échéance dans un contexte Zod
 * 
 * @param dueDate - String de date à valider
 * @param ctx - Contexte Zod pour ajouter des issues
 * @param path - Chemin du champ dans l'objet (défaut: 'dueDate')
 * @returns true si la date est valide ou absente, false sinon
 */
function validateDueDate(
  dueDate: unknown,
  ctx: z.RefinementCtx,
  path: ['dueDate'] = ['dueDate']
): boolean {
  if (!dueDate || typeof dueDate !== 'string' || dueDate.trim().length === 0) {
    return true; // Date optionnelle, absence = valide
  }

  try {
    const parsedDate = new Date(dueDate);
    
    if (isNaN(parsedDate.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La date d\'échéance n\'est pas valide',
        path,
      });
      return false;
    }
    
    return true;
  } catch {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'La date d\'échéance n\'est pas valide',
      path,
    });
    return false;
  }
}

/**
 * Schéma pour la création d'une tâche
 * 
 * Différences avec createActivitySchema :
 * - due_date (date unique) au lieu de plannedStart/plannedEnd (période)
 * - assigned_to (UUID unique) au lieu de participantIds (array)
 * - is_planned (boolean) au lieu de dates planifiées
 * - description optionnel
 * - Pas d'activity_type
 */
export const createTaskSchema = z
  .object({
    title: z.string().min(4, 'Le titre doit contenir au moins 4 caractères').max(180, 'Le titre ne peut pas dépasser 180 caractères'),
    description: z.string().optional(),
    // Date d'échéance optionnelle (validation stricte dans superRefine)
    dueDate: z.string().optional(),
    // Assigné à un utilisateur (optionnel)
    assignedTo: z.string().uuid().optional(),
    // Tickets liés : tableau d'IDs de tickets (optionnel)
    linkedTicketIds: z.array(z.string().uuid()).optional().default([]),
    // Activités liées : tableau d'IDs d'activités (optionnel)
    linkedActivityIds: z.array(z.string().uuid()).optional().default([]),
    // Compte-rendu optionnel
    reportContent: z.string().optional(),
    // Indicateur de planification (boolean)
    isPlanned: z.boolean().optional().default(false)
  })
  .superRefine((data, ctx) => {
    validateDueDate(data.dueDate, ctx);
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
    dueDate: z.string().optional(),
    assignedTo: z.string().uuid().optional(),
    status: z.enum(taskStatuses).optional(),
    linkedTicketIds: z.array(z.string().uuid()).optional(),
    linkedActivityIds: z.array(z.string().uuid()).optional(),
    reportContent: z.string().optional().nullable(),
    isPlanned: z.boolean().optional()
  })
  .superRefine((data, ctx) => {
    validateDueDate(data.dueDate, ctx);
  });

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

