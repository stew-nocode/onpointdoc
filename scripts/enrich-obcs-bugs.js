import Papa from 'papaparse';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1CDvRfXWWctpR8-VxIY8TyLmefEcJQIwG2FA48DFHX9A/export?format=csv&gid=1336282900';

const BUG_TYPES = [
  'Autres',
  'Mauvais déversement des données',
  'Dysfonctionnement sur le Calcul des salaires',
  'Duplication anormale',
  'Enregistrement impossible',
  "Page d'erreur",
  'Historique vide/non exhaustif',
  'Non affichage de pages/données',
  'Lenteur Système',
  'Import de fichiers impossible',
  'Suppression impossible',
  'Récupération de données impossible',
  'Edition impossible',
  'Dysfonctionnement des filtres',
  'Error 503',
  'Impression impossible',
  'Erreur de calcul/Erreur sur Dashboard',
  'Dysfonctionnement Workflow',
  'Erreur serveur',
  "Dysfonctionnement des liens d'accès",
  'Formulaire indisponible',
  'Erreur Ajax',
  'Export de données impossible',
  'Connexion impossible'
];

const STATUS_MAP = {
  'À faire': 'Nouveau',
  'A faire': 'Nouveau',
  'Backlog': 'Nouveau',
  Nouveau: 'Nouveau',
  'En cours': 'En_cours',
  'In Progress': 'En_cours',
  'À valider': 'Transfere',
  'Transféré': 'Transfere',
  Transféré: 'Transfere',
  Terminé: 'Resolue',
  'Terminé(e)': 'Resolue',
  Résolu: 'Resolue',
  Résolue: 'Resolue'
};

const PRIORITY_MAP = {
  'Priorité 1': 'Critical',
  'Priorité 2': 'High',
  'Priorité 3': 'Medium',
  'Priorité 4': 'Low'
};

const MONTH_MAP = {
  'janv.': '01',
  'févr.': '02',
  'mars': '03',
  'avr.': '04',
  'mai': '05',
  'juin': '06',
  'juil.': '07',
  'août': '08',
  'sept.': '09',
  'oct.': '10',
  'nov.': '11',
  'déc.': '12'
};

const CANAL_VALUES = ['Whatsapp', 'Email', 'Appel', 'Autre'];

const CANAL_MAP = {
  whatsapp: 'Whatsapp',
  'whats app': 'Whatsapp',
  mail: 'Email',
  email: 'Email',
  courriel: 'Email',
  appel: 'Appel',
  téléphone: 'Appel',
  telephone: 'Appel',
  phone: 'Appel'
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const profileCache = new Map();
const productMap = new Map();
const moduleMap = new Map();
const submoduleMap = new Map();

const stats = {
  totalRows: 0,
  skipped: 0,
  updated: 0,
  created: 0,
  missingTickets: [],
  missingReporter: new Set(),
  missingAssignee: new Set(),
  missingSubmodule: new Set(),
  missingProduct: new Set()
};

function normalizeKey(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/\.+/g, '.')
    .replace(/^\./, '')
    .replace(/\.$/, '');
}

function getFirstValue(row, baseName) {
  const suffixes = ['', '_1', '_2', '_3'];
  for (const suffix of suffixes) {
    const key = suffix ? `${baseName}${suffix}` : baseName;
    if (row[key] && String(row[key]).trim()) {
      return String(row[key]).trim();
    }
  }
  return '';
}

function parseSheetDate(value) {
  if (!value || !value.trim()) return null;
  const trimmed = value.trim();
  const [datePart, timePart = '00:00'] = trimmed.split(' ');
  if (!datePart) return null;
  const [dayStr, monthRaw, yearRaw] = datePart.split('/');
  if (!dayStr || !monthRaw || !yearRaw) return null;
  const monthKey = monthRaw.toLowerCase();
  const month = MONTH_MAP[monthKey] || null;
  if (!month) return null;
  const year = yearRaw.length === 2 ? `20${yearRaw}` : yearRaw;
  const day = dayStr.padStart(2, '0');
  return `${year}-${month}-${day}T${timePart}:00`;
}

function parseSheetDateOnly(value) {
  const iso = parseSheetDate(value);
  if (!iso) return null;
  return iso.split('T')[0];
}

function mapPriority(raw) {
  if (raw && PRIORITY_MAP[raw]) {
    return PRIORITY_MAP[raw];
  }
  return 'Medium';
}

function mapStatus(raw) {
  if (raw && STATUS_MAP[raw]) {
    return STATUS_MAP[raw];
  }
  return 'Nouveau';
}

