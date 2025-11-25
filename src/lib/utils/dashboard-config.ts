import type { DashboardRole, DashboardConfig } from '@/types/dashboard';
import { getDefaultDashboardConfig } from '@/services/dashboard/default-config';

/**
 * Retourne la configuration du dashboard selon le rôle (version synchrone)
 * 
 * Cette fonction retourne uniquement les defaults.
 * Pour charger depuis la DB, utiliser getDashboardConfiguration() du service.
 * 
 * @param role - Rôle de l'utilisateur
 * @param teamId - ID de l'équipe (pour les managers)
 * @param agentId - ID de l'agent (pour les agents)
 * @returns Configuration du dashboard avec visibilité des sections
 * 
 * @deprecated Utiliser getDashboardConfiguration() du service pour charger depuis la DB
 */
export function getDashboardConfig(
  role: DashboardRole,
  teamId?: string,
  agentId?: string
): DashboardConfig {
  return getDefaultDashboardConfig(role, teamId, agentId);
}

/**
 * Convertit un rôle de profil en DashboardRole
 * 
 * @param profileRole - Rôle du profil (peut inclure 'director', 'client', etc.)
 * @returns DashboardRole simplifié
 */
export function mapProfileRoleToDashboardRole(
  profileRole: string | null | undefined
): DashboardRole {
  if (!profileRole) return 'agent';

  // Mapper les rôles vers les rôles dashboard
  switch (profileRole.toLowerCase()) {
    case 'director':
    case 'direction':
      return 'direction';

    case 'manager':
      return 'manager';

    case 'admin':
      return 'admin';

    case 'agent':
    case 'client':
    case 'it':
    case 'marketing':
    default:
      return 'agent';
  }
}

