/**
 * Service pour la navigation entre entreprises (prev/next)
 * 
 * Pattern identique à getAdjacentTickets pour cohérence
 * 
 * Stratégie : Tri alphabétique par nom
 * - Simple, fiable, pas de session state nécessaire
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';

export type AdjacentCompanies = {
  previous: string | null;
  next: string | null;
};

/**
 * Récupère les IDs des entreprises adjacentes (précédente et suivante) basés sur l'ordre alphabétique
 *
 * ✅ Optimisation Phase 4 : Parallélisation des requêtes
 * - Requêtes prev/next en parallèle après avoir récupéré le nom
 * - Réduction du temps total d'exécution
 *
 * @param companyId - ID de l'entreprise actuelle
 * @returns Objet avec les IDs précédent et suivant (null si aucun)
 */
export async function getAdjacentCompanies(companyId: string): Promise<AdjacentCompanies> {
  const supabase = await createSupabaseServerClient();

  // Récupérer le nom de l'entreprise actuelle
  const { data: currentCompany, error: currentError } = await supabase
    .from('companies')
    .select('name')
    .eq('id', companyId)
    .single();

  if (currentError || !currentCompany) {
    return { previous: null, next: null };
  }

  // ✅ Paralléliser les requêtes prev/next
  const [prevCompany, nextCompany] = await Promise.all([
    // Récupérer l'entreprise précédente (nom < nom actuel, ordre décroissant)
    supabase
      .from('companies')
      .select('id')
      .lt('name', currentCompany.name)
      .order('name', { ascending: false })
      .limit(1)
      .maybeSingle(),
    // Récupérer l'entreprise suivante (nom > nom actuel, ordre croissant)
    supabase
      .from('companies')
      .select('id')
      .gt('name', currentCompany.name)
      .order('name', { ascending: true })
      .limit(1)
      .maybeSingle()
  ]);

  return {
    previous: prevCompany.data?.id ?? null,
    next: nextCompany.data?.id ?? null
  };
}