function mapBugType(raw) {
  if (!raw) return null;
  const clean = raw.trim();
  if (BUG_TYPES.includes(clean)) {
    return clean;
  }
  return 'Autres';
}

function mapCanal(raw) {
  if (!raw) return null;
  const normalized = normalizeKey(raw);
  if (CANAL_MAP[normalized]) {
    return CANAL_MAP[normalized];
  }
  if (CANAL_VALUES.includes(raw)) {
    return raw;
  }
  return 'Autre';
}

async function ensureProfile(jiraUserId, fullName) {
  if (!jiraUserId) return null;
  if (profileCache.has(jiraUserId)) {
    return profileCache.get(jiraUserId);
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('jira_user_id', jiraUserId)
    .maybeSingle();

  if (error) {
    console.error(`Erreur lors de la recherche du profil ${jiraUserId}:`, error.message);
    return null;
  }

  if (data?.id) {
    profileCache.set(jiraUserId, data.id);
    return data.id;
  }

  const fallbackName = fullName || `Utilisateur ${jiraUserId}`;
  const email = `${slugify(fallbackName)}@onpointjira.local`;

  const { data: created, error: insertError } = await supabase
    .from('profiles')
    .insert({
      full_name: fallbackName,
      email,
      role: 'client',
      jira_user_id: jiraUserId,
      is_active: true
    })
    .select('id')
    .single();

  if (insertError) {
    console.error(`Erreur lors de la création du profil ${jiraUserId}:`, insertError.message);
    return null;
  }

  profileCache.set(jiraUserId, created.id);
  return created.id;
}

function buildDescription(row) {
  const baseDescription = row['Description']?.trim() || '';
  const attachments = ['Pièce jointe', 'Pièce jointe_1', 'Pièce jointe_2', 'Pièce jointe_3', 'Pièce jointe_4']
    .map((key) => (row[key] && String(row[key]).trim() ? String(row[key]).trim() : ''))
    .filter(Boolean);
  const interlocuteurs = getFirstValue(row, 'Champs personnalisés (Interlocuteurs)');
  const commentaires = getFirstValue(row, 'Champs personnalisés (Commentaires)');

  let description = baseDescription;
  if (attachments.length) {
    description += `\n\n---\n**Pièces jointes JIRA :**\n- ${attachments.join('\n- ')}`;
  }
  if (interlocuteurs) {
    description += `\n\n**Interlocuteurs :** ${interlocuteurs}`;
  }
  if (commentaires) {
    description += `\n\n**Commentaires internes :** ${commentaires}`;
  }

  return description.trim() || null;
}

function mapProduct(projectKey, projectName) {
  if (!productMap.size) return null;
  if (projectKey) {
    const key = projectKey.toLowerCase();
    if (productMap.has(key)) {
      return productMap.get(key);
    }
  }
  if (projectName) {
    const normalizedName = normalizeKey(projectName);
    if (productMap.has(normalizedName)) {
      return productMap.get(normalizedName);
    }
  }
  return null;
}

function mapModule(moduleName) {
  if (!moduleName) return null;
  const key = normalizeKey(moduleName);
  return moduleMap.get(key) || null;
}

function mapSubmodule(submoduleName) {
  if (!submoduleName) return null;
  const raw = submoduleName.trim();
  const parts = raw.split('-').map((part) => part.trim());
  const candidates = [raw, parts[parts.length - 1]];
  for (const candidate of candidates) {
    const key = normalizeKey(candidate);
    if (submoduleMap.has(key)) {
      return submoduleMap.get(key);
    }
  }
  return null;
}

async function loadMetadata() {
  const [{ data: products, error: productError }, { data: modules, error: moduleError }, { data: submodules, error: submoduleError }] =
    await Promise.all([
      supabase.from('products').select('id, name, code'),
      supabase.from('modules').select('id, name, product_id'),
      supabase.from('submodules').select('id, name, module_id')
    ]);

  if (productError) throw new Error(productError.message);
  if (moduleError) throw new Error(moduleError.message);
  if (submoduleError) throw new Error(submoduleError.message);

  products?.forEach((product) => {
    if (product.code) {
      productMap.set(product.code.toLowerCase(), product);
    }
    productMap.set(normalizeKey(product.name), product);
  });

  modules?.forEach((module) => {
    moduleMap.set(normalizeKey(module.name), module);
  });

  submodules?.forEach((submodule) => {
    submoduleMap.set(normalizeKey(submodule.name), submodule);
  });
}

async function fetchSheetRows() {
  const response = await fetch(SHEET_URL);
  if (!response.ok) {
    throw new Error(`Impossible de télécharger le Google Sheet: ${response.status} ${response.statusText}`);
  }
  const csvText = await response.text();
  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true
  });

  if (parsed.errors.length) {
    console.warn('Erreurs PapaParse:', parsed.errors.slice(0, 3));
  }

  return parsed.data;
}

