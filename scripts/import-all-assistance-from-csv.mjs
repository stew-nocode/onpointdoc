/**
 * Script pour importer toutes les assistances depuis le fichier CSV local
 * "docs/ticket/all assistance.csv"
 * 
 * Utilise la clé OBCS-XXXXX pour éviter les doublons (ON CONFLICT)
 * Importe fidèlement les dates de création au format français
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CSV_FILE = join(__dirname, '..', 'docs', 'ticket', 'all assistance.csv');
const OUTPUT_DIR = join(__dirname, '..', 'supabase', 'migrations', 'import-all-assistance');
const BATCH_SIZE = 500; // Nombre de tickets par fichier de migration

// IDs fixes
const OBC_PRODUCT_ID = '91304e02-2ce6-4811-b19d-1cae091a6fde'; // ID correct du produit OBC
const GLOBAL_MODULE_ID = '98ce1c5f-e53c-4baf-9af1-52255d499378';

/**
 * Parse une ligne CSV avec gestion des guillemets
 */
function parseCSVLine(line) {
  const fields = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(currentField.trim());
      currentField = '';
    } else {
      currentField += char;
    }
  }
  fields.push(currentField.trim());
  return fields;
}

/**
 * Parse une date française au format "07/déc./25 10:51" en ISO 8601 UTC
 */
function parseFrenchDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') return null;
  
  let cleaned = dateStr.trim();
  // Corriger les problèmes d'encodage courants
  cleaned = cleaned.replace(/\/dc\.?\//i, '/déc./');
  
  // Format français: "07/déc./25 10:51" ou "07/déc/25 10:51"
  const frenchMatch = cleaned.match(/(\d{1,2})\/([a-zéèêàûô]+)\.?\/(\d{2})\s+(\d{1,2}):(\d{2})/i);
  if (frenchMatch) {
    const [, day, month, year, hour, minute] = frenchMatch;
    const monthNormalized = month.replace(/\.$/, '').toLowerCase();
    
    const monthMap = {
      'janv': '01', 'janvier': '01',
      'févr': '02', 'février': '02', 'fevr': '02', 'fevrier': '02',
      'mars': '03',
      'avr': '04', 'avril': '04',
      'mai': '05',
      'juin': '06',
      'juil': '07', 'juillet': '07',
      'août': '08', 'aout': '08', 'aoû': '08',
      'sept': '09', 'septembre': '09',
      'oct': '10', 'octobre': '10',
      'nov': '11', 'novembre': '11',
      'déc': '12', 'décembre': '12', 'dec': '12', 'decembre': '12'
    };
    
    const monthNum = monthMap[monthNormalized] || '01';
    const fullYear = '20' + year;
    return `${fullYear}-${monthNum}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute}:00.000Z`;
  }
  
  // Format ISO déjà
  if (cleaned.match(/^\d{4}-\d{2}-\d{2}/)) {
    return cleaned;
  }
  
  return null;
}

/**
 * Normalise un nom pour générer un email
 */
function normalizeEmailName(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/[^a-z0-9\s]/g, '') // Supprimer les caractères spéciaux
    .replace(/\s+/g, '.') // Remplacer les espaces par des points
    .substring(0, 50); // Limiter la longueur
}

/**
 * Échappe une chaîne pour SQL
 */
