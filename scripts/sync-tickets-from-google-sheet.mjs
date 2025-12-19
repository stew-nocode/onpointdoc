/**
 * Script pour synchroniser les tickets depuis un Google Sheet
 * Télécharge le CSV depuis Google Sheets et génère la migration SQL
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import https from 'https';
import { createWriteStream } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// URL du Google Sheet (format CSV export)
const SHEET_ID = '1cZ5vXr6vkNC3JeXPFDFyWUA3qPqAqqfa9X7MYDVtXMM';
const GID = '313297810'; // ID de l'onglet
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

const OUTPUT_FILE = join(__dirname, '..', 'supabase', 'migrations', `2025-12-08-sync-tickets-from-sheet-${Date.now()}.sql`);
const TEMP_CSV = join(__dirname, '..', 'temp_sheet_export.csv');

/**
 * Télécharge le CSV depuis Google Sheets
 */
function downloadCSV(url, outputPath, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) {
      reject(new Error('Trop de redirections'));
      return;
    }

    const file = createWriteStream(outputPath);
    
    https.get(url, { followRedirect: false }, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log('✅ CSV téléchargé depuis Google Sheets');
          resolve();
        });
      } else if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        // Redirection
        file.close();
        const redirectUrl = response.headers.location.startsWith('http') 
          ? response.headers.location 
          : `https://docs.google.com${response.headers.location}`;
        console.log(`🔄 Redirection vers: ${redirectUrl}`);
        downloadCSV(redirectUrl, outputPath, redirectCount + 1)
          .then(resolve)
          .catch(reject);
      } else {
        file.close();
        reject(new Error(`Erreur HTTP ${response.statusCode}: ${response.statusMessage}`));
      }
    }).on('error', (err) => {
      file.close();
      reject(err);
    });
  });
}

/**
 * Parse le CSV avec gestion des guillemets et retours à la ligne
 */
