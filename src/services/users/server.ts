import { createSupabaseServerClient, createSupabaseServiceRoleClient } from '@/lib/supabase/server';

/**
 * Type pour un profil utilisateur basique (id, nom, email, entreprise)
 * 
 * Inclut les informations d'entreprise pour permettre l'affichage formaté
 * "Nom - Entreprise" et l'auto-remplissage dans les formulaires
 */
export type BasicProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  company_id: string | null;
  company_name: string | null;
};

/**
 * Récupère le rôle de l'utilisateur authentifié côté serveur
 * 
 * @returns Rôle de l'utilisateur ou null si non authentifié
 */
export async function getCurrentUserRole(): Promise<string | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('auth_uid', user.id)
      .single();

    return profile?.role ?? null;
  } catch {
    return null;
  }
}

/**
 * Récupère l'ID du profil de l'utilisateur authentifié côté serveur
 * 
 * @returns ID du profil ou null si non authentifié
 */
export async function getCurrentUserProfileId(): Promise<string | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_uid', user.id)
      .single();

    return profile?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Récupère le profil complet de l'utilisateur authentifié côté serveur
 * 
 * @returns Profil complet ou null si non authentifié
 */
export async function getCurrentUserProfile(): Promise<{
  id: string;
  role: string;
  department?: string | null;
  full_name?: string | null;
} | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, department, full_name')
      .eq('auth_uid', user.id)
      .single();

    if (!profile) return null;

    return {
      id: profile.id,
      role: profile.role,
      department: profile.department,
      full_name: profile.full_name,
    };
  } catch {
    return null;
  }
}

/**
 * Liste tous les profils utilisateurs basiques avec leurs informations d'entreprise
 * 
 * @returns Liste des profils avec id, full_name, email, company_id, company_name
 */
/**
 * Liste uniquement les agents du département Support
 * 
 * Principe Clean Code - Niveau Senior :
 * - SRP : Fonction dédiée à un besoin spécifique (agents support uniquement)
 * - Type-safe : Retourne le même type BasicProfile pour cohérence
 * - Performance : Filtre au niveau base de données (pas de filtrage en mémoire)
 * 
 * @returns Liste des profils agents support avec id, full_name, email, company_id, company_name
 * 
 * @example
 * ```tsx
 * const agents = await listSupportAgents();
 * // [{ id: '...', full_name: 'Agent Support', email: '...', ... }, ...]
 * ```
 */
