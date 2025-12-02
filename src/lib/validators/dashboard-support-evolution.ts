import { z } from 'zod';
import type { Period } from '@/types/dashboard';
import type { SupportDimension } from '@/types/dashboard-support-evolution';

/**
 * Schéma de validation pour les paramètres de récupération des données d'évolution Support
 * 
 * Utilisé dans les Server Actions pour valider les entrées
 */
export const supportEvolutionParamsSchema = z.object({
  period: z.union([
    z.enum(['week', 'month', 'quarter', 'year', 'custom']),
    z.string().regex(/^\d{4}$/, 'L\'année doit être au format YYYY (ex: 2024)'),
  ]) as z.ZodType<Period | string>,
  
  dimensions: z
    .array(
      z.enum(['BUG', 'REQ', 'ASSISTANCE', 'assistanceTime', 'tasks', 'activities'])
    )
    .min(1, 'Au moins une dimension doit être sélectionnée')
    .default(['BUG', 'REQ', 'ASSISTANCE', 'assistanceTime']),
  
  agents: z
    .array(z.string().uuid('ID d\'agent invalide'))
    .optional(),
  
  // Dates personnalisées pour période 'custom'
  periodStart: z
    .string()
    .refine(
      (val) => {
        if (!val) return true; // Optionnel
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: 'La date de début doit être une date ISO valide (ex: 2025-11-02T00:00:00.000Z)' }
    )
    .optional(),
  
  periodEnd: z
    .string()
    .refine(
      (val) => {
        if (!val) return true; // Optionnel
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: 'La date de fin doit être une date ISO valide (ex: 2025-12-02T23:59:59.999Z)' }
    )
    .optional(),
});

/**
 * Type inféré depuis le schéma Zod
 */
export type SupportEvolutionParams = z.infer<typeof supportEvolutionParamsSchema>;