function escapeSQL(str) {
  if (!str) return 'NULL';
  return `'${String(str).replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
}

/**
 * Map le canal CSV vers l'enum Supabase
 */
function mapCanal(canal) {
  if (!canal || canal.trim() === '') return "'Autre'::canal_t";
  
  const canalUpper = canal.toUpperCase().trim();
  
  if (canalUpper.includes('APPEL TÉLÉPHONIQUE') || canalUpper.includes('APPEL TELEPHONIQUE')) {
    return "'Appel Téléphonique'::canal_t";
  }
  if (canalUpper.includes('APPEL WHATSAPP')) {
    return "'Appel WhatsApp'::canal_t";
  }
  if (canalUpper.includes('CHAT WHATSAPP')) {
    return "'Chat WhatsApp'::canal_t";
  }
  if (canalUpper.includes('CHAT SMS')) {
    return "'Chat SMS'::canal_t";
  }
  if (canalUpper.includes('E-MAIL') || canalUpper.includes('EMAIL')) {
    return "'E-mail'::canal_t";
  }
  if (canalUpper.includes('PRÉSENTIEL') || canalUpper.includes('PRESENTIEL')) {
    return "'En présentiel'::canal_t";
  }
  if (canalUpper.includes('ONLINE') || canalUpper.includes('GOOGLE MEET') || canalUpper.includes('TEAMS')) {
    return "'Online (Google Meet, Teams...)'::canal_t";
  }
  
  return "'Autre'::canal_t";
}

/**
 * Map la priorité CSV vers l'enum Supabase
 */
function mapPriority(priority) {
  if (!priority || priority.trim() === '') return "'Low'::priority_t";
  
  const priorityUpper = priority.toUpperCase().trim();
  
  if (priorityUpper.includes('PRIORITÉ 1') || priorityUpper.includes('PRIORITE 1') || priorityUpper.includes('CRITIQUE')) {
    return "'Critical'::priority_t";
  }
  if (priorityUpper.includes('PRIORITÉ 2') || priorityUpper.includes('PRIORITE 2') || priorityUpper.includes('HAUTE')) {
    return "'High'::priority_t";
  }
  if (priorityUpper.includes('PRIORITÉ 3') || priorityUpper.includes('PRIORITE 3') || priorityUpper.includes('MOYENNE')) {
    return "'Low'::priority_t";
  }
  
  return "'Low'::priority_t";
}

/**
 * Map le statut CSV vers l'enum Supabase
 */
function mapStatus(status) {
  if (!status || status.trim() === '') return "'Nouveau'";
  
  const statusUpper = status.toUpperCase().trim();
  
  if (statusUpper.includes('TERMINÉ') || statusUpper.includes('TERMINE') || statusUpper.includes('RÉSOLU') || statusUpper.includes('RESOLU')) {
    return "'Resolue'";
  }
  if (statusUpper.includes('EN COURS') || statusUpper.includes('EN TRAITEMENT')) {
    return "'En cours'";
  }
  if (statusUpper.includes('EN ATTENTE') || statusUpper.includes('EN ATTENTE CLIENT')) {
    return "'En attente'";
  }
  
  return "'Nouveau'";
}

/**
 * Parse la durée en minutes (DECIMAL)
 */
function parseDuration(durationStr) {
  if (!durationStr || durationStr.trim() === '') return null;
  
  const cleaned = durationStr.trim().replace(/[^\d.]/g, '');
  const parsed = parseFloat(cleaned);
  
  if (isNaN(parsed) || parsed < 0) return null;
  
  return parsed.toFixed(2);
}

/**
 * Génère le SQL de migration pour un batch
 */
function generateMigrationSQL(tickets, partNumber, totalParts) {
  const sql = `-- OnpointDoc - Import des tickets d'assistance depuis "all assistance.csv"
-- Date: ${new Date().toISOString().split('T')[0]}
-- Partie ${partNumber} sur ${totalParts} (${tickets.length} tickets)
-- Utilise la clé OBCS-XXXXX pour éviter les doublons (ON CONFLICT)

-- ============================================
-- ÉTAPE 1: Créer la table temporaire
-- ============================================

CREATE TEMP TABLE IF NOT EXISTS temp_assistance_tickets (
  jira_issue_key TEXT NOT NULL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  reporter_name TEXT,
  client_name TEXT,
  contact_user_name TEXT,
  job_title TEXT,
  module_name TEXT,
  submodule_name TEXT,
  canal TEXT,
  priority TEXT,
  status TEXT,
  duration_minutes DECIMAL(10,2),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  action_menee TEXT,
  objet_principal TEXT
);

-- ============================================
-- ÉTAPE 2: Insérer les données dans la table temporaire
-- ============================================

INSERT INTO temp_assistance_tickets (
  jira_issue_key,
  title,
  description,
  reporter_name,
  client_name,
  contact_user_name,
  job_title,
  module_name,
  submodule_name,
  canal,
  priority,
  status,
  duration_minutes,
  created_at,
  updated_at,
  action_menee,
  objet_principal
) VALUES
${tickets.map(t => `  (
    ${escapeSQL(t.jira_issue_key)},
    ${escapeSQL(t.title)},
    ${escapeSQL(t.description)},
    ${escapeSQL(t.reporter_name)},
    ${escapeSQL(t.client_name)},
    ${escapeSQL(t.contact_user_name)},
    ${escapeSQL(t.job_title)},
    ${escapeSQL(t.module_name)},
    ${escapeSQL(t.submodule_name)},
    ${escapeSQL(t.canal)},
    ${escapeSQL(t.priority)},
    ${escapeSQL(t.status)},
    ${t.duration_minutes ? t.duration_minutes : 'NULL'},
    ${t.created_at ? `'${t.created_at}'::timestamptz` : 'NULL'},
    ${t.updated_at ? `'${t.updated_at}'::timestamptz` : 'NULL'},
    ${escapeSQL(t.action_menee)},
    ${escapeSQL(t.objet_principal)}
  )`).join(',\n')};

-- ============================================
-- ÉTAPE 3: UPSERT dans la table tickets (utilise ON CONFLICT sur jira_issue_key)
-- ============================================

DO $$
DECLARE
  v_ticket RECORD;
  v_obc_product_id UUID := '${OBC_PRODUCT_ID}';
  v_global_module_id UUID := '${GLOBAL_MODULE_ID}';
  v_company_id UUID;
  v_reporter_id UUID;
  v_contact_user_id UUID;
  v_module_id UUID;
  v_submodule_id UUID;
  v_ticket_id UUID;
  v_status TEXT;
  v_priority priority_t;
  v_canal canal_t;
BEGIN
  FOR v_ticket IN SELECT * FROM temp_assistance_tickets LOOP
    -- 1. Créer ou récupérer l'entreprise
    SELECT id INTO v_company_id
    FROM companies
    WHERE name = TRIM(v_ticket.client_name)
    LIMIT 1;
    
    IF v_company_id IS NULL THEN
      INSERT INTO companies (name)
      VALUES (TRIM(v_ticket.client_name))
      RETURNING id INTO v_company_id;
    END IF;
    
    -- 2. Créer ou récupérer le rapporteur (reporter)
    IF v_ticket.reporter_name IS NOT NULL AND TRIM(v_ticket.reporter_name) != '' THEN
      v_reporter_id := (
        SELECT id FROM profiles
        WHERE email = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(v_ticket.reporter_name), '[^a-zA-Z0-9\\s]', '', 'g'), '\\s+', '.', 'g')) || '@assistance.onpoint.local'
        LIMIT 1
      );
      
      IF v_reporter_id IS NULL THEN
        INSERT INTO profiles (full_name, email, role, company_id, job_title, is_active)
        VALUES (
          TRIM(v_ticket.reporter_name),
          LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(v_ticket.reporter_name), '[^a-zA-Z0-9\\s]', '', 'g'), '\\s+', '.', 'g')) || '@assistance.onpoint.local',
          'agent',
          NULL,
          NULLIF(TRIM(v_ticket.job_title), ''),
          true
        )
        ON CONFLICT (email) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          job_title = COALESCE(EXCLUDED.job_title, profiles.job_title)
        RETURNING id INTO v_reporter_id;
      END IF;
    END IF;
    
    -- 3. Créer ou récupérer l'utilisateur contact
    IF v_ticket.contact_user_name IS NOT NULL AND TRIM(v_ticket.contact_user_name) != '' THEN
      v_contact_user_id := (
        SELECT id FROM profiles
        WHERE email = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(v_ticket.contact_user_name), '[^a-zA-Z0-9\\s]', '', 'g'), '\\s+', '.', 'g')) || '@assistance.onpoint.local'
        LIMIT 1
      );
      
      IF v_contact_user_id IS NULL THEN
        INSERT INTO profiles (full_name, email, role, company_id, job_title, is_active)
        VALUES (
          TRIM(v_ticket.contact_user_name),
          LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(v_ticket.contact_user_name), '[^a-zA-Z0-9\\s]', '', 'g'), '\\s+', '.', 'g')) || '@assistance.onpoint.local',
          'client',
          v_company_id,
          NULLIF(TRIM(v_ticket.job_title), ''),
          true
        )
        ON CONFLICT (email) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          company_id = COALESCE(EXCLUDED.company_id, profiles.company_id),
          job_title = COALESCE(EXCLUDED.job_title, profiles.job_title)
        RETURNING id INTO v_contact_user_id;
      END IF;
    END IF;
    
    -- 4. Créer ou récupérer le module
    IF v_ticket.module_name IS NOT NULL AND TRIM(v_ticket.module_name) != '' THEN
      v_module_id := (
        SELECT id FROM modules
        WHERE name = TRIM(v_ticket.module_name) AND product_id = v_obc_product_id
        LIMIT 1
      );
      
      IF v_module_id IS NULL THEN
        INSERT INTO modules (name, product_id)
        VALUES (TRIM(v_ticket.module_name), v_obc_product_id)
        RETURNING id INTO v_module_id;
      END IF;
    ELSE
      v_module_id := v_global_module_id;
    END IF;
    
    -- 5. Créer ou récupérer le sous-module
    IF v_ticket.submodule_name IS NOT NULL AND TRIM(v_ticket.submodule_name) != '' THEN
      v_submodule_id := (
        SELECT id FROM submodules
        WHERE name = TRIM(v_ticket.submodule_name) AND module_id = v_module_id
        LIMIT 1
      );
      
      IF v_submodule_id IS NULL THEN
        INSERT INTO submodules (name, module_id)
        VALUES (TRIM(v_ticket.submodule_name), v_module_id)
        RETURNING id INTO v_submodule_id;
      END IF;
    END IF;
    
    -- 6. UPSERT du ticket (ON CONFLICT sur jira_issue_key)
    -- Mapper les valeurs avant l'INSERT
    -- Mapper le statut
      IF UPPER(TRIM(v_ticket.status)) LIKE '%TERMINÉ%' OR UPPER(TRIM(v_ticket.status)) LIKE '%TERMINE%' OR UPPER(TRIM(v_ticket.status)) LIKE '%RÉSOLU%' OR UPPER(TRIM(v_ticket.status)) LIKE '%RESOLU%' THEN
        v_status := 'Resolue';
      ELSIF UPPER(TRIM(v_ticket.status)) LIKE '%EN COURS%' OR UPPER(TRIM(v_ticket.status)) LIKE '%EN TRAITEMENT%' THEN
        v_status := 'En cours';
      ELSIF UPPER(TRIM(v_ticket.status)) LIKE '%EN ATTENTE%' THEN
        v_status := 'En attente';
      ELSE
        v_status := 'Nouveau';
      END IF;
      
      -- Mapper la priorité
      IF UPPER(TRIM(v_ticket.priority)) LIKE '%PRIORITÉ 1%' OR UPPER(TRIM(v_ticket.priority)) LIKE '%PRIORITE 1%' OR UPPER(TRIM(v_ticket.priority)) LIKE '%CRITIQUE%' THEN
        v_priority := 'Critical'::priority_t;
      ELSIF UPPER(TRIM(v_ticket.priority)) LIKE '%PRIORITÉ 2%' OR UPPER(TRIM(v_ticket.priority)) LIKE '%PRIORITE 2%' OR UPPER(TRIM(v_ticket.priority)) LIKE '%HAUTE%' THEN
        v_priority := 'High'::priority_t;
      ELSE
        v_priority := 'Low'::priority_t;
      END IF;
      
      -- Mapper le canal
      IF UPPER(TRIM(v_ticket.canal)) LIKE '%APPEL TÉLÉPHONIQUE%' OR UPPER(TRIM(v_ticket.canal)) LIKE '%APPEL TELEPHONIQUE%' THEN
        v_canal := 'Appel Téléphonique'::canal_t;
      ELSIF UPPER(TRIM(v_ticket.canal)) LIKE '%APPEL WHATSAPP%' THEN
        v_canal := 'Appel WhatsApp'::canal_t;
      ELSIF UPPER(TRIM(v_ticket.canal)) LIKE '%CHAT WHATSAPP%' THEN
        v_canal := 'Chat WhatsApp'::canal_t;
      ELSIF UPPER(TRIM(v_ticket.canal)) LIKE '%CHAT SMS%' THEN
        v_canal := 'Chat SMS'::canal_t;
      ELSIF UPPER(TRIM(v_ticket.canal)) LIKE '%E-MAIL%' OR UPPER(TRIM(v_ticket.canal)) LIKE '%EMAIL%' THEN
        v_canal := 'E-mail'::canal_t;
      ELSIF UPPER(TRIM(v_ticket.canal)) LIKE '%PRÉSENTIEL%' OR UPPER(TRIM(v_ticket.canal)) LIKE '%PRESENTIEL%' THEN
        v_canal := 'En présentiel'::canal_t;
      ELSIF UPPER(TRIM(v_ticket.canal)) LIKE '%ONLINE%' OR UPPER(TRIM(v_ticket.canal)) LIKE '%GOOGLE MEET%' OR UPPER(TRIM(v_ticket.canal)) LIKE '%TEAMS%' THEN
        v_canal := 'Online (Google Meet, Teams...)'::canal_t;
      ELSE
        v_canal := 'Autre'::canal_t;
      END IF;
      
      INSERT INTO tickets (
        jira_issue_key,
        title,
        description,
        ticket_type,
        status,
        priority,
        canal,
        company_id,
        created_by,
        contact_user_id,
        module_id,
        submodule_id,
        duration_minutes,
        created_at,
        updated_at,
        action_menee,
        objet_principal,
        affects_all_companies
      )
      VALUES (
        v_ticket.jira_issue_key,
        TRIM(v_ticket.title),
        NULLIF(TRIM(v_ticket.description), ''),
        'ASSISTANCE',
        v_status,
        v_priority,
        v_canal,
        v_company_id,
        v_reporter_id,
        v_contact_user_id,
        v_module_id,
        v_submodule_id,
        NULLIF(v_ticket.duration_minutes::DECIMAL, 0),
        COALESCE(v_ticket.created_at, NOW()),
        COALESCE(v_ticket.updated_at, v_ticket.created_at, NOW()),
        NULLIF(TRIM(v_ticket.action_menee), ''),
        NULLIF(TRIM(v_ticket.objet_principal), ''),
        false
      )
      ON CONFLICT (jira_issue_key) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        status = EXCLUDED.status,
        priority = EXCLUDED.priority,
        canal = EXCLUDED.canal,
        company_id = EXCLUDED.company_id,
        created_by = COALESCE(EXCLUDED.created_by, tickets.created_by),
        contact_user_id = COALESCE(EXCLUDED.contact_user_id, tickets.contact_user_id),
        module_id = EXCLUDED.module_id,
        submodule_id = EXCLUDED.submodule_id,
        duration_minutes = EXCLUDED.duration_minutes,
        created_at = COALESCE(EXCLUDED.created_at, tickets.created_at),
        updated_at = EXCLUDED.updated_at,
        action_menee = COALESCE(EXCLUDED.action_menee, tickets.action_menee),
        objet_principal = COALESCE(EXCLUDED.objet_principal, tickets.objet_principal);
  END LOOP;
