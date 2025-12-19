/**
 * Utilitaires de cache pour les services dashboard
 * 
 * ⚠️ IMPORTANT : Les fonctions dashboard utilisent `cookies()` pour l'authentification,
 * donc elles ne peuvent PAS utiliser `unstable_cache()` (qui ne supporte pas les sources dynamiques).
 * 
 * On utilise uniquement `React.cache()` pour éviter les appels redondants dans le même render tree.
 * 
 * Pour un cache plus agressif, il faudrait :
 * 1. Créer le client Supabase en dehors de la fonction cachée
 * 2. Passer le client en paramètre
 * 3. Mais cela complique l'API et réduit la sécurité (RLS)
 */

/**
 * Tags de cache pour documentation (non utilisés actuellement)
 * 
 * Ces tags peuvent être utilisés dans le futur si on implémente un cache
 * côté client ou un autre mécanisme de cache.
 */
export const CACHE_TAGS = {
  TICKETS: 'dashboard:tickets',
  ACTIVITIES: 'dashboard:activities',
  TASKS: 'dashboard:tasks',
  PRODUCTS: 'dashboard:products',
  PROFILES: 'dashboard:profiles',
  MTTR: 'dashboard:mttr',
  FLUX: 'dashboard:flux',
  WORKLOAD: 'dashboard:workload',
  HEALTH: 'dashboard:health',
  ALERTS: 'dashboard:alerts',
} as const;

