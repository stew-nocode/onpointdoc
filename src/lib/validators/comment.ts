import { z } from 'zod';

/**
 * Schéma Zod pour la création d'un commentaire
 * 
 * Contraintes :
 * - content : minimum 1 caractère, maximum 5000 caractères
 * - ticket_id : UUID valide
 * - comment_type : 'comment' ou 'followup' (optionnel, défaut: 'comment')
 */
export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Le commentaire ne peut pas être vide')
    .max(5000, 'Le commentaire est trop long (maximum 5000 caractères)'),
  ticket_id: z.string().uuid('ID de ticket invalide'),
  comment_type: z.enum(['comment', 'followup']).default('comment').optional()
});

/**
 * Type TypeScript inféré du schéma de création
 */
export type CreateCommentInput = z.infer<typeof createCommentSchema>;

/**
 * Schéma Zod pour la suppression d'un commentaire
 * 
 * Contraintes :
 * - comment_id : UUID valide
 */
export const deleteCommentSchema = z.object({
  comment_id: z.string().uuid('ID de commentaire invalide')
});

/**
 * Type TypeScript inféré du schéma de suppression
 */
export type DeleteCommentInput = z.infer<typeof deleteCommentSchema>;