async function fetchExistingTickets(jiraKeys) {
  const ticketMap = new Map();
  const chunkSize = 300;
  for (let i = 0; i < jiraKeys.length; i += chunkSize) {
    const chunk = jiraKeys.slice(i, i + chunkSize);
    const { data, error } = await supabase
      .from('tickets')
      .select(
        'id, jira_issue_key, title, ticket_type, status, priority, canal, customer_context, target_date, bug_type, custom_fields, product_id, module_id, submodule_id, created_by, assigned_to'
      )
      .in('jira_issue_key', chunk);

    if (error) {
      console.error('Erreur lors de la récupération des tickets existants:', error.message);
      continue;
    }

    data?.forEach((ticket) => {
      if (ticket.jira_issue_key) {
        ticketMap.set(ticket.jira_issue_key, ticket);
      }
    });
  }

  return ticketMap;
}

function buildCustomFields(existingCustomFields, clientPoste) {
  if (!clientPoste) {
    return existingCustomFields || null;
  }

  const base = existingCustomFields && typeof existingCustomFields === 'object' ? { ...existingCustomFields } : {};
  base.metadata = {
    ...(base.metadata || {}),
    client_position: clientPoste
  };

  return base;
}

async function upsertJiraSync(ticketId, jiraKey, reporterId, assigneeId) {
  if (!jiraKey) return;
  await supabase.from('jira_sync').upsert(
    {
      ticket_id: ticketId,
      jira_issue_key: jiraKey,
      origin: 'jira',
      jira_reporter_account_id: reporterId || null,
      jira_assignee_account_id: assigneeId || null,
      last_synced_at: new Date().toISOString()
    },
    {
      onConflict: 'ticket_id'
    }
  );
}