function parseCSV(content) {
  const lines = [];
  let currentLine = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentLine += '"';
        i++; // Sauter le prochain guillemet
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === '\n' && !inQuotes) {
      lines.push(currentLine);
      currentLine = '';
    } else if (char !== '\r' || inQuotes) {
      currentLine += char;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Parse une ligne CSV
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
 * Échappe les chaînes SQL
 */
function escapeSQL(str) {
  if (!str) return 'NULL';
  return "'" + str.replace(/'/g, "''").replace(/\\/g, '\\\\') + "'";
}

/**
 * Mappe le type de ticket
 */
function mapTicketType(type) {
  if (!type) return 'NULL';
  const upper = type.toUpperCase();
  if (upper.includes('BUG')) return "'BUG'::ticket_type_t";
  if (upper.includes('REQ') || upper.includes('REQUÊTE')) return "'REQ'::ticket_type_t";
  return 'NULL';
}

/**
 * Mappe la priorité
 */
function mapPriority(priority) {
  if (!priority) return "'Critical'::priority_t";
  const upper = priority.toUpperCase();
  if (upper.includes('1') || upper.includes('CRITICAL') || upper.includes('CRITIQUE')) return "'Critical'::priority_t";
  if (upper.includes('2') || upper.includes('HIGH')) return "'High'::priority_t";
  if (upper.includes('3') || upper.includes('MEDIUM')) return "'Medium'::priority_t";
  if (upper.includes('4') || upper.includes('LOW')) return "'Low'::priority_t";
  return "'Critical'::priority_t";
}

/**
 * Mappe le canal
 */
function mapCanal(canal) {
  if (!canal) return "'autre'::canal_t";
  const upper = canal.toUpperCase();
  if (upper.includes('WHATSAPP')) return "'Appel WhatsApp'::canal_t";
  if (upper.includes('TÉLÉPHONE') || upper.includes('TELEPHONE')) return "'Appel Téléphonique'::canal_t";
  if (upper.includes('PRÉSENTIEL') || upper.includes('PRESENTIEL')) return "'En présentiel'::canal_t";
  if (upper.includes('EMAIL') || upper.includes('E-MAIL')) return "'E-mail'::canal_t";
  if (upper.includes('ONLINE') || upper.includes('MEET') || upper.includes('TEAMS')) return "'Online (Google Meet, Teams...)'::canal_t";
  if (upper.includes('CHAT')) return "'Chat WhatsApp'::canal_t";
  if (upper.includes('CONSTAT')) return "'Constat Interne'::canal_t";
  return "'autre'::canal_t";
}

/**
 * Mappe le type de bug
 */
function mapBugType(bugType) {
  if (!bugType) return 'NULL';
  const upper = bugType.toUpperCase();
  if (upper.includes('DÉVERSEMENT') || upper.includes('DEVERSEMENT')) return "'Mauvais déversement des données'::bug_type_enum";
  if (upper.includes('CALCUL')) return "'Dysfonctionnement sur le Calcul des salaires'::bug_type_enum";
  if (upper.includes('ERREUR') || upper.includes('PAGE')) return "'Page d''erreur'::bug_type_enum";
  if (upper.includes('IMPOSSIBLE')) return "'Enregistrement impossible'::bug_type_enum";
  if (upper.includes('RÉCUPÉRATION') || upper.includes('RECUPERATION')) return "'Récupération de données impossible'::bug_type_enum";
  if (upper.includes('LENTEUR')) return "'Lenteur Système'::bug_type_enum";
  if (upper.includes('HISTORIQUE')) return "'Historique vide/non exhaustif'::bug_type_enum";
  if (upper.includes('SUPPRESSION')) return "'Suppression impossible'::bug_type_enum";
  if (upper.includes('DUPLICATION')) return "'Duplication anormale'::bug_type_enum";
  if (upper.includes('IMPORT')) return "'Import de fichiers impossible'::bug_type_enum";
  if (upper.includes('AFFICHAGE')) return "'Non affichage de pages/données'::bug_type_enum";
  if (upper.includes('FILTRE')) return "'Dysfonctionnement des filtres'::bug_type_enum";
  if (upper.includes('EDITION')) return "'Edition impossible'::bug_type_enum";
  if (upper.includes('503') || upper.includes('ERROR')) return "'Error 503'::bug_type_enum";
  return "'Autres'::bug_type_enum";
}

/**
 * Parse une date au format français
 */
function parseDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') return null;
  
  // Format: "2025-11-14 15:17" ou "14/11/2025 18:14"
  const formats = [
    /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/, // 2025-11-14 15:17
    /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/, // 14/11/2025 18:14
    /^(\d{4})-(\d{2})-(\d{2})$/, // 2025-11-14
    /^(\d{2})\/(\d{2})\/(\d{4})$/, // 14/11/2025
  ];

  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      if (format === formats[0] || format === formats[2]) {
        // Format ISO
        const year = match[1];
        const month = match[2];
        const day = match[3];
        const hour = match[4] || '00';
        const minute = match[5] || '00';
        return `${year}-${month}-${day} ${hour}:${minute}:00+00`;
      } else {
        // Format français
        const day = match[1];
        const month = match[2];
        const year = match[3];
        const hour = match[4] || '00';
        const minute = match[5] || '00';
        return `${year}-${month}-${day} ${hour}:${minute}:00+00`;
      }
    }
  }
  
  return null;
}

/**
 * Génère le SQL de migration
 */
