import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseStatusFromJira, getSupabasePriorityFromJira, TicketType } from './mapping';
import {
  mapJiraClientNameToProfile,
  mapJiraCompanyToCompanyId,
  getSupabaseChannelFromJira,
  updateProfileJobTitle
} from './contact-mapping';
import { mapJiraFeatureToSupabase } from './feature-mapping';

/**
 * Interface pour les données Jira issues d'un webhook ou de l'API
 */
export interface JiraIssueData {
  key: string;
  id: string;
  summary: string;
  description?: string;
  status: {
    name: string;
  };
  priority: {
    name: string;
  };
  issuetype: {
    name: string;
  };
  reporter?: {
    accountId: string;
    displayName?: string;
  };
  assignee?: {
    accountId: string;
    displayName?: string;
  };
  resolution?: {
    name: string;
  };
  fixVersions?: Array<{
    name: string;
  }>;
  created: string;
  updated: string;
  labels?: string[];
  components?: Array<{
    name: string;
  }>;
  customfield_10020?: {
    id: string;
    name?: string;
    value?: string;
  } | string; // Sprint
  // Phase 4: Champs workflow et suivi
  customfield_10083?: {
    value: string;
    id: string;
  } | string; // Workflow status
  customfield_10084?: {
    value: string;
    id: string;
  } | string; // Test status
  customfield_10021?: {
    value: string;
    id: string;
  } | string; // Issue type (Bug, Impediment, etc.)
  customfield_10057?: string; // Related ticket key
  customfield_10111?: string; // Target date
  customfield_10115?: string; // Resolved at
  // Phase 2: Champs client/contact
  customfield_10053?: string; // Nom du client
  customfield_10054?: {
    value: string;
    id: string;
  }; // Fonction/Poste
  customfield_10045?: {
    value: string;
    id: string | number;
  }; // Entreprise
  customfield_10055?: {
    value: string;
    id: string;
  }; // Canal de contact
  // Phase 3: Structure produit/module
  customfield_10052?: {
    value: string;
    id: string;
  }; // Module/Fonctionnalité
}

/**
 * Synchronise les données d'un ticket Jira vers Supabase
 * 
 * @param ticketId - UUID du ticket Supabase
 * @param jiraData - Données du ticket Jira
 * @returns Le ticket mis à jour
 */