END $$;

-- Nettoyer la table temporaire
DROP TABLE IF EXISTS temp_assistance_tickets;
`;

  return sql;
}

/**
 * Fonction principale
 */
async function main() {
  console.log('📥 Lecture du fichier CSV...\n');
  
  const csvContent = readFileSync(CSV_FILE, 'utf-8');
  const lines = csvContent.split('\n').filter(l => l.trim());
  
  if (lines.length < 2) {
    console.error('❌ Fichier CSV vide ou invalide');
    process.exit(1);
  }
  
  // Parser l'en-tête
  const headers = parseCSVLine(lines[0]);
  console.log('📋 Colonnes détectées:', headers.join(', '));
  
  // Trouver les indices des colonnes
  const indices = {
    title: headers.findIndex(h => h.includes('Résumé') || h.includes('Title')),
    jira_key: headers.findIndex(h => h.includes('Clé') || h.includes('Key')),
    type: headers.findIndex(h => h.includes('Type')),
    status: headers.findIndex(h => h.includes('État') || h.includes('Status')),
    priority: headers.findIndex(h => h.includes('Priorité') || h.includes('Priority')),
    reporter: headers.findIndex(h => h.includes('Rapporteur') || h.includes('Reporter')),
    duration: headers.findIndex(h => h.includes('Durée') || h.includes('Duration')),
    created: headers.findIndex(h => h.includes('Création') || h.includes('Created')),
    description: headers.findIndex(h => h.includes('Description')),
    action_menee: headers.findIndex(h => h.includes('Action menée')),
    canal: headers.findIndex(h => h.includes('Canal')),
    company: headers.findIndex(h => h.includes('Entreprise') || h.includes('Company')),
    contact: headers.findIndex(h => h.includes('Utilisateur') || h.includes('Contact')),
    objet_principal: headers.findIndex(h => h.includes('Objet principal')),
    module: headers.findIndex(h => h.includes('Module'))
  };
  
  console.log('\n📊 Indices des colonnes:', indices);
  
  // Parser les tickets
  const tickets = [];
  let skipped = 0;
  
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    
    if (fields.length < headers.length) {
      console.warn(`⚠️  Ligne ${i + 1}: nombre de champs incorrect (${fields.length} au lieu de ${headers.length})`);
      skipped++;
      continue;
    }
    
    const jiraKey = fields[indices.jira_key]?.trim();
    if (!jiraKey || !jiraKey.startsWith('OBCS-')) {
      skipped++;
      continue;
    }
    
    const createdAt = parseFrenchDate(fields[indices.created]?.trim());
    
    const ticket = {
      jira_issue_key: jiraKey,
      title: fields[indices.title]?.trim() || '',
      description: fields[indices.description]?.trim() || '',
      reporter_name: fields[indices.reporter]?.trim() || '',
      client_name: fields[indices.company]?.trim() || '',
      contact_user_name: fields[indices.contact]?.trim() || '',
      job_title: null,
      module_name: fields[indices.module]?.trim() || '',
      submodule_name: null,
      canal: fields[indices.canal]?.trim() || '',
      priority: fields[indices.priority]?.trim() || '',
      status: fields[indices.status]?.trim() || '',
      duration_minutes: parseDuration(fields[indices.duration]?.trim()),
      created_at: createdAt,
      updated_at: createdAt, // Utiliser la même date pour updated_at
      action_menee: fields[indices.action_menee]?.trim() || '',
      objet_principal: fields[indices.objet_principal]?.trim() || ''
    };
    
    tickets.push(ticket);
  }
  
  console.log(`\n✅ ${tickets.length} tickets parsés`);
  console.log(`⚠️  ${skipped} lignes ignorées\n`);
  
  // Créer le répertoire de sortie
  mkdirSync(OUTPUT_DIR, { recursive: true });
  
  // Générer les fichiers de migration par batch
  const totalParts = Math.ceil(tickets.length / BATCH_SIZE);
  console.log(`📦 Génération de ${totalParts} fichiers de migration...\n`);
  
  for (let i = 0; i < totalParts; i++) {
    const start = i * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, tickets.length);
    const batch = tickets.slice(start, end);
    
    const sql = generateMigrationSQL(batch, i + 1, totalParts);
    const outputFile = join(OUTPUT_DIR, `2025-12-10-import-all-assistance-part-${String(i + 1).padStart(2, '0')}.sql`);
    
    writeFileSync(outputFile, sql, 'utf-8');
    console.log(`✅ Partie ${i + 1}/${totalParts}: ${batch.length} tickets → ${outputFile}`);
  }
  
  console.log(`\n🎉 Migration générée avec succès !`);
  console.log(`📁 Répertoire: ${OUTPUT_DIR}`);
  console.log(`📊 Total: ${tickets.length} tickets en ${totalParts} fichiers`);
}

main().catch(console.error);

