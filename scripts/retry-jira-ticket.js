/**
 * Script pour réessayer l'import d'un ticket Jira spécifique
 * 
 * Usage: node scripts/retry-jira-ticket.js <JIRA_KEY>
 * Exemple: node scripts/retry-jira-ticket.js OD-578
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const jiraUrl = process.env.JIRA_URL || process.env.JIRA_BASE_URL || '';
const jiraEmail = process.env.JIRA_EMAIL || process.env.JIRA_USERNAME || process.env.JIRA_API_EMAIL || '';
const jiraToken = process.env.JIRA_API_TOKEN || process.env.JIRA_TOKEN || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

if (!jiraUrl || !jiraEmail || !jiraToken) {
  console.error('❌ Variables d\'environnement Jira manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Nettoyer les valeurs d'environnement
const cleanEnv = (value) => {
  if (!value) return null;
  return value.toString().trim().replace(/^["']|["']$/g, '').replace(/\n/g, '').replace(/\/$/, '');
};

const JIRA_BASE_URL = cleanEnv(jiraUrl);
const JIRA_EMAIL = cleanEnv(jiraEmail);
const JIRA_TOKEN = cleanEnv(jiraToken);

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Import des fonctions du script d'import initial
// (On va utiliser la même logique)
async function getSupabaseStatusFromJira(jiraStatus, ticketType) {
  const { data } = await supabase
    .from('jira_status_mapping')
    .select('supabase_status')
    .eq('jira_status_name', jiraStatus)
    .eq('ticket_type', ticketType)
    .maybeSingle();

  return data?.supabase_status || null;
}

async function getSupabasePriorityFromJira(jiraPriority) {
  const { data } = await supabase
    .from('jira_priority_mapping')
    .select('supabase_priority')
    .eq('jira_priority_name', jiraPriority)
    .maybeSingle();

  return data?.supabase_priority || null;
}

async function mapJiraAccountIdToProfileId(jiraAccountId) {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('jira_user_id', jiraAccountId)
    .maybeSingle();

  return data?.id || null;
}

async function mapJiraCompanyToCompanyId(jiraCompanyName, jiraCompanyId) {
  if (!jiraCompanyId) return null;
  
  const { data } = await supabase
    .from('companies')
    .select('id')
    .eq('jira_company_id', jiraCompanyId.toString())
    .maybeSingle();

  return data?.id || null;
}

async function mapJiraClientNameToProfile(clientName, companyId) {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('full_name', clientName)
    .eq('role', 'client')
    .maybeSingle();

  return data?.id || null;
}

async function getSupabaseChannelFromJira(jiraChannel) {
  const { data } = await supabase
    .from('jira_channel_mapping')
    .select('supabase_channel')
    .eq('jira_channel_value', jiraChannel)
    .maybeSingle();

  return data?.supabase_channel || null;
}

async function getFeatureIdFromJira(jiraFeatureValue) {
  const { data } = await supabase
    .from('jira_feature_mapping')
    .select('feature_id')
    .eq('jira_feature_value', jiraFeatureValue)
    .eq('jira_custom_field_id', 'customfield_10052')
    .maybeSingle();

  if (!data?.feature_id) return null;

  const { data: feature } = await supabase
    .from('features')
    .select('submodule_id')
    .eq('id', data.feature_id)
    .single();

  return {
    featureId: data.feature_id,
    submoduleId: feature?.submodule_id || null
  };
}

async function findTicketByJiraKey(jiraKey) {
  const { data } = await supabase
    .from('jira_sync')
    .select('ticket_id')
    .eq('jira_issue_key', jiraKey)
    .maybeSingle();

  return data?.ticket_id || null;
}

function mapJiraIssueTypeToTicketType(jiraIssueType) {
  const upperType = jiraIssueType.toUpperCase();
  if (upperType.includes('BUG')) return 'BUG';
  if (upperType.includes('REQ') || upperType.includes('REQUEST') || upperType.includes('STORY')) return 'REQ';
  return 'ASSISTANCE';
}

async function syncJiraTicketToSupabase(jiraIssue) {
  const fields = jiraIssue.fields;
  const ticketType = mapJiraIssueTypeToTicketType(fields.issuetype?.name || 'BUG');
  const supabaseStatus = await getSupabaseStatusFromJira(fields.status?.name || 'Nouveau', ticketType);
  const supabasePriority = await getSupabasePriorityFromJira(fields.priority?.name || 'Medium');

  let contactUserId = null;
  let companyId = null;

  if (fields.customfield_10045) {
    const jiraCompanyId = typeof fields.customfield_10045.id === 'string'
      ? parseInt(fields.customfield_10045.id, 10)
      : fields.customfield_10045.id;
    companyId = await mapJiraCompanyToCompanyId(fields.customfield_10045.value, jiraCompanyId);
  }

  if (fields.customfield_10053) {
    contactUserId = await mapJiraClientNameToProfile(fields.customfield_10053, companyId || undefined);
  }

  let supabaseChannel = null;
  if (fields.customfield_10055?.value) {
    supabaseChannel = await getSupabaseChannelFromJira(fields.customfield_10055.value);
  }

  let featureId = null;
  let submoduleId = null;
  if (fields.customfield_10052?.value) {
    const featureMapping = await getFeatureIdFromJira(fields.customfield_10052.value);
    if (featureMapping) {
      featureId = featureMapping.featureId;
      submoduleId = featureMapping.submoduleId;
    }
  }

  const workflowStatus = typeof fields.customfield_10083 === 'string'
    ? fields.customfield_10083
    : fields.customfield_10083?.value || null;
  const testStatus = typeof fields.customfield_10084 === 'string'
    ? fields.customfield_10084
    : fields.customfield_10084?.value || null;
  const issueType = typeof fields.customfield_10021 === 'string'
    ? fields.customfield_10021
    : fields.customfield_10021?.value || null;
  const sprint = typeof fields.customfield_10020 === 'string'
    ? fields.customfield_10020
    : fields.customfield_10020?.name || fields.customfield_10020?.value || null;
  const relatedTicketKey = fields.customfield_10057 || null;
  const relatedTicketId = relatedTicketKey ? await findTicketByJiraKey(relatedTicketKey) : null;
  const targetDate = fields.customfield_10111 || null;
  const resolvedAt = fields.customfield_10115 || null;

  const productSpecificFields = [
    'customfield_10297', 'customfield_10298', 'customfield_10300',
    'customfield_10299', 'customfield_10301', 'customfield_10313',
    'customfield_10324', 'customfield_10364'
  ];

  const customFields = {
    product_specific: {},
    metadata: {
      jira_custom_field_ids: [],
      last_updated: new Date().toISOString()
    }
  };

  for (const fieldId of productSpecificFields) {
    const fieldValue = fields[fieldId];
    if (fieldValue) {
      let value = null;
      if (typeof fieldValue === 'string') {
        value = fieldValue;
      } else if (Array.isArray(fieldValue)) {
        value = fieldValue.map(v => typeof v === 'string' ? v : v?.value || v?.name || null)
          .filter(Boolean).join(', ');
      } else if (fieldValue && typeof fieldValue === 'object') {
        value = fieldValue.value || fieldValue.name || null;
      }
      if (value) {
        customFields.product_specific[fieldId] = value;
        customFields.metadata.jira_custom_field_ids.push(fieldId);
      }
    }
  }

  return {
    title: fields.summary || '',
    description: fields.description || null,
    ticket_type: ticketType,
    status: supabaseStatus,
    priority: supabasePriority,
    updated_at: fields.updated,
    last_update_source: 'jira',
    jira_issue_key: jiraIssue.key,
    jira_issue_id: jiraIssue.id,
    origin: 'jira',
    resolution: fields.resolution?.name || null,
    fix_version: fields.fixVersions?.[0]?.name || null,
    contact_user_id: contactUserId,
    canal: supabaseChannel,
    feature_id: featureId,
    submodule_id: submoduleId,
    workflow_status: workflowStatus,
    test_status: testStatus,
    issue_type: issueType,
    sprint_id: sprint,
    related_ticket_id: relatedTicketId,
    related_ticket_key: relatedTicketKey,
    target_date: targetDate,
    resolved_at: resolvedAt,
    custom_fields: Object.keys(customFields.product_specific).length > 0 ? customFields : null
  };
}

async function updateJiraSync(ticketId, jiraIssue, ticketUpdate) {
  const fields = jiraIssue.fields;
  const jiraSprintId = typeof fields.customfield_10020 === 'string'
    ? fields.customfield_10020
    : fields.customfield_10020?.id || fields.customfield_10020?.name || null;
  const jiraWorkflowStatus = typeof fields.customfield_10083 === 'string'
    ? fields.customfield_10083
    : fields.customfield_10083?.value || null;
  const jiraTestStatus = typeof fields.customfield_10084 === 'string'
    ? fields.customfield_10084
    : fields.customfield_10084?.value || null;
  const jiraIssueType = typeof fields.customfield_10021 === 'string'
    ? fields.customfield_10021
    : fields.customfield_10021?.value || null;

  const syncMetadata = {};
  if (fields.labels && fields.labels.length > 0) {
    syncMetadata.labels = fields.labels;
  }
  if (fields.components && fields.components.length > 0) {
    syncMetadata.components = fields.components.map(c => c.name);
  }
  if (fields.customfield_10053) {
    syncMetadata.client_name = fields.customfield_10053;
  }
  if (fields.customfield_10052?.value) {
    syncMetadata.jira_feature = fields.customfield_10052.value;
  }

  await supabase
    .from('jira_sync')
    .upsert({
      ticket_id: ticketId,
      jira_issue_key: jiraIssue.key,
      jira_status: fields.status?.name || null,
      jira_priority: fields.priority?.name || null,
      jira_assignee_account_id: fields.assignee?.accountId || null,
      jira_reporter_account_id: fields.reporter?.accountId || null,
      jira_resolution: fields.resolution?.name || null,
      jira_fix_version: fields.fixVersions?.[0]?.name || null,
      jira_sprint_id: jiraSprintId,
      jira_workflow_status: jiraWorkflowStatus,
      jira_test_status: jiraTestStatus,
      jira_issue_type: jiraIssueType,
      jira_related_ticket_key: fields.customfield_10057 || null,
      jira_target_date: fields.customfield_10111 || null,
      jira_resolved_at: fields.customfield_10115 || null,
      last_synced_at: new Date().toISOString(),
      sync_metadata: Object.keys(syncMetadata).length > 0 ? syncMetadata : null,
      sync_error: null
    }, {
      onConflict: 'ticket_id'
    });
}

async function findOrCreateTicket(jiraKey, jiraId, createdDate) {
  const { data: existingSync } = await supabase
    .from('jira_sync')
    .select('ticket_id')
    .eq('jira_issue_key', jiraKey)
    .maybeSingle();

  if (existingSync) {
    return existingSync.ticket_id;
  }

  const { data: existingTicket } = await supabase
    .from('tickets')
    .select('id')
    .eq('jira_issue_key', jiraKey)
    .maybeSingle();

  if (existingTicket) {
    return existingTicket.id;
  }

  const { data: newTicket, error: createError } = await supabase
    .from('tickets')
    .insert({
      title: 'Import en cours...',
      ticket_type: 'BUG',
      status: 'Nouveau',
      priority: 'Medium',
      jira_issue_key: jiraKey,
      jira_issue_id: jiraId,
      origin: 'jira',
      created_at: createdDate
    })
    .select()
    .single();

  if (createError) {
    if (createError.code === '23505') {
      const { data: duplicateTicket } = await supabase
        .from('tickets')
        .select('id')
        .eq('jira_issue_key', jiraKey)
        .maybeSingle();
      
      if (duplicateTicket) {
        return duplicateTicket.id;
      }
    }
    throw createError;
  }

  return newTicket?.id || null;
}

async function fetchJiraIssue(jiraKey) {
  const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_TOKEN}`).toString('base64');
  
  const url = `${JIRA_BASE_URL}/rest/api/3/issue/${jiraKey}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
  }

  return await response.json();
}

async function main() {
  const jiraKey = process.argv[2];

  if (!jiraKey) {
    console.error('❌ Usage: node scripts/retry-jira-ticket.js <JIRA_KEY>');
    console.error('   Exemple: node scripts/retry-jira-ticket.js OD-578');
    process.exit(1);
  }

  log('\n🔄 RÉESSAI : IMPORT TICKET JIRA → SUPABASE', 'cyan');
  log('='.repeat(60));
  log(`📋 Ticket: ${jiraKey}`, 'blue');

  try {
    log('\n⏳ Récupération du ticket Jira...', 'blue');
    const jiraIssue = await fetchJiraIssue(jiraKey);
    log('✅ Ticket Jira récupéré', 'green');

    log('\n⏳ Recherche/création du ticket Supabase...', 'blue');
    const ticketId = await findOrCreateTicket(
      jiraIssue.key,
      jiraIssue.id,
      jiraIssue.fields.created
    );

    if (!ticketId) {
      throw new Error('Impossible de créer/trouver le ticket');
    }

    const { data: existingSync } = await supabase
      .from('jira_sync')
      .select('ticket_id')
      .eq('jira_issue_key', jiraIssue.key)
      .maybeSingle();

    const isUpdate = !!existingSync;
    log(`✅ Ticket Supabase trouvé/créé (ID: ${ticketId})`, 'green');

    log('\n⏳ Synchronisation des données...', 'blue');
    const ticketUpdate = await syncJiraTicketToSupabase(jiraIssue);

    const { error: updateError } = await supabase
      .from('tickets')
      .update(ticketUpdate)
      .eq('id', ticketId);

    if (updateError) {
      throw new Error(`Erreur mise à jour: ${updateError.message}`);
    }

    await updateJiraSync(ticketId, jiraIssue, ticketUpdate);
    log('✅ Ticket synchronisé avec succès', 'green');

    log('\n' + '='.repeat(60));
    log('📊 RÉSUMÉ', 'cyan');
    log('='.repeat(60));
    log(`✅ Ticket: ${jiraKey}`, 'green');
    log(`📝 Action: ${isUpdate ? 'Mis à jour' : 'Créé'}`, 'blue');
    log(`🆔 ID Supabase: ${ticketId}`, 'cyan');
    log('\n✅ Import réussi', 'green');

  } catch (error) {
    log(`\n❌ Erreur: ${error.message}`, 'red');
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main().catch(console.error);

