import { z } from 'zod';

export const companyCreateSchema = z.object({
  name: z.string().min(2, 'Nom trop court'),
  countryId: z.string().uuid('Pays invalide').nullable().optional(),
  focalUserId: z.string().uuid('Contact invalide').nullable().optional(),
  sectorIds: z.array(z.string().uuid()).default([])
});

export type CompanyCreateInput = z.infer<typeof companyCreateSchema>;

export const companyUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).optional(),
  countryId: z.string().uuid().nullable().optional(),
  focalUserId: z.string().uuid().nullable().optional(),
  sectorIds: z.array(z.string().uuid()).optional()
});

export type CompanyUpdateInput = z.infer<typeof companyUpdateSchema>;


