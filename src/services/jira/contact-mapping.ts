import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Types pour les mappings client/contact
 */
export type SupabaseChannel = 'Whatsapp' | 'Email' | 'Appel' | 'Autre';

export interface JiraChannelMapping {
  id: string;
  jira_channel_value: string;
  supabase_channel: SupabaseChannel;
  created_at: string;
  updated_at: string;
}

/**
 * Mappe un nom de client Jira vers un profile_id Supabase
 * 
 * Crée automatiquement un profil client si non trouvé (sans Auth).
 * 
 * @param jiraClientName - Nom du client depuis Jira (customfield_10053)
 * @param companyId - ID de l'entreprise (optionnel, pour éviter doublons)
 * @returns Le profile_id du contact ou null si erreur
 */
export async function mapJiraClientNameToProfile(
  jiraClientName: string,
  companyId?: string
): Promise<string | null> {
  if (!jiraClientName || jiraClientName.trim() === '') {
    return null;
  }

  const supabase = await createSupabaseServerClient();

  // Rechercher un profil existant
  let query = supabase
    .from('profiles')
    .select('id')
    .eq('role', 'client')
    .eq('full_name', jiraClientName.trim());

  // Si companyId fourni, rechercher aussi par entreprise (éviter doublons)
  if (companyId) {
    query = query.eq('company_id', companyId);
  }

  const { data: existingProfile, error: searchError } = await query.single();

  if (existingProfile && !searchError) {
    return existingProfile.id;
  }

  // Profil non trouvé, créer un nouveau profil client (sans Auth)
  const { data: newProfile, error: createError } = await supabase
    .from('profiles')
    .insert({
      full_name: jiraClientName.trim(),
      role: 'client',
      company_id: companyId || null,
      auth_uid: null, // Pas de compte Auth pour les contacts externes
      is_active: true
    })
    .select('id')
    .single();

  if (createError || !newProfile) {
    console.error(`Erreur lors de la création du profil client "${jiraClientName}":`, createError);
    return null;
  }

  console.log(`✅ Profil client créé: ${jiraClientName} (${newProfile.id})`);
  return newProfile.id;
}

/**
 * Mappe une entreprise Jira vers un company_id Supabase
 * 
 * Recherche d'abord via jira_company_id, puis par nom.
 * Crée automatiquement une entreprise si non trouvée.
 * 
 * @param jiraCompanyValue - Nom de l'entreprise depuis Jira (customfield_10045.value)
 * @param jiraCompanyId - ID de l'option Jira (customfield_10045.id)
 * @returns Le company_id ou null si erreur
 */
export async function mapJiraCompanyToCompanyId(
  jiraCompanyValue: string,
  jiraCompanyId?: number
): Promise<string | null> {
  if (!jiraCompanyValue || jiraCompanyValue.trim() === '') {
    return null;
  }

  const supabase = await createSupabaseServerClient();

  // 1. Rechercher via jira_company_id (mapping direct)
  if (jiraCompanyId) {
    const { data: companyById, error: errorById } = await supabase
      .from('companies')
      .select('id')
      .eq('jira_company_id', jiraCompanyId)
      .single();

    if (companyById && !errorById) {
      return companyById.id;
    }
  }

  // 2. Rechercher par nom (correspondance exacte)
  const { data: companyByName, error: errorByName } = await supabase
    .from('companies')
    .select('id')
    .eq('name', jiraCompanyValue.trim())
    .single();

  if (companyByName && !errorByName) {
    // Mettre à jour jira_company_id si manquant
    if (jiraCompanyId && !companyByName.jira_company_id) {
      await supabase
        .from('companies')
        .update({ jira_company_id: jiraCompanyId })
        .eq('id', companyByName.id);
    }
    return companyByName.id;
  }

  // 3. Entreprise non trouvée, créer une nouvelle
  const { data: newCompany, error: createError } = await supabase
    .from('companies')
    .insert({
      name: jiraCompanyValue.trim(),
      jira_company_id: jiraCompanyId || null
    })
    .select('id')
    .single();

  if (createError || !newCompany) {
    console.error(`Erreur lors de la création de l'entreprise "${jiraCompanyValue}":`, createError);
    return null;
  }

  console.log(`✅ Entreprise créée: ${jiraCompanyValue} (${newCompany.id})`);
  return newCompany.id;
}

/**
 * Mappe un canal de contact Jira vers un canal Supabase
 * 
 * @param jiraChannelValue - Valeur du canal Jira (customfield_10055.value)
 * @returns Le canal Supabase correspondant ou null si aucun mapping trouvé
 */
export async function getSupabaseChannelFromJira(
  jiraChannelValue: string
): Promise<SupabaseChannel | null> {
  if (!jiraChannelValue || jiraChannelValue.trim() === '') {
    return null;
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('jira_channel_mapping')
    .select('supabase_channel')
    .eq('jira_channel_value', jiraChannelValue.trim())
    .single();

  if (error || !data) {
    console.warn(`Aucun mapping trouvé pour le canal Jira "${jiraChannelValue}"`);
    return null;
  }

  return data.supabase_channel as SupabaseChannel;
}

/**
 * Met à jour le job_title d'un profil depuis Jira
 * 
 * @param profileId - ID du profil à mettre à jour
 * @param jiraJobTitle - Fonction/poste depuis Jira (customfield_10054.value)
 */
export async function updateProfileJobTitle(
  profileId: string,
  jiraJobTitle: string
): Promise<void> {
  if (!profileId || !jiraJobTitle || jiraJobTitle.trim() === '') {
    return;
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from('profiles')
    .update({ job_title: jiraJobTitle.trim() })
    .eq('id', profileId);

  if (error) {
    console.error(`Erreur lors de la mise à jour du job_title pour ${profileId}:`, error);
  }
}

/**
 * Récupère tous les mappings de canaux
 * 
 * @returns Liste de tous les mappings de canaux
 */
export async function getAllChannelMappings(): Promise<JiraChannelMapping[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('jira_channel_mapping')
    .select('*')
    .order('jira_channel_value', { ascending: true });

  if (error) {
    console.error('Erreur lors de la récupération des mappings de canaux:', error);
    return [];
  }

  return data || [];
}

