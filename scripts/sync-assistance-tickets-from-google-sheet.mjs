/**
 * Script pour synchroniser les tickets d'assistance depuis Google Sheet
 * Télécharge le CSV depuis Google Sheets et génère la migration SQL
 * 
 * Règles validées:
 * - Type: "Interaction" → ASSISTANCE
 * - Statut: "Terminé" → Resolue
 * - Priorité: "Priorité 3" → Low
 * - affects_all_companies = false
 * - Création automatique des utilisateurs, modules, sous-modules, entreprises
 * - Durée en minutes (DECIMAL)
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration Google Sheet
const SHEET_ID = '1cZ5vXr6vkNC3JeXPFDFyWUA3qPqAqqfa9X7MYDVtXMM';
const GID = '239102801'; // ID de l'onglet Assistance
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

const OUTPUT_FILE = join(__dirname, '..', 'supabase', 'migrations', `2025-12-09-sync-assistance-tickets-from-sheet.sql`);
const TEMP_CSV = join(__dirname, '..', 'temp_assistance_tickets.csv');

// IDs fixes
const OBC_PRODUCT_ID = '11111111-1111-1111-1111-111111111111';
const GLOBAL_MODULE_ID = '98ce1c5f-e53c-4baf-9af1-52255d499378';

/**
 * Télécharge un CSV depuis une URL
 */
