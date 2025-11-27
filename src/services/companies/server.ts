import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Type pour une entreprise simple (pour les listes déroulantes)
 */
export type BasicCompany = {
  id: string;
  name: string;
};

/**
 * Charge toutes les entreprises (côté serveur)
 * 
 * @returns Liste des entreprises triées par nom
 * @throws ApplicationError en cas d'erreur critique (pour logging)
 */
export async function listCompanies(): Promise<BasicCompany[]> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('companies')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
      // Logger l'erreur avec plus de détails
      console.error('[listCompanies] Erreur Supabase:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });

      // Vérifier si c'est une erreur de connexion réseau
      const errorMessage = error.message?.toLowerCase() || '';
      const isNetworkError = 
        errorMessage.includes('network') ||
        errorMessage.includes('connection') ||
        errorMessage.includes('gateway') ||
        error.code === 'PGRST116' || // PostgREST connection error
        error.code === 'ECONNREFUSED' ||
        error.code === 'ETIMEDOUT';

      if (isNetworkError) {
        console.error('[listCompanies] Erreur de connexion réseau détectée. Vérifiez la connexion à Supabase.');
      }

      // Retourner un tableau vide pour éviter de casser la page
      // L'erreur est déjà loggée pour le débogage
      return [];
    }

    return (data ?? []) as BasicCompany[];
  } catch (error: unknown) {
    // Gérer les erreurs inattendues (ex: erreur lors de la création du client)
    console.error('[listCompanies] Erreur inattendue:', error);
    
    // Si c'est une erreur de connexion réseau, logger spécifiquement
    if (error instanceof Error) {
      const errorMessage = error.message?.toLowerCase() || '';
      if (
        errorMessage.includes('network') ||
        errorMessage.includes('connection') ||
        errorMessage.includes('gateway') ||
        errorMessage.includes('fetch failed')
      ) {
        console.error('[listCompanies] Erreur de connexion réseau. Impossible de se connecter à Supabase.');
      }
    }

    // Retourner un tableau vide pour éviter de casser la page
    return [];
  }
}

