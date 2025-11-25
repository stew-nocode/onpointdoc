import type { DashboardRole, DashboardWidget, UserDashboardConfig } from '@/types/dashboard-widgets';
import { getRoleWidgets } from './role-widgets';
import { getUserWidgetPreferences } from './user-preferences';

/**
 * Calcule la configuration finale du dashboard pour un utilisateur
 * 
 * Combine :
 * - Les widgets affectés au rôle (par admin)
 * - Les préférences utilisateur (widgets désactivés)
 * 
 * @param profileId - ID du profil utilisateur
 * @param role - Rôle de l'utilisateur
 * @returns Configuration finale avec widgets disponibles et visibles
 */
export async function getUserDashboardConfig(
  profileId: string,
  role: DashboardRole
): Promise<UserDashboardConfig> {
  // Charger les widgets affectés au rôle
  const availableWidgets = await getRoleWidgets(role);

  // Charger les préférences utilisateur (widgets désactivés)
  const hiddenWidgets = await getUserWidgetPreferences(profileId);

  // Calculer les widgets visibles (disponibles - masqués)
  const visibleWidgets = availableWidgets.filter(
    (widget) => !hiddenWidgets.includes(widget)
  );

  return {
    role,
    availableWidgets,
    visibleWidgets,
    hiddenWidgets,
  };
}

