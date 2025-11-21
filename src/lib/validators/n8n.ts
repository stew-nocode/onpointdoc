/**
 * Schémas Zod pour la validation des requêtes N8N
 */

import { z } from 'zod';

/**
 * Schéma pour valider le contexte d'analyse
 */
export const analysisContextSchema = z.enum(['ticket', 'company', 'contact'], {
  message: 'Le contexte doit être "ticket", "company" ou "contact"'
});

/**
 * Schéma pour valider les données de génération d'analyse
 * 
 * L'ID doit être un UUID pour tous les contextes (ticket, company, contact)
 */
export const generateAnalysisSchema = z.object({
  context: analysisContextSchema,
  id: z.string().uuid({ message: 'ID invalide (UUID requis)' })
});

export type GenerateAnalysisInput = z.infer<typeof generateAnalysisSchema>;

