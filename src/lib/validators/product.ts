import { z } from 'zod';

export const moduleCreateSchema = z.object({
  name: z.string().min(2),
  productId: z.string().uuid('Produit invalide')
});
export type ModuleCreateInput = z.infer<typeof moduleCreateSchema>;

export const moduleUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).optional(),
  productId: z.string().uuid().optional()
});
export type ModuleUpdateInput = z.infer<typeof moduleUpdateSchema>;

export const submoduleCreateSchema = z.object({
  name: z.string().min(2),
  moduleId: z.string().uuid('Module invalide')
});
export type SubmoduleCreateInput = z.infer<typeof submoduleCreateSchema>;

export const submoduleUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).optional(),
  moduleId: z.string().uuid().optional()
});
export type SubmoduleUpdateInput = z.infer<typeof submoduleUpdateSchema>;

export const featureCreateSchema = z.object({
  name: z.string().min(2),
  submoduleId: z.string().uuid('Sous-module invalide')
});
export type FeatureCreateInput = z.infer<typeof featureCreateSchema>;

export const featureUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).optional(),
  submoduleId: z.string().uuid().optional()
});
export type FeatureUpdateInput = z.infer<typeof featureUpdateSchema>;