export async function syncJiraToSupabase(
  ticketId: string,
  jiraData: JiraIssueData
): Promise<void> {
  const supabase = await createSupabaseServerClient();

  // 1. Déterminer le type de ticket
  const ticketType = mapJiraIssueTypeToTicketType(jiraData.issuetype.name);

  // 2. Mapper le statut Jira vers Supabase
  const supabaseStatus = await getSupabaseStatusFromJira(jiraData.status.name, ticketType);

  // 3. Mapper la priorité Jira vers Supabase
  const supabasePriority = await getSupabasePriorityFromJira(jiraData.priority.name);

  // 4. Mapper les utilisateurs (reporter et assignee)
  const createdBy = jiraData.reporter?.accountId
    ? await mapJiraAccountIdToProfileId(jiraData.reporter.accountId)
    : null;

  const assignedTo = jiraData.assignee?.accountId
    ? await mapJiraAccountIdToProfileId(jiraData.assignee.accountId)
    : null;

  // Phase 2: Mapper le client/contact et l'entreprise
  let contactUserId: string | null = null;
  let companyId: string | null = null;

  if (jiraData.customfield_10045) {
    // Mapper l'entreprise d'abord
    const jiraCompanyId = typeof jiraData.customfield_10045.id === 'string'
      ? parseInt(jiraData.customfield_10045.id, 10)
      : jiraData.customfield_10045.id;
    
    companyId = await mapJiraCompanyToCompanyId(
      jiraData.customfield_10045.value,
      jiraCompanyId
    );
  }

  if (jiraData.customfield_10053) {
    // Mapper le client (avec companyId pour éviter doublons)
    contactUserId = await mapJiraClientNameToProfile(
      jiraData.customfield_10053,
      companyId || undefined
    );

    // Mettre à jour le job_title si fourni
    if (contactUserId && jiraData.customfield_10054?.value) {
      await updateProfileJobTitle(contactUserId, jiraData.customfield_10054.value);
    }
  }

  // Phase 2: Mapper le canal de contact
  let supabaseChannel: string | null = null;
  if (jiraData.customfield_10055?.value) {
    const channel = await getSupabaseChannelFromJira(jiraData.customfield_10055.value);
    if (channel) {
      supabaseChannel = channel;
    }
  }

  // Phase 3: Mapper la fonctionnalité/module
  let featureId: string | null = null;
  let submoduleId: string | null = null;
  if (jiraData.customfield_10052?.value) {
    const featureMapping = await mapJiraFeatureToSupabase(
      jiraData.customfield_10052.value,
      'customfield_10052'
    );
    
    if (featureMapping) {
      featureId = featureMapping.featureId;
      submoduleId = featureMapping.submoduleId;
    }
  }

  // 5. Préparer les données de mise à jour
  const ticketUpdate: Record<string, any> = {
    title: jiraData.summary,
    description: jiraData.description || null,
    updated_at: jiraData.updated,
    last_update_source: 'jira'
  };

  if (supabaseStatus) {
    ticketUpdate.status = supabaseStatus;
  }

  if (supabasePriority) {
    ticketUpdate.priority = supabasePriority;
  }

  if (createdBy) {
    ticketUpdate.created_by = createdBy;
  }

  if (assignedTo) {
    ticketUpdate.assigned_to = assignedTo;
  }

  if (jiraData.resolution?.name) {
    ticketUpdate.resolution = jiraData.resolution.name;
  }

  if (jiraData.fixVersions && jiraData.fixVersions.length > 0) {
    ticketUpdate.fix_version = jiraData.fixVersions[0].name;
  }

  // Phase 2: Ajouter les champs client/contact
  if (contactUserId) {
    ticketUpdate.contact_user_id = contactUserId;
  }

  if (supabaseChannel) {
    ticketUpdate.canal = supabaseChannel;
  }

  // Phase 3: Ajouter les champs fonctionnalité/module
  if (featureId) {
    ticketUpdate.feature_id = featureId;
  }

  if (submoduleId) {
    ticketUpdate.submodule_id = submoduleId;
  }

  // Phase 4: Ajouter les champs workflow et suivi
  if (jiraData.customfield_10083) {
    // Workflow status
    const workflowStatus = typeof jiraData.customfield_10083 === 'string'
      ? jiraData.customfield_10083
      : jiraData.customfield_10083?.value || null;
    if (workflowStatus) {
      ticketUpdate.workflow_status = workflowStatus;
    }
  }

  if (jiraData.customfield_10084) {
    // Test status
    const testStatus = typeof jiraData.customfield_10084 === 'string'
      ? jiraData.customfield_10084
      : jiraData.customfield_10084?.value || null;
    if (testStatus) {
      ticketUpdate.test_status = testStatus;
    }
  }

  if (jiraData.customfield_10021) {
    // Issue type (Bug, Impediment, etc.)
    const issueType = typeof jiraData.customfield_10021 === 'string'
      ? jiraData.customfield_10021
      : jiraData.customfield_10021?.value || null;
    if (issueType) {
      ticketUpdate.issue_type = issueType;
    }
  }

  if (jiraData.customfield_10020) {
    // Sprint
    const sprint = typeof jiraData.customfield_10020 === 'string'
      ? jiraData.customfield_10020
      : jiraData.customfield_10020?.name || jiraData.customfield_10020?.value || null;
    if (sprint) {
      ticketUpdate.sprint_id = sprint;
    }
  }

  if (jiraData.customfield_10057) {
    // Related ticket key
    ticketUpdate.related_ticket_key = jiraData.customfield_10057;
    
    // Tenter de trouver le ticket lié dans Supabase
    const relatedTicket = await findTicketByJiraKey(jiraData.customfield_10057);
    if (relatedTicket) {
      ticketUpdate.related_ticket_id = relatedTicket.id;
    }
  }

  if (jiraData.customfield_10111) {
    // Target date
    ticketUpdate.target_date = jiraData.customfield_10111;
  }

  if (jiraData.customfield_10115) {
    // Resolved at
    ticketUpdate.resolved_at = jiraData.customfield_10115;
  }

  // Phase 5: Mapper les champs spécifiques produits dans custom_fields
  const productSpecificFieldIds = [
    'customfield_10297', // OBC - Opérations
    'customfield_10298', // OBC - Finance
    'customfield_10300', // OBC - RH
    'customfield_10299', // OBC - Projets
    'customfield_10301', // OBC - CRM
    'customfield_10313', // Finance
    'customfield_10324', // RH
    'customfield_10364'  // Paramétrage admin
  ];

  const customFields: Record<string, any> = {
    product_specific: {},
    metadata: {
      jira_custom_field_ids: [],
      last_updated: new Date().toISOString()
    }
  };

  for (const fieldId of productSpecificFieldIds) {
    const fieldValue = (jiraData as any)[fieldId];
    if (fieldValue) {
      // Extraire la valeur (peut être string, object avec value/name, ou array)
      let value: string | null = null;
      
      if (typeof fieldValue === 'string') {
        value = fieldValue;
      } else if (Array.isArray(fieldValue)) {
        value = fieldValue.map((v: any) => 
          typeof v === 'string' ? v : v?.value || v?.name || null
        ).filter(Boolean).join(', ');
      } else if (fieldValue && typeof fieldValue === 'object') {
        value = fieldValue.value || fieldValue.name || null;
      }
      
      if (value) {
        customFields.product_specific[fieldId] = value;
        customFields.metadata.jira_custom_field_ids.push(fieldId);
      }
    }
  }

  // Ajouter custom_fields au ticketUpdate si non vide
  if (Object.keys(customFields.product_specific).length > 0) {
    ticketUpdate.custom_fields = customFields;
  }

  // 6. Mettre à jour le ticket
  const { error: ticketError } = await supabase
    .from('tickets')
    .update(ticketUpdate)
    .eq('id', ticketId);

  if (ticketError) {
    throw new Error(`Erreur lors de la mise à jour du ticket: ${ticketError.message}`);
  }

  // 7. Mettre à jour jira_sync avec les métadonnées
  const syncMetadata: Record<string, any> = {};
  if (jiraData.labels && jiraData.labels.length > 0) {
    syncMetadata.labels = jiraData.labels;
  }
  if (jiraData.components && jiraData.components.length > 0) {
    syncMetadata.components = jiraData.components.map(c => c.name);
  }

  // Phase 2: Ajouter les métadonnées client/contact dans sync_metadata
  if (jiraData.customfield_10053) {
    syncMetadata.client_name = jiraData.customfield_10053;
  }
  if (jiraData.customfield_10054?.value) {
    syncMetadata.client_job_title = jiraData.customfield_10054.value;
  }
  if (jiraData.customfield_10045?.value) {
    syncMetadata.company_name = jiraData.customfield_10045.value;
  }
  if (jiraData.customfield_10055?.value) {
    syncMetadata.jira_channel = jiraData.customfield_10055.value;
  }

  // Phase 3: Ajouter les métadonnées fonctionnalité dans sync_metadata
  if (jiraData.customfield_10052?.value) {
    syncMetadata.jira_feature = jiraData.customfield_10052.value;
    if (jiraData.customfield_10052.id) {
      syncMetadata.jira_feature_id = jiraData.customfield_10052.id;
    }
  }

  // Phase 5: Ajouter les métadonnées des champs spécifiques produits dans sync_metadata
  for (const fieldId of productSpecificFieldIds) {
    const fieldValue = (jiraData as any)[fieldId];
    if (fieldValue) {
      syncMetadata[fieldId] = typeof fieldValue === 'string' 
        ? fieldValue 
        : fieldValue?.value || fieldValue?.name || null;
    }
  }

  // Phase 4: Extraire les valeurs workflow pour jira_sync
  const jiraSprintId = typeof jiraData.customfield_10020 === 'string'
    ? jiraData.customfield_10020
    : jiraData.customfield_10020?.id || jiraData.customfield_10020?.name || null;
  
  const jiraWorkflowStatus = typeof jiraData.customfield_10083 === 'string'
    ? jiraData.customfield_10083
    : jiraData.customfield_10083?.value || null;
  
  const jiraTestStatus = typeof jiraData.customfield_10084 === 'string'
    ? jiraData.customfield_10084
    : jiraData.customfield_10084?.value || null;
  
  const jiraIssueType = typeof jiraData.customfield_10021 === 'string'
    ? jiraData.customfield_10021
    : jiraData.customfield_10021?.value || null;

  const jiraSyncUpdate = {
    jira_issue_key: jiraData.key,
    jira_status: jiraData.status.name,
    jira_priority: jiraData.priority.name,
    jira_assignee_account_id: jiraData.assignee?.accountId || null,
    jira_reporter_account_id: jiraData.reporter?.accountId || null,
    jira_resolution: jiraData.resolution?.name || null,
    jira_fix_version: jiraData.fixVersions?.[0]?.name || null,
    jira_sprint_id: jiraSprintId,
    jira_workflow_status: jiraWorkflowStatus,
    jira_test_status: jiraTestStatus,
    jira_issue_type: jiraIssueType,
    jira_related_ticket_key: jiraData.customfield_10057 || null,
    jira_target_date: jiraData.customfield_10111 || null,
    jira_resolved_at: jiraData.customfield_10115 || null,
    last_status_sync: supabaseStatus ? new Date().toISOString() : null,
    last_priority_sync: supabasePriority ? new Date().toISOString() : null,
    sync_metadata: Object.keys(syncMetadata).length > 0 ? syncMetadata : null,
    last_synced_at: new Date().toISOString(),
    sync_error: null
  };

  const { error: syncError } = await supabase
    .from('jira_sync')
    .upsert({
      ticket_id: ticketId,
      ...jiraSyncUpdate
    }, {
      onConflict: 'ticket_id'
    });

  if (syncError) {
    console.error('Erreur lors de la mise à jour de jira_sync:', syncError);
    // Ne pas faire échouer la synchronisation si jira_sync échoue
  }

  // 8. Enregistrer l'historique de changement de statut si nécessaire
  if (supabaseStatus) {
    // Récupérer l'ancien statut
    const { data: oldTicket } = await supabase
      .from('tickets')
      .select('status')
      .eq('id', ticketId)
      .single();

    if (oldTicket && oldTicket.status !== supabaseStatus) {
      await supabase.from('ticket_status_history').insert({
        ticket_id: ticketId,
        status_from: oldTicket.status,
        status_to: supabaseStatus,
        source: 'jira'
      });
    }
  }
}

