/**
 * Script d'import initial : Synchronisation de tous les tickets Jira existants vers Supabase
 * 
 * Ce script :
 * 1. Récupère tous les tickets du projet Jira OD
 * 2. Pour chaque ticket, crée ou met à jour le ticket dans Supabase
 * 3. Synchronise tous les champs (Phases 1-5)
 * 4. Gère les erreurs et la progression
 * 
 * Usage: node scripts/import-jira-tickets-initial.js [limit]
 *   - limit: Nombre maximum de tickets à importer (par défaut: tous)
 * 
 * Exemple: node scripts/import-jira-tickets-initial.js 100
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

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

/**
 * Récupère le statut Supabase depuis Jira
 */
async function getSupabaseStatusFromJira(jiraStatus, ticketType) {
  const { data } = await supabase
    .from('jira_status_mapping')
    .select('supabase_status')
    .eq('jira_status_name', jiraStatus)
    .eq('ticket_type', ticketType)
    .maybeSingle();

  return data?.supabase_status || null;
}

/**
 * Récupère la priorité Supabase depuis Jira
 */
async function getSupabasePriorityFromJira(jiraPriority) {
  const { data } = await supabase
    .from('jira_priority_mapping')
    .select('supabase_priority')
    .eq('jira_priority_name', jiraPriority)
    .maybeSingle();

  return data?.supabase_priority || null;
}

/**
 * Mappe un accountId Jira vers un profile_id
 */
async function mapJiraAccountIdToProfileId(jiraAccountId) {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('jira_user_id', jiraAccountId)
    .maybeSingle();

  return data?.id || null;
}

/**
 * Mappe un nom de client Jira vers un profile_id
 */
async function mapJiraClientNameToProfile(jiraClientName, companyId) {
  if (!jiraClientName || jiraClientName.trim() === '') {
    return null;
  }

  let query = supabase
    .from('profiles')
    .select('id')
    .eq('role', 'client')
    .eq('full_name', jiraClientName.trim());

  if (companyId) {
    query = query.eq('company_id', companyId);
  }

  const { data: existing } = await query.maybeSingle();

  if (existing) {
    return existing.id;
  }

  // Créer un nouveau profil client (sans Auth)
  const { data: newProfile } = await supabase
    .from('profiles')
    .insert({
      full_name: jiraClientName.trim(),
      role: 'client',
      company_id: companyId || null
    })
    .select()
    .single();

  return newProfile?.id || null;
}

/**
 * Mappe une entreprise Jira vers un company_id
 */
async function mapJiraCompanyToCompanyId(jiraCompanyName, jiraCompanyId) {
  if (!jiraCompanyName) return null;

  // Chercher par jira_company_id d'abord
  if (jiraCompanyId) {
    const { data: byJiraId } = await supabase
      .from('companies')
      .select('id')
      .eq('jira_company_id', jiraCompanyId.toString())
      .maybeSingle();

    if (byJiraId) return byJiraId.id;
  }

  // Chercher par nom
  const { data: byName } = await supabase
    .from('companies')
    .select('id')
    .ilike('name', `%${jiraCompanyName}%`)
    .maybeSingle();

  return byName?.id || null;
}

/**
 * Récupère le canal Supabase depuis Jira
 */
async function getSupabaseChannelFromJira(jiraChannelValue) {
  if (!jiraChannelValue) return null;

  const { data } = await supabase
    .from('jira_channel_mapping')
    .select('supabase_channel')
    .eq('jira_channel_value', jiraChannelValue)
    .maybeSingle();

  return data?.supabase_channel || null;
}

/**
 * Mappe une fonctionnalité Jira vers Supabase
 */
