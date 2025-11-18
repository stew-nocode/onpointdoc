import { z } from 'zod';

export const departmentCreateSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  code: z.string().min(2, 'Le code doit contenir au moins 2 caractères').max(10, 'Le code ne peut pas dépasser 10 caractères'),
  description: z.string().optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'La couleur doit être au format hexadécimal (#RRGGBB)').optional().nullable()
});
export type DepartmentCreateInput = z.infer<typeof departmentCreateSchema>;

export const departmentUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).optional(),
  code: z.string().min(2).max(10).optional(),
  description: z.string().optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  is_active: z.boolean().optional()
});
export type DepartmentUpdateInput = z.infer<typeof departmentUpdateSchema>;

