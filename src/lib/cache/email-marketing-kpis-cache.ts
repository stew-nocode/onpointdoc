/**
 * Cache pour les KPIs Email Marketing
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
 * @see src/services/email-marketing/email-kpis.ts
 */

import { cache } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getEmailMarketingKPIs } from '@/services/email-marketing/email-kpis';
import type { EmailMarketingKPIs } from '@/services/email-marketing/email-kpis';

/**
 * Récupère les KPIs Email Marketing avec cache au niveau requête
 *
 * Utilise React cache() pour dédupliquer les appels pendant le même rendu.
 * Le cache est automatiquement invalidé entre chaque requête.
 *
 * Note: Pour un cache persistant avec revalidation, il faudrait :
 * - Soit stocker les KPIs dans une table Supabase avec timestamp
 * - Soit utiliser un cache externe (Redis, Vercel KV)
 * - unstable_cache n'est pas compatible avec cookies()
 *
 * @returns KPIs Email Marketing
 *
 * @example
 * ```typescript
 * // Dans une page ou composant serveur
 * const kpis = await getCachedEmailMarketingKPIs();
 * ```
 */
export const getCachedEmailMarketingKPIs = cache(async (): Promise<EmailMarketingKPIs> => {
  const supabase = await createSupabaseServerClient();
  return await getEmailMarketingKPIs(supabase);
});
