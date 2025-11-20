/**
 * Schémas de validation Zod pour les départements
 */

import { z } from 'zod';

/**
 * Schéma pour créer un département
 */
export const departmentCreateSchema = z.object({
  name: z.string().min(2).max(100),
  code: z.string().min(2).max(10),
  description: z.string().optional().nullable(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional().nullable()
});

export type DepartmentCreateInput = z.infer<typeof departmentCreateSchema>;

/**
 * Schéma pour mettre à jour un département
 */
export const departmentUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(100).optional(),
  code: z.string().min(2).max(10).optional(),
  description: z.string().optional().nullable(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional().nullable(),
  is_active: z.boolean().optional()
});

export type DepartmentUpdateInput = z.infer<typeof departmentUpdateSchema>;

/**
 * Schéma pour lier un produit à un département
 */
export const departmentLinkProductSchema = z.object({
  departmentId: z.string().uuid(),
  productId: z.string().uuid()
});

export type DepartmentLinkProductInput = z.infer<typeof departmentLinkProductSchema>;

/**
 * Schéma pour délier un produit d'un département
 * Accepte des valeurs string ou null (pour les query params)
 */
export const departmentUnlinkProductSchema = z.object({
  departmentId: z.string().uuid().or(z.string().nullable().transform(() => undefined)),
  productId: z.string().uuid().or(z.string().nullable().transform(() => undefined))
}).refine((data) => data.departmentId && data.productId, {
  message: 'departmentId et productId requis',
  path: ['departmentId', 'productId']
});

export type DepartmentUnlinkProductInput = z.infer<typeof departmentUnlinkProductSchema>;
