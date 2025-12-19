/**
 * Schémas de validation Zod pour les utilisateurs
 */

import { z } from 'zod';
import type { ProfileRole } from '@/types/profile';

/**
 * Rôles autorisés pour les utilisateurs
 */
const profileRoles: [ProfileRole, ...ProfileRole[]] = ['admin', 'manager', 'director', 'agent', 'client'];

/**
 * Rôles autorisés pour les utilisateurs internes (sans 'client')
 */
const internalProfileRoles: [ProfileRole, ...ProfileRole[]] = ['admin', 'manager', 'director', 'agent'];

/**
 * Départements disponibles
 */
export const departments = ['Support', 'IT', 'Marketing'] as const;

export type Department = (typeof departments)[number];

/**
 * Schéma pour créer un utilisateur (via API)
 * Email et password sont optionnels : si non fournis, seul le profil sera créé (pas d'utilisateur auth)
 */
export const userCreateSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  role: z.enum(profileRoles),
  companyId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional(),
  moduleIds: z.array(z.string().uuid()).optional(),
  department: z.string().optional().nullable(),
  jobTitle: z.string().optional().nullable()
}).refine(
  (data) => {
    // Si email est fourni, password doit aussi être fourni (et vice versa)
    if (data.email && !data.password) {
      return false;
    }
    if (data.password && !data.email) {
      return false;
    }
    return true;
  },
  {
    message: 'Email et mot de passe doivent être fournis ensemble',
    path: ['password']
  }
);

export type UserCreateInput = z.infer<typeof userCreateSchema>;

/**
 * Schéma pour créer un utilisateur interne (via interface)
 */
export const userCreateInternalSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(internalProfileRoles),
  department: z.enum(departments).optional(),
  jobTitle: z.string().optional(),
  companyId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional(),
  moduleIds: z.array(z.string().uuid()).optional()
});

export type UserCreateInternalInput = z.infer<typeof userCreateInternalSchema>;

/**
 * Schéma pour mettre à jour un utilisateur interne
 */
export const userUpdateSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  role: z.enum(internalProfileRoles).optional(),
  department: z.enum(departments).optional(),
  jobTitle: z.string().optional().nullable(),
  companyId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional(),
  moduleIds: z.array(z.string().uuid()).optional()
});

export type UserUpdateInput = z.infer<typeof userUpdateSchema>;

/**
 * Schéma pour créer un contact (client externe)
 * Email et password sont optionnels : si non fournis, le contact ne pourra pas se connecter
 */
export const contactCreateSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  jobTitle: z.string().optional(),
  companyId: z.string().uuid(),
  isActive: z.boolean().optional()
}).refine(
  (data) => {
    // Si email est fourni, password doit aussi être fourni (et vice versa)
    if (data.email && !data.password) {
      return false;
    }
    if (data.password && !data.email) {
      return false;
    }
    return true;
  },
  {
    message: 'Email et mot de passe doivent être fournis ensemble',
    path: ['password']
  }
);

export type ContactCreateInput = z.infer<typeof contactCreateSchema>;

/**
 * Schéma pour mettre à jour un contact (client externe)
 */
export const contactUpdateSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  jobTitle: z.string().optional().nullable(),
  companyId: z.string().uuid().optional(),
  isActive: z.boolean().optional()
});

export type ContactUpdateInput = z.infer<typeof contactUpdateSchema>;
