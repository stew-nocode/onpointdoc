import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Types pour les mappings fonctionnalités
 */
export interface JiraFeatureMapping {
  id: string;
  jira_feature_value: string;
  feature_id: string | null;
  jira_custom_field_id: string;
  jira_feature_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Mappe une fonctionnalité Jira vers un feature_id Supabase
 * 
 * @param jiraFeatureValue - Valeur du champ Jira (ex: "Finance - Comptabilité Générale")
 * @param jiraCustomFieldId - ID du champ personnalisé Jira (défaut: "customfield_10052")
 * @returns Le feature_id Supabase ou null si aucun mapping trouvé
 */
export async function getFeatureIdFromJira(
  jiraFeatureValue: string,
  jiraCustomFieldId: string = 'customfield_10052'
): Promise<string | null> {
  if (!jiraFeatureValue || jiraFeatureValue.trim() === '') {
    return null;
  }

  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from('jira_feature_mapping')
    .select('feature_id')
    .eq('jira_feature_value', jiraFeatureValue.trim())
    .eq('jira_custom_field_id', jiraCustomFieldId)
    .single();

  if (error || !data || !data.feature_id) {
    console.warn(
      `Aucun mapping trouvé pour la fonctionnalité Jira "${jiraFeatureValue}" (${jiraCustomFieldId})`
    );
    return null;
  }

  return data.feature_id;
}

/**
 * Récupère le submodule_id depuis un feature_id
 * 
 * @param featureId - ID de la feature Supabase
 * @returns Le submodule_id ou null si non trouvé
 */
export async function getSubmoduleIdFromFeatureId(
  featureId: string
): Promise<string | null> {
  if (!featureId) {
    return null;
  }

  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from('features')
    .select('submodule_id')
    .eq('id', featureId)
    .single();

  if (error || !data) {
    console.warn(`Feature "${featureId}" non trouvée ou sans submodule_id`);
    return null;
  }

  return data.submodule_id;
}

/**
 * Mappe une fonctionnalité Jira et retourne feature_id + submodule_id
 * 
 * Fonction utilitaire qui combine getFeatureIdFromJira et getSubmoduleIdFromFeatureId
 * 
 * @param jiraFeatureValue - Valeur du champ Jira
 * @param jiraCustomFieldId - ID du champ personnalisé Jira
 * @returns Objet avec feature_id et submodule_id, ou null si aucun mapping
 */
export async function mapJiraFeatureToSupabase(
  jiraFeatureValue: string,
  jiraCustomFieldId: string = 'customfield_10052'
): Promise<{ featureId: string; submoduleId: string } | null> {
  const featureId = await getFeatureIdFromJira(jiraFeatureValue, jiraCustomFieldId);
  
  if (!featureId) {
    return null;
  }

  const submoduleId = await getSubmoduleIdFromFeatureId(featureId);
  
  if (!submoduleId) {
    // Feature trouvée mais sans submodule_id (cas rare)
    console.warn(`Feature "${featureId}" trouvée mais sans submodule_id`);
    return { featureId, submoduleId: null as any };
  }

  return { featureId, submoduleId };
}

/**
 * Crée ou met à jour un mapping fonctionnalité Jira → Supabase
 * 
 * @param jiraFeatureValue - Valeur du champ Jira
 * @param featureId - ID de la feature Supabase
 * @param jiraCustomFieldId - ID du champ personnalisé Jira
 * @param jiraFeatureId - ID de l'option Jira (optionnel)
 * @returns Le mapping créé/mis à jour ou null si erreur
 */
export async function upsertFeatureMapping(
  jiraFeatureValue: string,
  featureId: string,
  jiraCustomFieldId: string = 'customfield_10052',
  jiraFeatureId?: string
): Promise<JiraFeatureMapping | null> {
  if (!jiraFeatureValue || !featureId) {
    console.error('jiraFeatureValue et featureId sont requis');
    return null;
  }

  const supabase = createSupabaseServerClient();

  const mappingData: Partial<JiraFeatureMapping> = {
    jira_feature_value: jiraFeatureValue.trim(),
    feature_id: featureId,
    jira_custom_field_id: jiraCustomFieldId,
    updated_at: new Date().toISOString()
  };

  if (jiraFeatureId) {
    mappingData.jira_feature_id = jiraFeatureId;
  }

  const { data, error } = await supabase
    .from('jira_feature_mapping')
    .upsert(mappingData, {
      onConflict: 'jira_feature_value,jira_custom_field_id',
      ignoreDuplicates: false
    })
    .select()
    .single();

  if (error) {
    console.error(`Erreur lors de la création/mise à jour du mapping: ${error.message}`);
    return null;
  }

  return data;
}

/**
 * Récupère tous les mappings de fonctionnalités
 * 
 * @param jiraCustomFieldId - Filtrer par ID de champ personnalisé (optionnel)
 * @returns Liste de tous les mappings
 */
export async function getAllFeatureMappings(
  jiraCustomFieldId?: string
): Promise<JiraFeatureMapping[]> {
  const supabase = createSupabaseServerClient();

  let query = supabase
    .from('jira_feature_mapping')
    .select('*')
    .order('jira_feature_value', { ascending: true });

  if (jiraCustomFieldId) {
    query = query.eq('jira_custom_field_id', jiraCustomFieldId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Erreur lors de la récupération des mappings de fonctionnalités:', error);
    return [];
  }

  return data || [];
}

/**
 * Recherche des features Supabase par nom (pour aide au mapping)
 * 
 * @param searchTerm - Terme de recherche (nom de feature ou module)
 * @returns Liste de features correspondantes avec leurs informations
 */
export async function searchFeaturesByName(
  searchTerm: string
): Promise<Array<{
  id: string;
  name: string;
  submodule_id: string;
  submodule_name: string | null;
  module_name: string | null;
}>> {
  if (!searchTerm || searchTerm.trim() === '') {
    return [];
  }

  const supabase = createSupabaseServerClient();

  // Recherche dans features avec jointure vers submodules et modules
  const { data, error } = await supabase
    .from('features')
    .select(`
      id,
      name,
      submodule_id,
      sub_modules!inner (
        id,
        name,
        modules!inner (
          id,
          name
        )
      )
    `)
    .ilike('name', `%${searchTerm.trim()}%`)
    .limit(20);

  if (error) {
    console.error('Erreur lors de la recherche de features:', error);
    return [];
  }

  // Transformer les données pour faciliter l'utilisation
  return (data || []).map((feature: any) => ({
    id: feature.id,
    name: feature.name,
    submodule_id: feature.submodule_id,
    submodule_name: feature.sub_modules?.name || null,
    module_name: feature.sub_modules?.modules?.name || null
  }));
}

