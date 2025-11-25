import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { DashboardWidget } from '@/types/dashboard-widgets';

/**
 * Charge les préférences d'un utilisateur (widgets désactivés)
 * 
 * @param profileId - ID du profil utilisateur
 * @returns Liste des widgets désactivés par l'utilisateur
 */
export async function getUserWidgetPreferences(profileId: string): Promise<DashboardWidget[]> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('dashboard_user_preferences')
      .select('widget_id')
      .eq('profile_id', profileId)
      .eq('visible', false);

    if (error || !data) {
      return [];
    }

    return data.map((item) => item.widget_id as DashboardWidget);
  } catch {
    return [];
  }
}

/**
 * Met à jour les préférences d'un utilisateur
 * 
 * @param profileId - ID du profil utilisateur
 * @param hiddenWidgets - Liste des widgets à masquer (les autres seront visibles)
 */
export async function updateUserWidgetPreferences(
  profileId: string,
  hiddenWidgets: DashboardWidget[]
): Promise<void> {
  const supabase = await createSupabaseServerClient();

  // Supprimer toutes les préférences existantes pour cet utilisateur
  await supabase
    .from('dashboard_user_preferences')
    .delete()
    .eq('profile_id', profileId);

  // Ajouter uniquement les widgets masqués
  if (hiddenWidgets.length > 0) {
    const toInsert = hiddenWidgets.map((widgetId) => ({
      profile_id: profileId,
      widget_id: widgetId,
      visible: false,
    }));

    const { error } = await supabase
      .from('dashboard_user_preferences')
      .insert(toInsert);

    if (error) {
      throw new Error(`Erreur lors de la mise à jour: ${error.message}`);
    }
  }
}

/**
 * Réinitialise les préférences d'un utilisateur (tous les widgets visibles)
 * 
 * @param profileId - ID du profil utilisateur
 */
export async function resetUserWidgetPreferences(profileId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from('dashboard_user_preferences')
    .delete()
    .eq('profile_id', profileId);

  if (error) {
    throw new Error(`Erreur lors de la réinitialisation: ${error.message}`);
  }
}

