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
    z.enum(['week', 'month', 'quarter', 'year']),
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
});

/**
 * Type inféré depuis le schéma Zod
 */
export type SupportEvolutionParams = z.infer<typeof supportEvolutionParamsSchema>;

