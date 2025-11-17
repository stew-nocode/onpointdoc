import { z } from 'zod';

export const internalRoles = ['admin', 'manager', 'director', 'agent', 'it', 'marketing'] as const;
export const allRoles = [...internalRoles, 'client'] as const;

export const departments = ['Support', 'IT', 'Marketing'] as const;
export type Department = typeof departments[number];

export const userCreateInternalSchema = z.object({
  fullName: z.string().min(2, 'Nom trop court'),
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe trop court'),
  role: z.enum(internalRoles),
  companyId: z.string().uuid('Entreprise invalide'),
  isActive: z.boolean().default(true),
  department: z.enum(departments).optional().nullable(),
  moduleIds: z.array(z.string().uuid()).default([])
});
export type UserCreateInternalInput = z.infer<typeof userCreateInternalSchema>;

export const userUpdateSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(allRoles).optional(),
  companyId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
  department: z.enum(departments).optional().nullable(),
  moduleIds: z.array(z.string().uuid()).optional()
});
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;

export const contactCreateSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  companyId: z.string().uuid(),
  isActive: z.boolean().default(true)
});
export type ContactCreateInput = z.infer<typeof contactCreateSchema>;


