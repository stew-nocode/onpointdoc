import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Types pour les mappings client/contact
 * 
 * Tous les canaux JIRA sont maintenant directement dans l'enum canal_t Supabase
 * Mapping one-to-one : pas besoin de table de mapping
 */
export type SupabaseChannel = 
  | 'Whatsapp'
  | 'Email'
  | 'Appel'
  | 'Autre'
  | 'Appel Téléphonique'
  | 'Appel WhatsApp'
  | 'Chat SMS'
  | 'Chat WhatsApp'
  | 'Constat Interne'
  | 'E-mail'
  | 'En présentiel'
  | 'En prsentiel'
  | 'Non enregistré'
  | 'Online (Google Meet, Teams...)';

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
    .select('id, jira_company_id')
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
 * Retourne le canal Supabase correspondant à un canal JIRA
 * 
 * Mapping one-to-one : la valeur JIRA correspond directement à la valeur Supabase
 * La validation se fera lors de l'insertion dans Supabase (enum canal_t)
 * 
 * @param jiraChannelValue - Valeur du canal Jira (customfield_10055.value)
 * @returns Le canal Supabase (identique à JIRA) ou null si valeur vide
 */
export async function getSupabaseChannelFromJira(
  jiraChannelValue: string
): Promise<SupabaseChannel | null> {
  if (!jiraChannelValue || jiraChannelValue.trim() === '') {
    return null;
  }

  // Mapping one-to-one : retourner la valeur JIRA telle quelle
  // La validation se fera automatiquement par Supabase lors de l'insertion
  return jiraChannelValue.trim() as SupabaseChannel;
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
 * Récupère tous les canaux disponibles dans l'enum canal_t
 * 
 * @deprecated Utiliser directement l'enum canal_t via ticketChannels depuis @/lib/validators/ticket
 * @returns Liste de tous les canaux (mapping one-to-one avec JIRA)
 */
export async function getAllChannelMappings(): Promise<JiraChannelMapping[]> {
  // Retourner les canaux depuis l'enum (via ticketChannels)
  const { ticketChannels } = await import('@/lib/validators/ticket');
  
  return ticketChannels.map((channel) => ({
    id: channel, // Utiliser la valeur comme ID
    jira_channel_value: channel,
    supabase_channel: channel as SupabaseChannel,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
}