function generateSQL(tickets) {
  const sql = `-- OnpointDoc - Synchronisation des tickets depuis Google Sheet
-- Date: ${new Date().toISOString().split('T')[0]}
-- Généré automatiquement depuis scripts/sync-tickets-from-google-sheet.mjs
-- Total: ${tickets.length} tickets
-- Note: Ces tickets sont pour des entreprises spécifiques (affects_all_companies = false)

-- ============================================
-- ÉTAPE 1: Créer la table temporaire
-- ============================================

CREATE TEMP TABLE IF NOT EXISTS temp_tickets_csv (
  jira_issue_key TEXT NOT NULL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  ticket_type ticket_type_t,
  priority priority_t,
  canal canal_t,
  status TEXT NOT NULL,
  module_name TEXT,
  submodule_name TEXT,
  feature_name TEXT,
  bug_type bug_type_enum,
  reporter_name TEXT,
  contact_user_name TEXT,
  company_name TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
);

-- ============================================
-- ÉTAPE 2: Insérer les données dans la table temporaire
-- ============================================

INSERT INTO temp_tickets_csv (
  jira_issue_key,
  title,
  description,
  ticket_type,
  priority,
  canal,
  status,
  module_name,
  submodule_name,
  feature_name,
  bug_type,
  reporter_name,
  contact_user_name,
  company_name,
  created_at,
  updated_at,
  resolved_at
) VALUES
${tickets.map(t => {
  const descriptionSQL = t.description ? escapeSQL(t.description) : 'NULL';
  const ticketTypeSQL = mapTicketType(t.ticketType);
  const prioritySQL = mapPriority(t.priority);
  const canalSQL = mapCanal(t.canal);
  const statusSQL = escapeSQL(t.status);
  const bugTypeSQL = mapBugType(t.bugType);
  const reporterSQL = t.reporter ? escapeSQL(t.reporter) : 'NULL';
  const contactUserSQL = t.users ? escapeSQL(t.users) : 'NULL';
  const moduleSQL = t.module ? escapeSQL(t.module) : 'NULL';
  const submoduleSQL = t.submodule ? escapeSQL(t.submodule) : 'NULL';
  const featureSQL = t.feature ? escapeSQL(t.feature) : 'NULL';
  const companySQL = t.company ? escapeSQL(t.company) : 'NULL';
  const createdSQL = t.createdAt ? `'${t.createdAt}'::timestamptz` : 'NULL';
  const updatedSQL = t.updatedAt ? `'${t.updatedAt}'::timestamptz` : 'NULL';
  const resolvedSQL = t.resolvedAt ? `'${t.resolvedAt}'::timestamptz` : 'NULL';

  return `  (${escapeSQL(t.jiraIssueKey)}, ${escapeSQL(t.title)}, ${descriptionSQL}, ${ticketTypeSQL}, ${prioritySQL}, ${canalSQL}, ${statusSQL}, ${moduleSQL}, ${submoduleSQL}, ${featureSQL}, ${bugTypeSQL}, ${reporterSQL}, ${contactUserSQL}, ${companySQL}, ${createdSQL}, ${updatedSQL}, ${resolvedSQL})`;
}).join(',\n')};

-- ============================================
-- ÉTAPE 3: UPSERT des tickets
-- ============================================

DO $$
DECLARE
  v_ticket RECORD;
  v_module_id UUID;
  v_submodule_id UUID;
  v_feature_id UUID;
  v_created_by UUID;
  v_contact_user_id UUID;
  v_company_id UUID;
  v_existing_ticket_id UUID;
  v_global_module_id UUID := '98ce1c5f-e53c-4baf-9af1-52255d499378';
  v_created_count INTEGER := 0;
  v_updated_count INTEGER := 0;
  v_skipped_count INTEGER := 0;
BEGIN
  FOR v_ticket IN
    SELECT * FROM temp_tickets_csv
    WHERE jira_issue_key IS NOT NULL
      AND TRIM(jira_issue_key) != ''
      AND title IS NOT NULL
      AND TRIM(title) != ''
  LOOP
    -- Rechercher le module
    IF v_ticket.module_name IS NOT NULL AND TRIM(v_ticket.module_name) != '' THEN
      IF UPPER(TRIM(v_ticket.module_name)) = 'GLOBAL' THEN
        v_module_id := v_global_module_id;
        v_submodule_id := NULL;
      ELSE
        SELECT id INTO v_module_id
        FROM modules
        WHERE UPPER(TRIM(name)) = UPPER(TRIM(v_ticket.module_name))
        LIMIT 1;
      END IF;
    ELSE
      v_module_id := NULL;
    END IF;
    
    -- Rechercher le sous-module
    IF v_module_id IS NOT NULL AND v_module_id != v_global_module_id AND v_ticket.submodule_name IS NOT NULL AND TRIM(v_ticket.submodule_name) != '' THEN
      IF UPPER(TRIM(v_ticket.submodule_name)) = 'GLOBAL' THEN
        v_submodule_id := NULL;
      ELSE
        SELECT id INTO v_submodule_id
        FROM submodules
        WHERE module_id = v_module_id
          AND UPPER(TRIM(name)) = UPPER(TRIM(v_ticket.submodule_name))
        LIMIT 1;
      END IF;
    ELSE
      v_submodule_id := NULL;
    END IF;
    
    -- Rechercher la fonctionnalité
    IF v_submodule_id IS NOT NULL AND v_ticket.feature_name IS NOT NULL AND TRIM(v_ticket.feature_name) != '' THEN
      IF UPPER(TRIM(v_ticket.feature_name)) = 'GLOBAL' THEN
        v_feature_id := NULL;
      ELSE
        SELECT id INTO v_feature_id
        FROM features
        WHERE submodule_id = v_submodule_id
          AND UPPER(TRIM(name)) = UPPER(TRIM(v_ticket.feature_name))
        LIMIT 1;
      END IF;
    ELSE
      v_feature_id := NULL;
    END IF;
    
    -- Rechercher le rapporteur
    IF v_ticket.reporter_name IS NOT NULL AND TRIM(v_ticket.reporter_name) != '' THEN
      SELECT id INTO v_created_by
      FROM profiles
      WHERE UPPER(TRIM(full_name)) = UPPER(TRIM(v_ticket.reporter_name))
      LIMIT 1;
    ELSE
      v_created_by := NULL;
    END IF;
    
    -- Rechercher l'utilisateur contact
    IF v_ticket.contact_user_name IS NOT NULL AND TRIM(v_ticket.contact_user_name) != '' THEN
      SELECT id INTO v_contact_user_id
      FROM profiles
      WHERE UPPER(TRIM(full_name)) = UPPER(TRIM(v_ticket.contact_user_name))
      LIMIT 1;
    ELSE
      v_contact_user_id := NULL;
    END IF;
    
    -- Rechercher l'entreprise
    IF v_ticket.company_name IS NOT NULL AND TRIM(v_ticket.company_name) != '' THEN
      SELECT id INTO v_company_id
      FROM companies
      WHERE UPPER(TRIM(name)) = UPPER(TRIM(v_ticket.company_name))
      LIMIT 1;
    ELSE
      v_company_id := NULL;
    END IF;
    
    -- Vérifier si le ticket existe déjà
    SELECT id INTO v_existing_ticket_id
    FROM tickets
    WHERE jira_issue_key = v_ticket.jira_issue_key
    LIMIT 1;
    
    -- UPSERT du ticket
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
      created_at,
      updated_at,
      resolved_at,
      origin
    )
    VALUES (
      v_ticket.jira_issue_key,
      v_ticket.title,
      NULLIF(TRIM(v_ticket.description), ''),
      v_ticket.ticket_type::ticket_type_t,
      v_ticket.priority::priority_t,
      v_ticket.canal::canal_t,
      v_ticket.status,
      v_module_id,
      v_submodule_id,
      v_feature_id,
      v_ticket.bug_type::bug_type_enum,
      v_created_by,
      v_contact_user_id,
      false,
      v_company_id,
      COALESCE(v_ticket.created_at, NOW()),
      COALESCE(v_ticket.updated_at, NOW()),
      v_ticket.resolved_at,
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

DROP TABLE IF EXISTS temp_tickets_csv;
`;

  return sql;
}

