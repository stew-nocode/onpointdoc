/**
 * Service optimisé pour le filtre "mine" (mes activités)
 *
 * Utilise la vue matérialisée my_activities pour améliorer les performances
 * Gain estimé: -60% sur le filtre "mine"
 *
 * @see supabase/migrations/2025-12-15-add-my-activities-view.sql
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Récupère les IDs des activités pour un utilisateur (créées ou participées)
 *
 * Utilise la vue matérialisée my_activities pour un filtrage efficace
 * avec l'index GIN sur all_user_ids
 *
 * @param profileId - ID du profil utilisateur
 * @returns Tableau d'IDs d'activités
 */
export async function getMyActivityIds(profileId: string): Promise<string[]> {
  const supabase = await createSupabaseServerClient();

  // Requête sur la vue matérialisée avec l'opérateur @> (contains)
  // L'index GIN rend cette opération très rapide
  const { data, error } = await supabase
    .from('my_activities')
    .select('activity_id')
    .contains('all_user_ids', [profileId]);

  if (error) {
    console.error('[ERROR] Erreur lors de la récupération des IDs d\'activités:', error);
    return [];
  }

  return (data || []).map((row) => row.activity_id);
}

/**
 * Applique le filtre "mine" optimisé à une requête
 *
 * Version optimisée qui utilise la vue matérialisée au lieu d'une sous-requête complexe
 *
 * @param query - Requête Supabase à filtrer
 * @param profileId - ID du profil utilisateur
 * @returns Requête filtrée
 */
export async function applyMineFilterOptimized(
  query: any,
  profileId: string
): Promise<any> {
  // Récupérer les IDs d'activités via la vue matérialisée
  const activityIds = await getMyActivityIds(profileId);

  if (activityIds.length === 0) {
    // Aucune activité, retourner une requête qui ne match rien
    return query.eq('id', '00000000-0000-0000-0000-000000000000');
  }

  // Filtrer par IDs
  return query.in('id', activityIds);
}
