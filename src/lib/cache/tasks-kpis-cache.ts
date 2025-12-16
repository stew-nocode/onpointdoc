/**
 * Cache pour les KPIs de tâches
 *
 * Utilise React cache() au lieu de unstable_cache car les KPIs dépendent
 * de la session utilisateur (via cookies).
 *
 * Optimisation:
 * - Cache au niveau de la requête (React cache)
 * - Évite les requêtes multiples pendant le même rendu
 * - Pas de cache persistant entre requêtes (car dépend de cookies)
 *
 * Note: unstable_cache ne peut PAS être utilisé ici car:
 * 1. Le client Supabase utilise cookies() (source dynamique)
 * 2. Le client Supabase n'est pas sérialisable (références circulaires)
 *
 * @see src/services/tasks/task-kpis-optimized.ts
 */

import { cache } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getTaskKPIsOptimized } from '@/services/tasks/task-kpis-optimized';

/**
 * Récupère les KPIs de tâches avec cache au niveau requête
 *
 * Utilise React cache() pour dédupliquer les appels pendant le même rendu.
 * Le cache est automatiquement invalidé entre chaque requête.
 *
 * Note: Pour un cache persistant avec revalidation, il faudrait :
 * - Soit stocker les KPIs dans une table Supabase avec timestamp
 * - Soit utiliser un cache externe (Redis, Vercel KV)
 * - unstable_cache n'est pas compatible avec cookies()
 *
 * @param profileId - ID du profil utilisateur
 * @returns KPIs de tâches
 *
 * @example
 * ```typescript
 * // Dans une page ou composant serveur
 * const kpis = await getCachedTaskKPIs(profileId);
 * ```
 */
export const getCachedTaskKPIs = cache(async (profileId: string | null) => {
  if (!profileId) {
    // Retourner des valeurs vides si pas de profil
    return {
      myTasksTodo: 0,
      myTasksCompletedThisMonth: 0,
      tasksOverdue: 0,
      myTasksInProgress: 0,
      trends: {
        myTasksTodoTrend: 0,
        myTasksCompletedTrend: 0,
        tasksOverdueTrend: 0,
        myTasksInProgressTrend: 0
      },
      chartData: {
        todoData: [0, 0, 0, 0, 0, 0, 0],
        completedData: [0, 0, 0, 0, 0, 0, 0],
        overdueData: [0, 0, 0, 0, 0, 0, 0],
        inProgressData: [0, 0, 0, 0, 0, 0, 0]
      }
    };
  }

  const supabase = await createSupabaseServerClient();
  return await getTaskKPIsOptimized(supabase, profileId);
});

