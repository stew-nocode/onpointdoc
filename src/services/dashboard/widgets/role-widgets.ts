import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { DashboardRole, DashboardWidget } from '@/types/dashboard-widgets';

/**
 * Charge les widgets affectés à un rôle (configuration admin)
 * 
 * @param role - Rôle pour lequel charger les widgets
 * @returns Liste des widgets affectés au rôle
 */
export async function getRoleWidgets(role: DashboardRole): Promise<DashboardWidget[]> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('dashboard_role_widgets')
      .select('widget_id')
      .eq('role', role)
      .eq('enabled', true);

    if (error || !data) {
      return [];
    }

    return data.map((item) => item.widget_id as DashboardWidget);
  } catch {
    return [];
  }
}

/**
 * Charge toutes les configurations de widgets par rôle (admin uniquement)
 * 
 * @returns Toutes les configurations de widgets par rôle
 */
export async function getAllRoleWidgets(): Promise<Array<{
  role: DashboardRole;
  widgets: DashboardWidget[];
  updatedAt: string;
  updatedBy: string | null;
}>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('dashboard_role_widgets')
      .select('role, widget_id, enabled, updated_at, updated_by')
      .eq('enabled', true)
      .order('role', { ascending: true });

    if (error || !data) {
      return [];
    }

    // Grouper par rôle
    const grouped = data.reduce((acc, item) => {
      const role = item.role as DashboardRole;
      if (!acc[role]) {
        acc[role] = {
          role,
          widgets: [],
          updatedAt: item.updated_at,
          updatedBy: item.updated_by,
        };
      }
      acc[role].widgets.push(item.widget_id as DashboardWidget);
      return acc;
    }, {} as Record<DashboardRole, { role: DashboardRole; widgets: DashboardWidget[]; updatedAt: string; updatedBy: string | null }>);

    return Object.values(grouped);
  } catch {
    return [];
  }
}

/**
 * Met à jour les widgets affectés à un rôle (admin uniquement)
 * 
 * @param role - Rôle à configurer
 * @param widgets - Liste des widgets à affecter (les autres seront désactivés)
 * @param updatedBy - ID du profil admin qui effectue la modification
 */
export async function updateRoleWidgets(
  role: DashboardRole,
  widgets: DashboardWidget[],
  updatedBy: string
): Promise<void> {
  const supabase = await createSupabaseServerClient();

  // Désactiver tous les widgets actuels pour ce rôle
  await supabase
    .from('dashboard_role_widgets')
    .update({ enabled: false })
    .eq('role', role);

  // Activer les nouveaux widgets (upsert)
  if (widgets.length > 0) {
    const toInsert = widgets.map((widgetId) => ({
      role,
      widget_id: widgetId,
      enabled: true,
      updated_by: updatedBy,
    }));

    const { error } = await supabase
      .from('dashboard_role_widgets')
      .upsert(toInsert, {
        onConflict: 'role,widget_id',
      });

    if (error) {
      throw new Error(`Erreur lors de la mise à jour: ${error.message}`);
    }
  }
}

