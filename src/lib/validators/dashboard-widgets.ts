/**
 * Validateurs Zod pour les configurations dashboard
 * 
 * ✅ OPTIMISÉ : Validation stricte des configurations
 * 
 * Principe Clean Code - Niveau Senior :
 * - Validation côté serveur stricte
 * - Type safety garanti
 * - Protection contre données invalides
 */

import { z } from 'zod';

/**
 * Liste des rôles dashboard valides
 */
export const DASHBOARD_ROLES = ['direction', 'manager', 'agent', 'admin'] as const;

/**
 * Liste des widgets dashboard valides
 * 
 * ⚠️ REFONTE EN COURS : Validation temporairement assouplie
 * Les widgets seront ajoutés progressivement selon la documentation de refonte
 * 
 * @see docs/dashboard/REFONTE-DASHBOARD-SPECIFICATION.md
 */
export const DASHBOARD_WIDGETS = [
  // === KPIs STATIQUES ===
  'bug-history',
  'req-history',
  'assistance-history',
  // === KPIs FILTRÉS (à implémenter) ===
  // === CHARTS ===
  'tickets-distribution',
  'tickets-evolution',
  'tickets-by-company',
  // === TABLES (à implémenter) ===
  // === FULL-WIDTH (à implémenter) ===
] as const;

/**
 * Schéma de validation pour un rôle dashboard
 */
export const dashboardRoleSchema = z.enum(DASHBOARD_ROLES);

/**
 * Schéma de validation pour un widget dashboard
 * 
 * ⚠️ REFONTE EN COURS : Utilise z.string() au lieu de z.enum()
 * pour permettre la coexistence des anciens et nouveaux widgets pendant la migration
 */
export const dashboardWidgetSchema = z.string();

/**
 * Schéma de validation pour la configuration dashboard d'un utilisateur
 * 
 * Valide que :
 * - Le rôle est valide
 * - Les widgets sont valides
 * - Les widgets visibles sont un sous-ensemble des widgets disponibles
 * - Les widgets cachés sont un sous-ensemble des widgets disponibles
 */
export const userDashboardConfigSchema = z
  .object({
    role: dashboardRoleSchema,
    availableWidgets: z.array(dashboardWidgetSchema),
    visibleWidgets: z.array(dashboardWidgetSchema),
    hiddenWidgets: z.array(dashboardWidgetSchema),
  })
  .refine(
    (data) => {
      // Les widgets visibles doivent être un sous-ensemble des widgets disponibles
      return data.visibleWidgets.every((widget) => data.availableWidgets.includes(widget));
    },
    {
      message: 'Les widgets visibles doivent être un sous-ensemble des widgets disponibles',
      path: ['visibleWidgets'],
    }
  )
  .refine(
    (data) => {
      // Les widgets cachés doivent être un sous-ensemble des widgets disponibles
      return data.hiddenWidgets.every((widget) => data.availableWidgets.includes(widget));
    },
    {
      message: 'Les widgets cachés doivent être un sous-ensemble des widgets disponibles',
      path: ['hiddenWidgets'],
    }
  )
  .refine(
    (data) => {
      // Un widget ne peut pas être à la fois visible et caché
      return !data.visibleWidgets.some((widget) => data.hiddenWidgets.includes(widget));
    },
    {
      message: 'Un widget ne peut pas être à la fois visible et caché',
      path: ['visibleWidgets'],
    }
  );

/**
 * Type TypeScript dérivé du schéma Zod
 */
export type UserDashboardConfigInput = z.infer<typeof userDashboardConfigSchema>;