async function getFeatureIdFromJira(jiraFeatureValue) {
  if (!jiraFeatureValue) return null;

  const { data } = await supabase
    .from('jira_feature_mapping')
    .select('feature_id')
    .eq('jira_feature_value', jiraFeatureValue)
    .eq('jira_custom_field_id', 'customfield_10052')
    .maybeSingle();

  if (!data?.feature_id) return null;

  // Récupérer le submodule_id depuis la feature
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

/**
 * Trouve un ticket Supabase par sa clé Jira
 */
async function findTicketByJiraKey(jiraKey) {
  const { data } = await supabase
    .from('jira_sync')
    .select('ticket_id')
    .eq('jira_issue_key', jiraKey)
    .maybeSingle();

  return data?.ticket_id || null;
}

/**
 * Récupère tous les tickets Jira du projet OD
 */
async function fetchAllJiraIssues(limit = null) {
  const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_TOKEN}`).toString('base64');
  const maxResults = 100;
  let allIssueKeys = [];
  let nextPageToken = null;
  let isLast = false;
  let pageCount = 0;

  log('⏳ Récupération de tous les tickets Jira...', 'blue');

  const jqlQuery = encodeURIComponent('project = OD ORDER BY created DESC');
  
  while (!isLast && (limit === null || allIssueKeys.length < limit)) {
    let url = `${JIRA_BASE_URL}/rest/api/3/search/jql?jql=${jqlQuery}&maxResults=${maxResults}`;
    if (nextPageToken) {
      url += `&nextPageToken=${encodeURIComponent(nextPageToken)}`;
    }

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

    const data = await response.json();
    pageCount++;

    if (data.issues && Array.isArray(data.issues)) {
      const pageKeys = data.issues.map(issue => issue.id || issue.key).filter(Boolean);
      allIssueKeys.push(...pageKeys);
      log(`   ✓ Page ${pageCount}: ${pageKeys.length} tickets (Total: ${allIssueKeys.length})`, 'green');
    }

    nextPageToken = data.nextPageToken || null;
    isLast = data.isLast === true;

    if (limit && allIssueKeys.length >= limit) {
      allIssueKeys = allIssueKeys.slice(0, limit);
      break;
    }
  }

  log(`\n✅ ${allIssueKeys.length} tickets identifiés`, 'green');

  // Récupérer les détails complets par lots
  log('\n⏳ Récupération des détails complets...', 'blue');
  const issues = [];
  const batchSize = 20;

  for (let i = 0; i < allIssueKeys.length; i += batchSize) {
    const batch = allIssueKeys.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (idOrKey) => {
      try {
        const issueUrl = `${JIRA_BASE_URL}/rest/api/3/issue/${idOrKey}`;
        const issueResponse = await fetch(issueUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json'
          }
        });

        if (issueResponse.ok) {
          return await issueResponse.json();
        }
        return null;
      } catch (error) {
        return null;
      }
    });

    const batchResults = await Promise.all(batchPromises);
    batchResults.forEach(issue => {
      if (issue) issues.push(issue);
    });

    log(`   ✓ Détails récupérés: ${issues.length}/${allIssueKeys.length}`, 'green');
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return issues;
}

/**
 * Synchronise un ticket Jira vers Supabase
 */
async function syncJiraTicketToSupabase(jiraIssue) {
  const fields = jiraIssue.fields;
  
  // Déterminer le type de ticket
  const ticketType = mapJiraIssueTypeToTicketType(fields.issuetype?.name || 'Bug');
  
  // Mapper statut et priorité
  const supabaseStatus = await getSupabaseStatusFromJira(fields.status?.name || '', ticketType) || 'Nouveau';
  const supabasePriority = await getSupabasePriorityFromJira(fields.priority?.name || '') || 'Medium';
  
  // Mapper utilisateurs
  const createdBy = fields.reporter?.accountId 
    ? await mapJiraAccountIdToProfileId(fields.reporter.accountId)
    : null;
  const assignedTo = fields.assignee?.accountId
    ? await mapJiraAccountIdToProfileId(fields.assignee.accountId)
    : null;

  // Phase 2: Mapper client/contact et entreprise
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

  // Phase 2: Mapper canal
  let supabaseChannel = null;
  if (fields.customfield_10055?.value) {
    supabaseChannel = await getSupabaseChannelFromJira(fields.customfield_10055.value);
  }

  // Phase 3: Mapper fonctionnalité
  let featureId = null;
  let submoduleId = null;
  if (fields.customfield_10052?.value) {
    const featureMapping = await getFeatureIdFromJira(fields.customfield_10052.value);
    if (featureMapping) {
      featureId = featureMapping.featureId;
      submoduleId = featureMapping.submoduleId;
    }
  }

  // Phase 4: Extraire les champs workflow
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

  // Phase 5: Construire custom_fields
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

  // Préparer les données de mise à jour
  const ticketUpdate = {
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

  return ticketUpdate;
}

/**
 * Détermine le type de ticket Supabase
 */
function mapJiraIssueTypeToTicketType(jiraIssueType) {
  const upperType = jiraIssueType.toUpperCase();
  if (upperType.includes('BUG')) return 'BUG';
  if (upperType.includes('REQ') || upperType.includes('REQUEST') || upperType.includes('STORY')) return 'REQ';
  return 'ASSISTANCE';
}

/**
 * Trouve ou crée un ticket Supabase
 */
async function findOrCreateTicket(jiraKey, jiraId, createdDate) {
  // Chercher si le ticket existe déjà
  const { data: existingSync } = await supabase
    .from('jira_sync')
    .select('ticket_id')
    .eq('jira_issue_key', jiraKey)
    .maybeSingle();

  if (existingSync) {
    return existingSync.ticket_id;
  }

  // Chercher si le ticket existe déjà directement dans tickets (cas où jira_sync n'existe pas)
  const { data: existingTicket } = await supabase
    .from('tickets')
    .select('id')
    .eq('jira_issue_key', jiraKey)
    .maybeSingle();

  if (existingTicket) {
    return existingTicket.id;
  }

  // Créer un nouveau ticket (sera mis à jour ensuite)
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
    // Si erreur de doublon, réessayer de trouver le ticket
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
    console.error(`Erreur création ticket ${jiraKey}:`, createError);
    return null;
  }

  return newTicket?.id || null;
}

/**
 * Met à jour jira_sync
 */
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

/**
 * Traite un lot de tickets
 */
async function processBatch(issues, batchNumber, batchSize, totalIssues) {
  const batchResults = {
    created: 0,
    updated: 0,
    failed: []
  };

  const startIndex = (batchNumber - 1) * batchSize;
  const endIndex = Math.min(startIndex + batchSize, totalIssues);
  const batchIssues = issues.slice(startIndex, endIndex);

  log(`\n📦 LOT ${batchNumber} : Tickets ${startIndex + 1} à ${endIndex}`, 'magenta');
  log(`⏳ Traitement de ${batchIssues.length} tickets...`, 'blue');

  for (let i = 0; i < batchIssues.length; i++) {
    const issue = batchIssues[i];
    const globalIndex = startIndex + i + 1;
    
    try {
      // Vérifier si le ticket existe déjà
      const { data: existingSync } = await supabase
        .from('jira_sync')
        .select('ticket_id')
        .eq('jira_issue_key', issue.key)
        .maybeSingle();

      const isUpdate = !!existingSync;

      // Trouver ou créer le ticket
      const ticketId = await findOrCreateTicket(issue.key, issue.id, issue.fields.created);

      if (!ticketId) {
        throw new Error('Impossible de créer/trouver le ticket');
      }

      // Synchroniser avec tous les champs
      const ticketUpdate = await syncJiraTicketToSupabase(issue);

      // Mettre à jour le ticket
      const { error: updateError } = await supabase
        .from('tickets')
        .update(ticketUpdate)
        .eq('id', ticketId);

      if (updateError) {
        throw new Error(`Erreur mise à jour: ${updateError.message}`);
      }

      // Mettre à jour jira_sync
      await updateJiraSync(ticketId, issue, ticketUpdate);

      if (isUpdate) {
        batchResults.updated++;
        log(`   ✓ [${globalIndex}/${totalIssues}] ${issue.key} - Mis à jour`, 'green');
      } else {
        batchResults.created++;
        log(`   ✓ [${globalIndex}/${totalIssues}] ${issue.key} - Créé`, 'green');
      }

    } catch (error) {
      batchResults.failed.push({
        key: issue.key,
        error: error.message || 'Erreur inconnue'
      });
      log(`   ❌ [${globalIndex}/${totalIssues}] ${issue.key} - ${error.message}`, 'red');
    }

    // Pause pour éviter surcharge
    if ((i + 1) % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Résumé du lot
  log(`\n📊 Résumé Lot ${batchNumber}:`, 'cyan');
  log(`   ✅ Créés: ${batchResults.created}`, 'green');
  log(`   🔄 Mis à jour: ${batchResults.updated}`, 'blue');
  if (batchResults.failed.length > 0) {
    log(`   ❌ Erreurs: ${batchResults.failed.length}`, 'red');
  }

  return batchResults;
}

/**
 * Processus principal
 */
async function main() {
  const batchSize = 100;
  const limit = process.argv[2] ? parseInt(process.argv[2], 10) : null;
  
  log('\n🚀 IMPORT INITIAL : TICKETS JIRA → SUPABASE', 'cyan');
  log('='.repeat(60));
  if (limit) {
    log(`📊 Limite: ${limit} tickets`, 'blue');
  } else {
    log('📊 Import de TOUS les tickets Jira', 'blue');
  }
  log(`📦 Taille des lots: ${batchSize} tickets`, 'blue');

  const results = {
    total: 0,
    created: 0,
    updated: 0,
    failed: []
  };

  try {
    // 1. Récupérer tous les tickets Jira
    logSection('ÉTAPE 1: Récupération des tickets Jira');
    const issues = await fetchAllJiraIssues(limit);
    results.total = issues.length;

    if (issues.length === 0) {
      log('⚠️  Aucun ticket trouvé', 'yellow');
      return;
    }

    // 2. Importer par lots
    logSection('ÉTAPE 2: Import vers Supabase');
    const totalBatches = Math.ceil(issues.length / batchSize);
    log(`📦 ${totalBatches} lot(s) à traiter\n`, 'blue');

    for (let batchNum = 1; batchNum <= totalBatches; batchNum++) {
      const batchResults = await processBatch(issues, batchNum, batchSize, issues.length);
      
      results.created += batchResults.created;
      results.updated += batchResults.updated;
      results.failed.push(...batchResults.failed);

      // Pause entre les lots
      if (batchNum < totalBatches) {
        log(`\n⏸️  Pause de 2 secondes avant le lot suivant...`, 'yellow');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // 3. Résumé final
    logSection('RÉSUMÉ FINAL');
    log(`📊 Total tickets traités: ${results.total}`, 'cyan');
    log(`✅ Tickets créés: ${results.created}`, 'green');
    log(`🔄 Tickets mis à jour: ${results.updated}`, 'blue');
    
    if (results.failed.length > 0) {
      log(`❌ Tickets en erreur: ${results.failed.length}`, 'red');
      log('\nDétails des erreurs:', 'yellow');
      results.failed.slice(0, 10).forEach(f => {
        log(`   - ${f.key}: ${f.error}`, 'red');
      });
      if (results.failed.length > 10) {
        log(`   ... et ${results.failed.length - 10} autres`, 'yellow');
      }
    }

    log('\n✅ Import terminé', 'green');
    log(`\n💡 Prochaine étape: Configurer les webhooks Jira pour la synchronisation continue`, 'blue');

  } catch (error) {
    log(`\n❌ Erreur: ${error.message}`, 'red');
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main().catch(console.error);