/**
 * Fonction principale
 */
async function main() {
  try {
    console.log('📥 Téléchargement du CSV depuis Google Sheets...');
    console.log(`   URL: ${CSV_URL}`);
    process.stdout.write('   Téléchargement en cours...');
    await downloadCSV(CSV_URL, TEMP_CSV);
    process.stdout.write(' ✅\n');

    console.log('📄 Lecture et parsing du CSV...');
    process.stdout.write('   Lecture du fichier...');
    const csvContent = readFileSync(TEMP_CSV, 'utf-8');
    process.stdout.write(` ✅ (${Math.round(csvContent.length / 1024)} KB)\n`);
    
    process.stdout.write('   Parsing des lignes...');
    const lines = parseCSV(csvContent);
    process.stdout.write(` ✅ (${lines.length} lignes)\n`);

    if (lines.length < 2) {
      throw new Error('Le CSV ne contient pas assez de lignes');
    }

    // Parser l'en-tête
    process.stdout.write('   Analyse de l\'en-tête...');
    const header = parseCSVLine(lines[0]);
    process.stdout.write(` ✅ (${header.length} colonnes)\n`);

    // Trouver les indices des colonnes
    const colIndices = {
      jiraIssueKey: header.findIndex(h => h.includes('Clé Ticket IT') || h.includes('Ticket IT')),
      title: header.findIndex(h => h.includes('Résumé')),
      description: header.findIndex(h => h.includes('Description')),
      ticketType: header.findIndex(h => h.includes('Type_Ticket') || h.includes('Type')),
      bugType: header.findIndex(h => h.includes('Type de bug')),
      reporter: header.findIndex(h => h.includes('Rapporteur')),
      users: header.findIndex(h => h.includes('Utilisateurs')),
      company: header.findIndex(h => h.includes('Entreprises')),
      canal: header.findIndex(h => h.includes('Canal')),
      module: header.findIndex(h => h.includes('Module')),
      submodule: header.findIndex(h => h.includes('Sous-Module')),
      feature: header.findIndex(h => h.includes('Fonctionnalité')),
      priority: header.findIndex(h => h.includes('Priorité')),
      status: header.findIndex(h => h.includes('Etat') || h.includes('État')),
      createdAt: header.findIndex(h => h.includes('Date de creation') || h.includes('création')),
      updatedAt: header.findIndex(h => h.includes('Date de mise à jour')),
      resolvedAt: header.findIndex(h => h.includes('Date de résolution')),
    };

    console.log('🔍 Indices des colonnes:', colIndices);

    // Parser les tickets
    const tickets = [];
    const totalLines = lines.length - 1; // Exclure l'en-tête
    console.log(`\n📋 Parsing de ${totalLines} lignes...`);
    
    for (let i = 1; i < lines.length; i++) {
      if (i % 100 === 0 || i === 1) {
        process.stdout.write(`\r   Progression: ${i}/${totalLines} lignes (${Math.round(i/totalLines*100)}%)`);
      }
      
      const fields = parseCSVLine(lines[i]);
      
      if (fields.length < 3) continue; // Ignorer les lignes vides ou incomplètes

      const ticket = {
        jiraIssueKey: fields[colIndices.jiraIssueKey]?.trim() || '',
        title: fields[colIndices.title]?.trim() || '',
        description: fields[colIndices.description]?.trim() || '',
        ticketType: fields[colIndices.ticketType]?.trim() || '',
        bugType: fields[colIndices.bugType]?.trim() || '',
        reporter: fields[colIndices.reporter]?.trim() || '',
        users: fields[colIndices.users]?.trim() || '',
        company: fields[colIndices.company]?.trim() || '',
        canal: fields[colIndices.canal]?.trim() || '',
        module: fields[colIndices.module]?.trim() || '',
        submodule: fields[colIndices.submodule]?.trim() || '',
        feature: fields[colIndices.feature]?.trim() || '',
        priority: fields[colIndices.priority]?.trim() || '',
        status: fields[colIndices.status]?.trim() || '',
        createdAt: parseDate(fields[colIndices.createdAt]?.trim() || ''),
        updatedAt: parseDate(fields[colIndices.updatedAt]?.trim() || ''),
        resolvedAt: parseDate(fields[colIndices.resolvedAt]?.trim() || ''),
      };

      // Ignorer les tickets sans clé JIRA
      if (!ticket.jiraIssueKey || ticket.jiraIssueKey === '') {
        continue;
      }

      tickets.push(ticket);
    }
    
    process.stdout.write(`\r   Progression: ${totalLines}/${totalLines} lignes (100%)\n`);
    console.log(`✅ ${tickets.length} tickets parsés et valides`);

    // Générer le SQL
    console.log('\n📝 Génération du SQL de migration...');
    process.stdout.write('   Création des valeurs INSERT...');
    const sql = generateSQL(tickets);
    process.stdout.write(' ✅\n');
    
    process.stdout.write('   Écriture du fichier SQL...');
    writeFileSync(OUTPUT_FILE, sql, 'utf-8');
    process.stdout.write(' ✅\n');

    const fileSize = Math.round(sql.length / 1024);
    console.log(`\n✅ Migration SQL générée avec succès !`);
    console.log(`📁 Fichier: ${OUTPUT_FILE}`);
    console.log(`📊 Total: ${tickets.length} tickets`);
    console.log(`📦 Taille: ${fileSize} KB`);
    
    // Nettoyer le fichier temporaire
    try {
      const { unlinkSync } = await import('fs');
      unlinkSync(TEMP_CSV);
    } catch (e) {
      // Ignorer si le fichier n'existe pas
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

main();

