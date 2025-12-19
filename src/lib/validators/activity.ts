import { z } from 'zod';

// Valeurs alignées avec l'enum activity_type_t dans Supabase
export const activityTypes = [
  'Revue',
  'Brainstorm',
  'Atelier',
  'Presentation',
  'Demo',
  'Autre'
] as const;

// Valeurs alignées avec l'enum activity_status_t dans Supabase
export const activityStatuses = [
  'Brouillon',
  'Planifie',
  'En_cours',
  'Termine',
  'Annule'
] as const;

// Valeurs alignées avec l'enum activity_location_mode_t dans Supabase
export const activityLocationModes = [
  'Presentiel',
  'En_ligne'
] as const;

export const createActivitySchema = z
  .object({
    title: z.string().min(4, 'Le titre doit contenir au moins 4 caractères').max(180, 'Le titre ne peut pas dépasser 180 caractères'),
    activityType: z.enum(activityTypes, {
      message: 'Veuillez sélectionner un type d\'activité'
    }),
    // Dates optionnelles : l'activité peut être créée sans planification
    plannedStart: z.string().optional(),
    plannedEnd: z.string().optional(),
    // Participants : tableau d'IDs utilisateurs (optionnel, défaut: [])
    participantIds: z.array(z.string().uuid()).default([]),
    // Tickets liés : tableau d'IDs de tickets (optionnel, défaut: [])
    linkedTicketIds: z.array(z.string().uuid()).default([]),
    // Mode de localisation : présentiel ou en ligne (optionnel)
    locationMode: z.enum(activityLocationModes).optional(),
    // Compte-rendu optionnel
    reportContent: z.string().optional()
  })
  .superRefine((data, ctx) => {
    const hasStart = !!(data.plannedStart && typeof data.plannedStart === 'string' && data.plannedStart.trim().length > 0);
    const hasEnd = !!(data.plannedEnd && typeof data.plannedEnd === 'string' && data.plannedEnd.trim().length > 0);
    
    // Si une date est présente, l'autre doit l'être aussi (cohérence)
    if (hasStart && !hasEnd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La date de fin est requise si la date de début est renseignée',
        path: ['plannedEnd'],
      });
      return; // Arrêter ici pour éviter les vérifications suivantes
    }
    
    if (!hasStart && hasEnd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La date de début est requise si la date de fin est renseignée',
        path: ['plannedStart'],
      });
      return;
    }
    
    // Si les deux dates sont présentes, vérifier que la fin est après le début
    if (hasStart && hasEnd) {
      try {
        const start = new Date(data.plannedStart!);
        const end = new Date(data.plannedEnd!);
        
        // Vérifier que les dates sont valides
        if (isNaN(start.getTime())) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'La date de début n\'est pas valide',
            path: ['plannedStart'],
          });
        }
        
        if (isNaN(end.getTime())) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'La date de fin n\'est pas valide',
            path: ['plannedEnd'],
          });
        }
        
        // Vérifier l'ordre chronologique seulement si les dates sont valides
        if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end <= start) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'La date de fin doit être postérieure à la date de début',
            path: ['plannedEnd'],
          });
        }
      } catch {
        // Les dates seront invalidées par les vérifications ci-dessus
      }
    }
    // Si aucune date n'est présente, c'est valide (activité non planifiée)
  });

export type CreateActivityInput = z.infer<typeof createActivitySchema>;

/**
 * Schéma pour la mise à jour d'une activité
 * Tous les champs sont optionnels sauf l'ID
 */
export const updateActivitySchema = z
  .object({
    id: z.string().uuid({ message: 'ID d\'activité invalide' }),
    title: z.string().min(4).max(180).optional(),
    activityType: z.enum(activityTypes).optional(),
    plannedStart: z.string().datetime().or(z.string().min(1)).optional(),
    plannedEnd: z.string().datetime().or(z.string().min(1)).optional(),
    status: z.enum(activityStatuses).optional(),
    participantIds: z.array(z.string().uuid()).optional(),
    linkedTicketIds: z.array(z.string().uuid()).optional(),
    locationMode: z.enum(activityLocationModes).optional(),
    reportContent: z.string().optional().nullable()
  })
  .refine(
    (data) => {
      // Si les deux dates sont présentes, vérifier que la fin est après le début
      if (data.plannedStart && data.plannedEnd) {
        try {
          const start = new Date(data.plannedStart);
          const end = new Date(data.plannedEnd);
          return end > start;
        } catch {
          return false;
        }
      }
      return true;
    },
    {
      message: 'La date de fin doit être postérieure à la date de début',
      path: ['plannedEnd']
    }
  );

export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