/**
 * Mappe le type d'issue Jira vers le type de ticket Supabase
 */
function mapJiraIssueTypeToTicketType(jiraIssueType: string): TicketType {
  const upperType = jiraIssueType.toUpperCase();
  if (upperType.includes('BUG') || upperType.includes('BUG')) {
    return 'BUG';
  }
  if (upperType.includes('REQ') || upperType.includes('REQUEST') || upperType.includes('STORY')) {
    return 'REQ';
  }
  return 'ASSISTANCE';
}

/**
 * Mappe un accountId Jira vers un profile_id Supabase
 * 
 * @param jiraAccountId - AccountId Jira (ex: "712020:bb02e93b-c270-4c40-a166-a19a42e5629a")
 * @returns Le profile_id Supabase ou null si non trouvé
 */
async function mapJiraAccountIdToProfileId(jiraAccountId: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('jira_user_id', jiraAccountId)
    .single();

  if (error || !data) {
    console.warn(`Aucun profil trouvé pour le jira_user_id "${jiraAccountId}"`);
    return null;
  }

  return data.id;
}

/**
 * Trouve un ticket Supabase par sa clé Jira
 * 
 * @param jiraKey - Clé Jira (ex: "B-OD-029")
 * @returns Le ticket trouvé ou null
 */
async function findTicketByJiraKey(jiraKey: string): Promise<{ id: string } | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('jira_sync')
    .select('ticket_id')
    .eq('jira_issue_key', jiraKey)
    .single();

  if (error || !data) {
    return null;
  }

  return { id: data.ticket_id };
}

