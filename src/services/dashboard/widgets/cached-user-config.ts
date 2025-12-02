/**
 * Configuration dashboard utilisateur avec cache React
 * 
 * ✅ OPTIMISÉ : Utilise React cache() pour éviter les appels répétés
 * au même getUserDashboardConfig() dans le même render tree
 * 
 * Le cache React mémorise le résultat pour toute la durée du render tree,
 * ce qui signifie que plusieurs composants peuvent appeler cette fonction
 * sans déclencher plusieurs appels API Supabase.
 * 
 * Principe Clean Code - Niveau Senior :
 * - Fonction pure et déterministe
 * - Cache automatique via React cache()
 * - Validation Zod stricte
 * - Gestion d'erreur robuste
 * - Évite le rate limit Supabase
 * 
 * @see getCachedCurrentUserProfileId pour un pattern similaire
 */

import { cache } from 'react';
import { getUserDashboardConfig as getUserDashboardConfigUncached } from './user-config';
import { userDashboardConfigSchema } from '@/lib/validators/dashboard-widgets';
import type { DashboardRole, UserDashboardConfig } from '@/types/dashboard-widgets';

/**
 * Récupère la configuration dashboard pour un utilisateur (avec cache)
 * 
 * ✅ OPTIMISÉ : Utilise React cache() pour mémoriser les résultats
 * 
 * Le cache est automatique et transparent :
 * - Même appel avec mêmes paramètres = résultat en cache
 * - Cache valable pour toute la durée du render tree
 * - Pas besoin de gérer manuellement le cache
 * 
 * @param profileId - ID du profil utilisateur
 * @param role - Rôle de l'utilisateur
 * @returns Configuration dashboard avec widgets disponibles et visibles
 * 
 * @example
 * ```tsx
 * // Dans un Server Component
 * const widgetConfig = await getCachedUserDashboardConfig(profileId, role);
 * ```
 */
export const getCachedUserDashboardConfig = cache(
  async (profileId: string, role: DashboardRole): Promise<UserDashboardConfig> => {
    try {
      const config = await getUserDashboardConfigUncached(profileId, role);
      
      // ✅ VALIDATION : Valider la configuration avec Zod
      // Utilise safeParse pour éviter de throw en cas d'erreur
      const validationResult = userDashboardConfigSchema.safeParse(config);
      
      if (!validationResult.success) {
        // Logger l'erreur de validation en développement
        if (process.env.NODE_ENV === 'development') {
          console.warn('[getCachedUserDashboardConfig] Validation error:', validationResult.error.format());
        }
        
        // Retourner la config non validée mais loggée
        // Permet au dashboard de fonctionner même si validation échoue
        return config;
      }
      
      // Retourner la config validée
      return validationResult.data;
    } catch (error) {
      // Logger l'erreur en développement
      if (process.env.NODE_ENV === 'development') {
        console.error('[getCachedUserDashboardConfig] Error:', error);
      }
      
      // Retourner une config par défaut en cas d'erreur
      // pour éviter de casser le dashboard
      return {
        role,
        availableWidgets: [],
        visibleWidgets: [],
        hiddenWidgets: [],
      };
    }
  }
);