async function downloadCSV(url) {
  return new Promise((resolve, reject) => {
    console.log(`📥 Téléchargement depuis: ${url}`);
    
    https.get(url, (res) => {
      if (res.statusCode === 307 || res.statusCode === 302) {
        const redirectUrl = res.headers.location;
        console.log(`🔄 Redirection vers: ${redirectUrl}`);
        return downloadCSV(redirectUrl).then(resolve).catch(reject);
      }
      
      if (res.statusCode !== 200) {
        reject(new Error(`Erreur HTTP ${res.statusCode}: ${res.statusMessage}`));
        return;
      }
      
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

/**
 * Reconstruit les lignes complètes (gère les retours à la ligne dans les champs)
 */
function reconstructCSVLines(content) {
  const lines = content.split('\n');
  const completeLines = [];
  let currentLine = '';
  let inQuotes = false;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine === '') continue;

    const quoteCount = (trimmedLine.match(/"/g) || []).length;

    if (inQuotes) {
      currentLine += '\n' + trimmedLine;
      if (quoteCount % 2 === 1) {
        inQuotes = false;
        completeLines.push(currentLine);
        currentLine = '';
      }
    } else {
      if (currentLine) {
        completeLines.push(currentLine);
      }
      currentLine = trimmedLine;
      if (quoteCount % 2 === 1) {
        inQuotes = true;
      } else {
        completeLines.push(currentLine);
        currentLine = '';
      }
    }
  }

  if (currentLine) {
    completeLines.push(currentLine);
  }

  return completeLines;
}

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
 * Parse une date française ou ISO
 */
function parseDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') return null;
  
  // Format français avec point: "20/juil./25 16:22" ou sans point: "29/juin/25 16:51"
  // Pattern flexible qui accepte avec ou sans point après le mois
  const frenchMatch = dateStr.match(/(\d{1,2})\/(\w+)\.?\/(\d{2})\s+(\d{1,2}):(\d{2})/);
  if (frenchMatch) {
    const [, day, month, year, hour, minute] = frenchMatch;
    // Normaliser le nom du mois (enlever le point s'il existe)
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
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
    return dateStr;
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
  
  // Mapping des canaux
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
  if (canalUpper.includes('NON RENSEIGNÉ') || canalUpper.includes('NON RENSEIGNE')) {
    return "'Autre'::canal_t";
  }
  
  return "'Autre'::canal_t";
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
 * Génère le SQL de migration
 */
function generateSQL(tickets) {
  const sql = `-- OnpointDoc - Synchronisation des tickets d'assistance depuis Google Sheet
-- Date: ${new Date().toISOString().split('T')[0]}
-- Généré automatiquement depuis scripts/sync-assistance-tickets-from-google-sheet.mjs
-- Total: ${tickets.length} tickets d'assistance
-- Note: Ces tickets sont de type ASSISTANCE avec affects_all_companies = false

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
  recorded_date TIMESTAMPTZ
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
  recorded_date
) VALUES
${tickets.map(t => {
  const descriptionSQL = t.description ? escapeSQL(t.description) : 'NULL';
  const reporterSQL = t.reporter ? escapeSQL(t.reporter) : 'NULL';
  const clientSQL = t.client ? escapeSQL(t.client) : 'NULL';
  const contactSQL = t.contactUser ? escapeSQL(t.contactUser) : 'NULL';
  const jobTitleSQL = t.jobTitle ? escapeSQL(t.jobTitle) : 'NULL';
  const moduleSQL = t.module ? escapeSQL(t.module) : 'NULL';
  const submoduleSQL = t.submodule ? escapeSQL(t.submodule) : 'NULL';
  const canalSQL = mapCanal(t.canal);
  const statusSQL = escapeSQL(t.status === 'Terminé' || t.status === 'Termin' ? 'Resolue' : (t.status || 'Resolue'));
  const durationSQL = t.duration ? parseDuration(t.duration) : 'NULL';
  const createdSQL = t.createdAt ? `'${t.createdAt}'::timestamptz` : (t.recordedDate ? `'${t.recordedDate}'::timestamptz` : 'NULL');
  const updatedSQL = t.updatedAt ? `'${t.updatedAt}'::timestamptz` : (t.createdAt ? `'${t.createdAt}'::timestamptz` : 'NULL');

  return `  (${escapeSQL(t.jiraIssueKey)}, ${escapeSQL(t.title)}, ${descriptionSQL}, ${reporterSQL}, ${clientSQL}, ${contactSQL}, ${jobTitleSQL}, ${moduleSQL}, ${submoduleSQL}, ${canalSQL}, 'Low'::priority_t, ${statusSQL}, ${durationSQL}, ${createdSQL}, ${updatedSQL}, ${t.recordedDate ? `'${t.recordedDate}'::timestamptz` : 'NULL'})`;
}).join(',\n')}
;

-- ============================================
-- ÉTAPE 3: UPSERT des tickets avec création automatique
-- ============================================

DO $$
DECLARE
  v_ticket RECORD;
  v_module_id UUID;
  v_submodule_id UUID;
  v_created_by UUID;
  v_contact_user_id UUID;
  v_company_id UUID;
  v_existing_ticket_id UUID;
  v_obc_product_id UUID := '${OBC_PRODUCT_ID}';
  v_global_module_id UUID := '${GLOBAL_MODULE_ID}';
  v_created_count INTEGER := 0;
  v_updated_count INTEGER := 0;
  v_skipped_count INTEGER := 0;
BEGIN
  FOR v_ticket IN
    SELECT * FROM temp_assistance_tickets
    WHERE jira_issue_key IS NOT NULL
      AND TRIM(jira_issue_key) != ''
      AND title IS NOT NULL
      AND TRIM(title) != ''
  LOOP
    -- ============================================
    -- GESTION DE L'ENTREPRISE (Client)
    -- ============================================
    IF v_ticket.client_name IS NOT NULL AND TRIM(v_ticket.client_name) != '' THEN
      SELECT id INTO v_company_id
      FROM companies
      WHERE UPPER(TRIM(name)) = UPPER(TRIM(v_ticket.client_name))
      LIMIT 1;
      
      -- Créer l'entreprise si elle n'existe pas
      IF v_company_id IS NULL THEN
        INSERT INTO companies (name, country_id, focal_user_id, jira_company_id)
        VALUES (TRIM(v_ticket.client_name), NULL, NULL, NULL)
        RETURNING id INTO v_company_id;
        RAISE NOTICE 'Entreprise créée: % (ID: %)', v_ticket.client_name, v_company_id;
      END IF;
    ELSE
      v_company_id := NULL;
    END IF;
    
    -- ============================================
    -- GESTION DU MODULE
    -- ============================================
    IF v_ticket.module_name IS NOT NULL AND TRIM(v_ticket.module_name) != '' THEN
      IF UPPER(TRIM(v_ticket.module_name)) = 'GLOBAL' THEN
        v_module_id := v_global_module_id;
      ELSE
        SELECT id INTO v_module_id
        FROM modules
        WHERE UPPER(TRIM(name)) = UPPER(TRIM(v_ticket.module_name))
        LIMIT 1;
        
        -- Créer le module si il n'existe pas
        IF v_module_id IS NULL THEN
          INSERT INTO modules (name, product_id)
          VALUES (TRIM(v_ticket.module_name), v_obc_product_id)
          RETURNING id INTO v_module_id;
          RAISE NOTICE 'Module créé: % (ID: %)', v_ticket.module_name, v_module_id;
        END IF;
      END IF;
    ELSE
      v_module_id := NULL;
    END IF;
    
    -- ============================================
    -- GESTION DU SOUS-MODULE
    -- ============================================
    IF v_module_id IS NOT NULL AND v_module_id != v_global_module_id AND v_ticket.submodule_name IS NOT NULL AND TRIM(v_ticket.submodule_name) != '' THEN
      SELECT id INTO v_submodule_id
      FROM submodules
      WHERE module_id = v_module_id
        AND UPPER(TRIM(name)) = UPPER(TRIM(v_ticket.submodule_name))
      LIMIT 1;
      
      -- Créer le sous-module si il n'existe pas
      IF v_submodule_id IS NULL THEN
        INSERT INTO submodules (name, module_id)
        VALUES (TRIM(v_ticket.submodule_name), v_module_id)
        RETURNING id INTO v_submodule_id;
        RAISE NOTICE 'Sous-module créé: % (ID: %)', v_ticket.submodule_name, v_submodule_id;
      END IF;
    ELSE
      v_submodule_id := NULL;
    END IF;
    
    -- ============================================
    -- GESTION DU RAPPORTEUR (created_by)
    -- ============================================
    IF v_ticket.reporter_name IS NOT NULL AND TRIM(v_ticket.reporter_name) != '' THEN
      SELECT id INTO v_created_by
      FROM profiles
      WHERE UPPER(TRIM(full_name)) = UPPER(TRIM(v_ticket.reporter_name))
      LIMIT 1;
      
      -- Créer l'utilisateur si il n'existe pas (agent interne)
      IF v_created_by IS NULL THEN
        INSERT INTO profiles (
          full_name,
          email,
          role,
          company_id,
          is_active
        )
        VALUES (
          TRIM(v_ticket.reporter_name),
          LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(v_ticket.reporter_name), '[^a-zA-Z0-9\s]', '', 'g'), '\\s+', '.', 'g')) || '@assistance.onpoint.local',
          'agent',
          NULL,
          true
        )
        RETURNING id INTO v_created_by;
        RAISE NOTICE 'Rapporteur créé: % (ID: %)', v_ticket.reporter_name, v_created_by;
      END IF;
    ELSE
      v_created_by := NULL;
    END IF;
    
    -- ============================================
    -- GESTION DU CONTACT UTILISATEUR (contact_user_id)
    -- ============================================
    IF v_ticket.contact_user_name IS NOT NULL AND TRIM(v_ticket.contact_user_name) != '' THEN
      SELECT id INTO v_contact_user_id
      FROM profiles
      WHERE UPPER(TRIM(full_name)) = UPPER(TRIM(v_ticket.contact_user_name))
        AND (v_company_id IS NULL OR company_id = v_company_id)
      LIMIT 1;
      
      -- Créer l'utilisateur si il n'existe pas (client)
      IF v_contact_user_id IS NULL THEN
        INSERT INTO profiles (
          full_name,
          email,
          role,
          company_id,
          job_title,
          is_active
        )
        VALUES (
          TRIM(v_ticket.contact_user_name),
          LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(v_ticket.contact_user_name), '[^a-zA-Z0-9\s]', '', 'g'), '\\s+', '.', 'g')) || '@assistance.onpoint.local',
          'client',
          v_company_id,
          NULLIF(TRIM(v_ticket.job_title), ''),
          true
        )
        RETURNING id INTO v_contact_user_id;
        RAISE NOTICE 'Contact utilisateur créé: % (ID: %)', v_ticket.contact_user_name, v_contact_user_id;
      END IF;
    ELSE
      v_contact_user_id := NULL;
    END IF;
    
    -- ============================================
    -- VÉRIFIER SI LE TICKET EXISTE DÉJÀ
    -- ============================================
    SELECT id INTO v_existing_ticket_id
    FROM tickets
    WHERE jira_issue_key = v_ticket.jira_issue_key
    LIMIT 1;
    
    -- ============================================
    -- UPSERT DU TICKET
    -- ============================================
    INSERT INTO tickets (
      jira_issue_key,
      title,
      description,
      ticket_type,
      priority,
      canal,
      status,
      module_id,
      submodule_id,
      feature_id,
      bug_type,
      created_by,
      contact_user_id,
      affects_all_companies,
      company_id,
      duration_minutes,
      created_at,
      updated_at,
      resolved_at,
      origin
    )
    VALUES (
      v_ticket.jira_issue_key,
      v_ticket.title,
      NULLIF(TRIM(v_ticket.description), ''),
      'ASSISTANCE'::ticket_type_t,
      'Low'::priority_t,
      v_ticket.canal::canal_t,
      v_ticket.status,
      v_module_id,
      v_submodule_id,
      NULL,
      NULL,
      v_created_by,
      v_contact_user_id,
      false,
      v_company_id,
      v_ticket.duration_minutes,
      COALESCE(v_ticket.created_at, v_ticket.recorded_date, NOW()),
      COALESCE(v_ticket.updated_at, v_ticket.created_at, NOW()),
      CASE WHEN v_ticket.status = 'Resolue' THEN COALESCE(v_ticket.updated_at, v_ticket.created_at, NOW()) ELSE NULL END,
      'jira'::origin_t
    )
    ON CONFLICT (jira_issue_key) DO UPDATE
    SET
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      ticket_type = EXCLUDED.ticket_type,
      priority = EXCLUDED.priority,
      canal = EXCLUDED.canal,
      status = EXCLUDED.status,
      module_id = EXCLUDED.module_id,
      submodule_id = EXCLUDED.submodule_id,
      feature_id = EXCLUDED.feature_id,
      bug_type = EXCLUDED.bug_type,
      created_by = COALESCE(EXCLUDED.created_by, tickets.created_by),
      contact_user_id = COALESCE(EXCLUDED.contact_user_id, tickets.contact_user_id),
      affects_all_companies = EXCLUDED.affects_all_companies,
      company_id = EXCLUDED.company_id,
      duration_minutes = EXCLUDED.duration_minutes,
      updated_at = EXCLUDED.updated_at,
      resolved_at = EXCLUDED.resolved_at;
    
    -- Compter création vs mise à jour
    IF v_existing_ticket_id IS NULL THEN
      v_created_count := v_created_count + 1;
    ELSE
      v_updated_count := v_updated_count + 1;
    END IF;
  END LOOP;
  
  RAISE NOTICE '=== RÉSUMÉ ===';
  RAISE NOTICE 'Tickets créés: %', v_created_count;
  RAISE NOTICE 'Tickets mis à jour: %', v_updated_count;
  RAISE NOTICE 'Tickets ignorés: %', v_skipped_count;
END $$;

-- ============================================
-- NETTOYAGE
-- ============================================

DROP TABLE IF EXISTS temp_assistance_tickets;
`;
  return sql;
}

async function main() {
  try {
    console.log('📥 Téléchargement du CSV depuis Google Sheets...');
    const csvContent = await downloadCSV(CSV_URL);
    writeFileSync(TEMP_CSV, csvContent, 'utf-8');
    console.log(`✅ CSV téléchargé et sauvegardé temporairement: ${TEMP_CSV}`);

    const lines = reconstructCSVLines(csvContent);
    if (lines.length < 2) {
      console.log('⚠️ Le fichier CSV est vide ou ne contient pas d\'en-têtes.');
      return;
    }

    const header = parseCSVLine(lines[0]);
    console.log('📋 En-têtes du CSV:', header.length, 'colonnes');

    // Identifier les indices des colonnes
    const colIndices = {
      jiraIssueKey: header.findIndex(h => h.includes('Clé de ticket') || h.includes('Clé')),
      title: header.findIndex(h => h.includes('Résumé')),
      description: header.findIndex(h => h.includes('Description')),
      reporter: header.findIndex(h => h.includes('Rapporteur')),
      client: header.findIndex(h => h.includes('Client')),
      contactUser: header.findIndex(h => h.includes('Interlocuteur')),
      jobTitle: header.findIndex(h => h.includes('Poste')),
      module: header.findIndex(h => h.includes('Module') && !h.includes('Sous')),
      submodule: header.findIndex(h => h.includes('Sous-Module')),
      canal: header.findIndex(h => h.includes('Canal')),
      priority: header.findIndex(h => h.includes('Priorité')),
      status: header.findIndex(h => h.includes('État') || h.includes('Etat')),
      duration: header.findIndex(h => h.includes('Durée')),
      createdAt: header.findIndex(h => h.includes('Création')),
      updatedAt: header.findIndex(h => h.includes('Mise à jour')),
      recordedDate: header.findIndex(h => h.includes('Date d\'enregistrement')),
    };

    console.log('🔍 Indices des colonnes:', JSON.stringify(colIndices, null, 2));

    // Parser les tickets
    const tickets = [];
    const totalLines = lines.length - 1; // Exclure l'en-tête
    console.log(`📊 Parsing de ${totalLines} lignes...`);
    
    for (let i = 1; i < lines.length; i++) {
      // Afficher la progression tous les 500 tickets
      if (i % 500 === 0 || i === 1) {
        const progress = ((i / totalLines) * 100).toFixed(1);
        console.log(`⏳ Progression: ${i}/${totalLines} lignes traitées (${progress}%)`);
      }
      
      const fields = parseCSVLine(lines[i]);
      
      if (fields.length < 3) continue;

      const ticket = {
        jiraIssueKey: fields[colIndices.jiraIssueKey]?.trim() || '',
        title: fields[colIndices.title]?.trim() || '',
        description: fields[colIndices.description]?.trim() || '',
        reporter: fields[colIndices.reporter]?.trim() || '',
        client: fields[colIndices.client]?.trim() || '',
        contactUser: fields[colIndices.contactUser]?.trim() || '',
        jobTitle: fields[colIndices.jobTitle]?.trim() || '',
        module: fields[colIndices.module]?.trim() || '',
        submodule: fields[colIndices.submodule]?.trim() || '',
        canal: fields[colIndices.canal]?.trim() || '',
        priority: fields[colIndices.priority]?.trim() || '',
        status: fields[colIndices.status]?.trim() || '',
        duration: fields[colIndices.duration]?.trim() || '',
        createdAt: parseDate(fields[colIndices.createdAt]?.trim() || ''),
        updatedAt: parseDate(fields[colIndices.updatedAt]?.trim() || ''),
        recordedDate: parseDate(fields[colIndices.recordedDate]?.trim() || ''),
      };

      // Ignorer les tickets sans clé JIRA
      if (!ticket.jiraIssueKey || ticket.jiraIssueKey === '') {
        continue;
      }

      tickets.push(ticket);
    }

    console.log(`✅ ${tickets.length} tickets parsés sur ${totalLines} lignes`);

    // Générer le SQL
    console.log('📝 Génération du SQL de migration...');
    console.log('⏳ Cela peut prendre quelques minutes pour 5308 tickets...');
    const startTime = Date.now();
    const sql = generateSQL(tickets);
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    console.log(`✅ SQL généré en ${duration} secondes`);
    writeFileSync(OUTPUT_FILE, sql, 'utf-8');

    console.log(`\n✅ Migration SQL générée: ${OUTPUT_FILE}`);
    console.log(`📊 Total: ${tickets.length} tickets d'assistance`);
    console.log(`📏 Taille du fichier: ${(sql.length / 1024 / 1024).toFixed(2)} MB`);
    
    // Nettoyer le fichier temporaire
    try {
      const { unlinkSync } = await import('fs');
      unlinkSync(TEMP_CSV);
      console.log('🧹 Fichier temporaire supprimé');
    } catch (e) {
      // Ignorer si le fichier n'existe pas
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