async function processRow(row, existingTickets) {
  stats.totalRows += 1;
  const odKey = row['Lien du ticket entrant (Duplicate)']?.trim();
  if (!odKey) {
    stats.skipped += 1;
    return;
  }

  const reporterId = row['ID de rapporteur']?.trim();
  const reporterName = row['Rapporteur']?.trim();
  const reporterProfileId = await ensureProfile(reporterId, reporterName);
  if (!reporterProfileId) {
    stats.missingReporter.add(reporterId || 'unknown');
  }

  const assigneeId = row['ID de la personne assignée']?.trim();
  const assigneeName = row['Personne assignée']?.trim();
  const assigneeProfileId = assigneeId ? await ensureProfile(assigneeId, assigneeName) : null;
  if (assigneeId && !assigneeProfileId) {
    stats.missingAssignee.add(assigneeId);
  }

  const bugType = mapBugType(getFirstValue(row, 'Champs personnalisés (Type de bugs)'));
  const customerContext = row['Canal']?.trim() || '';
  const canalValue = mapCanal(getFirstValue(row, 'Champs personnalisés (Canal)') || row['Canal']);
  const targetDate = parseSheetDateOnly(getFirstValue(row, "Champs personnalisés (Date d'enregistrement)"));
  const clientPoste = getFirstValue(row, 'Champs personnalisés (Poste)');
  const submoduleName = getFirstValue(row, 'Champs personnalisés (Sous-Module(s) Finance)');
  const moduleName = getFirstValue(row, 'Champs personnalisés (Module)');

  const moduleRecord = mapModule(moduleName);
  const submoduleRecord = mapSubmodule(submoduleName);
  if (submoduleName && !submoduleRecord) {
    stats.missingSubmodule.add(submoduleName);
  }

  const projectKey = row['Clé de projet']?.trim();
  const projectName = row['Nom du projet']?.trim();
  const productRecord = mapProduct(projectKey, projectName);
  if (!productRecord && projectKey) {
    stats.missingProduct.add(projectKey);
  }

  const summary = row['Résumé']?.trim();
  const description = buildDescription(row);
  const status = mapStatus(row['État']);
  const priority = mapPriority(row['Priorité']);
  const creationDateIso = parseSheetDate(row['Création']);
  const jiraParentKey = row['Clé de ticket']?.trim();

  const updatePayload = {
    ...(summary ? { title: summary } : {}),
    ...(description ? { description } : {}),
    ...(customerContext ? { customer_context: customerContext } : {}),
    ...(canalValue ? { canal: canalValue } : {}),
    ...(targetDate ? { target_date: targetDate } : {}),
    ...(bugType ? { bug_type: bugType } : {}),
    ...(reporterProfileId ? { created_by: reporterProfileId } : {}),
    ...(assigneeProfileId ? { assigned_to: assigneeProfileId } : {}),
    ...(productRecord ? { product_id: productRecord.id } : {}),
    ...(moduleRecord ? { module_id: moduleRecord.id } : {}),
    ...(submoduleRecord ? { submodule_id: submoduleRecord.id } : {}),
    ...(jiraParentKey ? { related_ticket_key: jiraParentKey } : {})
  };

  const customFields = buildCustomFields(existingTickets.get(odKey)?.custom_fields, clientPoste);
  if (customFields) {
    updatePayload.custom_fields = customFields;
  }

  const existingTicket = existingTickets.get(odKey);
  if (existingTicket) {
    const { error } = await supabase.from('tickets').update(updatePayload).eq('id', existingTicket.id);
    if (error) {
      console.error(`Erreur lors de la mise à jour du ticket ${odKey}:`, error.message);
      return;
    }
    stats.updated += 1;
    await upsertJiraSync(existingTicket.id, jiraParentKey, reporterId, assigneeId);
    return;
  }

  const insertPayload = {
    title: summary || odKey,
    description: description || summary || '',
    ticket_type: 'BUG',
    status,
    priority,
    canal: canalValue || 'Autre',
    customer_context: customerContext || null,
    target_date: targetDate,
    bug_type: bugType,
    product_id: productRecord?.id || null,
    module_id: (submoduleRecord && submoduleRecord.module_id) || moduleRecord?.id || null,
    submodule_id: submoduleRecord?.id || null,
    jira_issue_key: odKey,
    jira_issue_id: jiraParentKey || null,
    related_ticket_key: jiraParentKey || null,
    origin: 'jira',
    last_update_source: 'jira',
    created_by: reporterProfileId,
    assigned_to: assigneeProfileId,
    custom_fields: customFields,
    created_at: creationDateIso || new Date().toISOString()
  };

  const { data: createdTicket, error: insertError } = await supabase
    .from('tickets')
    .insert(insertPayload)
    .select('id')
    .single();

  if (insertError) {
    console.error(`Erreur lors de la création du ticket ${odKey}:`, insertError.message);
    stats.missingTickets.push(odKey);
    return;
  }

  stats.created += 1;
  await upsertJiraSync(createdTicket.id, jiraParentKey, reporterId, assigneeId);
}

async function main() {
  console.log('🔁 Chargement des métadonnées (produits/modules/submodules)...');
  await loadMetadata();

  console.log('📥 Téléchargement du Google Sheet BUG OBCS...');
  const rows = await fetchSheetRows();
  const jiraKeys = rows
    .map((row) => row['Lien du ticket entrant (Duplicate)']?.trim())
    .filter(Boolean);
  const uniqueKeys = Array.from(new Set(jiraKeys));

  console.log(`🔍 Récupération de ${uniqueKeys.length} tickets existants...`);
  const existingTickets = await fetchExistingTickets(uniqueKeys);

  for (const row of rows) {
    await processRow(row, existingTickets);
  }

  console.log('\n✅ Enrichissement terminé');
  console.log(`   • Lignes traitées : ${stats.totalRows}`);
  console.log(`   • Tickets mis à jour : ${stats.updated}`);
  console.log(`   • Tickets créés : ${stats.created}`);
  console.log(`   • Lignes ignorées : ${stats.skipped}`);

  if (stats.missingTickets.length) {
    console.log('   • Tickets non créés (erreurs) :', stats.missingTickets.slice(0, 10));
  }

  if (stats.missingReporter.size) {
    console.log('   • Rapporteurs introuvables :', Array.from(stats.missingReporter));
  }

  if (stats.missingSubmodule.size) {
    console.log('   • Sous-modules non trouvés :', Array.from(stats.missingSubmodule));
  }

  if (stats.missingProduct.size) {
    console.log('   • Produits non mappés :', Array.from(stats.missingProduct));
  }
}

main().catch((error) => {
  console.error('❌ Erreur lors de l\'enrichissement des bugs:', error);
  process.exit(1);
});