export async function listSupportAgents(): Promise<BasicProfile[]> {
  try {
    // ✅ Utiliser le service role client pour contourner les RLS
    // Cette fonction doit lister TOUS les agents support, pas seulement ceux visibles par l'utilisateur
    // C'est une fonction administrative utilisée par les managers pour filtrer les tickets
    const supabase = createSupabaseServiceRoleClient();
    
    // ✅ D'après la vérification de l'enum user_role_t via MCP Supabase :
    // L'enum contient : {agent,manager,admin,director,client}
    // Il n'y a PAS de valeur 'agent_support' dans l'enum
    // Les agents support ont : role = 'agent' AND department = 'Support'
    
    // Requête unique : Agents avec role = 'agent' AND department = 'Support'
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email, company_id')
      .eq('role', 'agent')
      .eq('department', 'Support')
      .order('full_name', { ascending: true });

    // ✅ Gestion d'erreur améliorée
    if (profilesError) {
      const hasErrorDetails = profilesError.code || profilesError.message || Object.keys(profilesError).length > 0;
      
      if (hasErrorDetails) {
        console.error('[listSupportAgents] Erreur lors de la récupération des agents support:', {
          code: profilesError.code,
          message: profilesError.message,
          details: profilesError.details,
          hint: profilesError.hint,
          fullError: profilesError
        });
        
        // Ne pas throw si c'est juste une liste vide (PGRST116 = no rows returned)
        if (profilesError.code && profilesError.code !== 'PGRST116') {
          throw profilesError;
        }
      } else {
        console.warn('[listSupportAgents] Erreur vide détectée (possible problème RLS)');
      }
    }

    if (!profiles || profiles.length === 0) {
      console.warn('[listSupportAgents] Aucun agent support trouvé');
      return [];
    }

    // Récupérer les company_id uniques
    const companyIds = [...new Set(profiles.map((p) => p.company_id).filter((id): id is string => id !== null))];

    // Récupérer les entreprises si nécessaire
    let companiesMap = new Map<string, string>();
    if (companyIds.length > 0) {
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('id, name')
        .in('id', companyIds);

      if (companiesError) {
        console.error('[listSupportAgents] Erreur lors de la récupération des entreprises:', {
          code: companiesError.code,
          message: companiesError.message,
          details: companiesError.details,
          hint: companiesError.hint
        });
        // Ne pas faire échouer la fonction si les entreprises ne peuvent pas être chargées
      } else if (companies) {
        companiesMap = new Map(companies.map((c) => [c.id, c.name]));
      }
    }

    // Mapper les profils avec les noms d'entreprises
    const mapped: BasicProfile[] = profiles.map((p) => ({
      id: p.id,
      full_name: p.full_name,
      email: p.email,
      company_id: p.company_id,
      company_name: p.company_id ? companiesMap.get(p.company_id) ?? null : null,
    }));

    console.log('[listSupportAgents]', mapped.length, 'agents support chargés');
    return mapped;
  } catch (error) {
    console.error('[listSupportAgents] Erreur lors du chargement des agents support:', error);
    // Retourner un tableau vide pour éviter de casser la page, mais logger l'erreur
    return [];
  }
}

/**
 * Liste tous les profils utilisateurs basiques avec leurs informations d'entreprise
 * 
 * Utilise deux requêtes séparées pour éviter les problèmes de jointure Supabase
 * 
 * @returns Liste des profils avec id, full_name, email, company_id, company_name
 */
export async function listBasicProfiles(): Promise<BasicProfile[]> {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Première requête : récupérer les profils
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email, company_id')
      .order('full_name', { ascending: true });

    if (profilesError) {
      console.error('[listBasicProfiles] Erreur lors de la récupération des profils:', {
        code: profilesError.code,
        message: profilesError.message,
        details: profilesError.details,
        hint: profilesError.hint
      });
      throw profilesError;
    }

    if (!profiles || profiles.length === 0) {
      console.warn('[listBasicProfiles] Aucun profil trouvé');
      return [];
    }

    // Récupérer les company_id uniques
    const companyIds = [...new Set(profiles.map((p) => p.company_id).filter((id): id is string => id !== null))];

    // Deuxième requête : récupérer les entreprises si nécessaire
    let companiesMap = new Map<string, string>();
    if (companyIds.length > 0) {
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('id, name')
        .in('id', companyIds);

      if (companiesError) {
        console.error('[listBasicProfiles] Erreur lors de la récupération des entreprises:', {
          code: companiesError.code,
          message: companiesError.message,
          details: companiesError.details,
          hint: companiesError.hint
        });
        // Ne pas faire échouer la fonction si les entreprises ne peuvent pas être chargées
        // On retournera les profils sans les noms d'entreprises
      } else if (companies) {
        companiesMap = new Map(companies.map((c) => [c.id, c.name]));
      }
    }

    // Mapper les profils avec les noms d'entreprises
    const mapped: BasicProfile[] = profiles.map((p) => ({
      id: p.id,
      full_name: p.full_name,
      email: p.email,
      company_id: p.company_id,
      company_name: p.company_id ? companiesMap.get(p.company_id) ?? null : null,
    }));

    console.log('[listBasicProfiles]', mapped.length, 'contacts chargés');
    return mapped;
  } catch (error) {
    console.error('[listBasicProfiles] Erreur lors du chargement des profils:', error);
    // Retourner un tableau vide pour éviter de casser la page, mais logger l'erreur
    return [];
  }
}
