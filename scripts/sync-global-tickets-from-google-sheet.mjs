/**
 * Script pour synchroniser les tickets à impact global depuis un Google Sheet
 * Télécharge le CSV depuis Google Sheets et génère la migration SQL
 * Règles: affects_all_companies = true, company_id = NULL, module Global
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1cZ5vXr6vkNC3JeXPFDFyWUA3qPqAqqfa9X7MYDVtXMM/edit?gid=1192006101#gid=1192006101';
const OUTPUT_FILE = 'supabase/migrations/2025-12-09-sync-global-tickets-from-sheet.sql';
const TEMP_CSV = 'temp_google_sheet_global_tickets.csv';

/**
 * Télécharge le CSV depuis Google Sheets
 */
async function downloadCSV(url) {
  const sheetId = url.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
  const gid = url.match(/gid=(\d+)/)?.[1];
  
  if (!sheetId || !gid) {
    throw new Error('Impossible d\'extraire l\'ID du sheet ou le gid');
  }
  
  const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
  
  console.log(`📥 Téléchargement depuis: ${exportUrl}`);
  
  let response = await fetch(exportUrl);
  
  // Gérer les redirections
  while (response.status === 307 || response.status === 302) {
    const location = response.headers.get('location');
    if (!location) break;
    console.log(`   → Redirection vers: ${location}`);
    response = await fetch(location);
  }
  
  if (!response.ok) {
    throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
  }
  
  return await response.text();
}

/**
 * Reconstruit les lignes CSV complètes (gère les retours à la ligne dans les champs)
 */
function reconstructCSVLines(content) {
  const lines = content.split('\n');
  const completeLines = [];
  let currentLine = '';
  let inQuotes = false;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine === '') {
      continue;
    }

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
 * Échappe les chaînes SQL
 */
function escapeSQL(str) {
  if (!str) return 'NULL';
  return `'${str.replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
}

/**
 * Parse une date (supporte ISO et format français)
 */
function parseDate(dateStr) {
  if (!dateStr || dateStr.trim() === '' || dateStr === 'Non renseigné') {
    return null;
  }

  // Format ISO: 2023-12-04 13:41
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/);
  if (isoMatch) {
    const [, year, month, day, hour, minute] = isoMatch;
    return `${year}-${month}-${day}T${hour}:${minute}:00.000Z`;
  }

  // Format français: 6/12/2023 17:33
  const frMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})/);
  if (frMatch) {
    const [, day, month, year, hour, minute] = frMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute}:00.000Z`;
  }

  // Format français simple: 6/12/2023
  const frSimpleMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (frSimpleMatch) {
    const [, day, month, year] = frSimpleMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00.000Z`;
  }

  return null;
}

/**
 * Mappe le type de ticket
 */
function mapTicketType(type) {
  if (!type) return 'NULL::ticket_type_t';
  const upper = type.toUpperCase().trim();
  if (upper === 'BUG') return "'BUG'::ticket_type_t";
  if (upper === 'REQ' || upper === 'REQUETE' || upper === 'REQUÊTE') return "'REQ'::ticket_type_t";
  if (upper === 'ASSISTANCE') return "'ASSISTANCE'::ticket_type_t";
  return 'NULL::ticket_type_t';
}

/**
 * Mappe la priorité
 */
function mapPriority(priority) {
  if (!priority) return "'Medium'::priority_t";
  const upper = priority.toUpperCase().trim();
  if (upper.includes('CRITICAL') || upper.includes('PRIORITÉ 1') || upper.includes('PRIORITE 1')) {
    return "'Critical'::priority_t";
  }
  if (upper.includes('HIGH') || upper.includes('PRIORITÉ 2') || upper.includes('PRIORITE 2')) {
    return "'High'::priority_t";
  }
  if (upper.includes('MEDIUM') || upper.includes('PRIORITÉ 3') || upper.includes('PRIORITE 3')) {
    return "'Medium'::priority_t";
  }
  if (upper.includes('LOW') || upper.includes('PRIORITÉ 4') || upper.includes('PRIORITE 4')) {
    return "'Low'::priority_t";
  }
  return "'Medium'::priority_t";
}

/**
 * Mappe le canal
 */
function mapCanal(canal) {
  if (!canal || canal.trim() === '') return "'autre'::canal_t";
  const upper = canal.toUpperCase().trim();
  if (upper.includes('PRÉSENTIEL') || upper.includes('PRESENTIEL')) return "'En présentiel'::canal_t";
  if (upper.includes('E-MAIL') || upper.includes('EMAIL')) return "'E-mail'::canal_t";
  if (upper.includes('TÉLÉPHONIQUE') || upper.includes('TELEPHONIQUE')) return "'Appel Téléphonique'::canal_t";
  if (upper.includes('WHATSAPP')) return "'Appel WhatsApp'::canal_t";
  if (upper.includes('CONSTAT INTERNE')) return "'Constat Interne'::canal_t";
  if (upper.includes('ONLINE') || upper.includes('GOOGLE MEET') || upper.includes('TEAMS')) {
    return "'Online (Google Meet, Teams...)'::canal_t";
  }
  return "'autre'::canal_t";
}

/**
 * Mappe le type de bug
 */
function mapBugType(bugType) {
  if (!bugType || bugType.trim() === '') return 'NULL::bug_type_enum';
  const upper = bugType.toUpperCase().trim();
  if (upper === 'AUTRES') return "'Autres'::bug_type_enum";
  if (upper.includes('DÉVERSEMENT') || upper.includes('DEVERSEMENT')) {
    return "'Mauvais déversement des données'::bug_type_enum";
  }
  if (upper.includes('ERREUR') || upper.includes('PAGE D\'ERREUR')) {
    return "'Page d\'erreur'::bug_type_enum";
  }
  if (upper.includes('ENREGISTREMENT')) {
    return "'Enregistrement impossible'::bug_type_enum";
  }
  if (upper.includes('CALCUL')) {
    return "'Dysfonctionnement sur le Calcul des salaires'::bug_type_enum";
  }
  if (upper.includes('FILTRE')) {
    return "'Dysfonctionnement des filtres'::bug_type_enum";
  }
  if (upper.includes('HISTORIQUE')) {
    return "'Historique vide/non exhaustif'::bug_type_enum";
  }
  if (upper.includes('DOUBLON') || upper.includes('DUPLICATION')) {
    return "'Duplication anormale'::bug_type_enum";
  }
  if (upper.includes('INCOHÉRENCE') || upper.includes('INCOHERENCE')) {
    return "'Incohérence des données'::bug_type_enum";
  }
  return "'Autres'::bug_type_enum";
}

/**
 * Génère le SQL de migration
 */
function generateSQL(tickets) {
  const sql = `-- OnpointDoc - Synchronisation des tickets à impact global depuis Google Sheet
-- Date: ${new Date().toISOString().split('T')[0]}
-- Généré automatiquement depuis scripts/sync-global-tickets-from-google-sheet.mjs
-- Total: ${tickets.length} tickets
-- Note: Ces tickets ont un impact global (affects_all_companies = true, company_id = NULL)

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
  created_at,
  updated_at,
  resolved_at
) VALUES
${tickets.map(t => {
  const descriptionSQL = t.description ? escapeSQL(t.description) : 'NULL';
  const ticketTypeSQL = mapTicketType(t.ticketType);
  const prioritySQL = mapPriority(t.priority);
  const canalSQL = mapCanal(t.canal);
  const statusSQL = escapeSQL(t.status); // Statut dynamique JIRA
  const bugTypeSQL = mapBugType(t.bugType);
  const reporterSQL = t.reporter ? escapeSQL(t.reporter) : 'NULL';
  const contactUserSQL = 'NULL'; // Toujours NULL pour les constats agents
  const moduleSQL = 'Global'; // Toujours Global
  const submoduleSQL = 'NULL';
  const featureSQL = 'NULL';
  const createdSQL = t.createdAt ? `'${t.createdAt}'::timestamptz` : 'NULL';
  const updatedSQL = t.updatedAt ? `'${t.updatedAt}'::timestamptz` : 'NULL';
  const resolvedSQL = t.resolvedAt ? `'${t.resolvedAt}'::timestamptz` : 'NULL';

  return `  (${escapeSQL(t.jiraIssueKey)}, ${escapeSQL(t.title)}, ${descriptionSQL}, ${ticketTypeSQL}, ${prioritySQL}, ${canalSQL}, ${statusSQL}, ${escapeSQL(moduleSQL)}, ${submoduleSQL}, ${featureSQL}, ${bugTypeSQL}, ${reporterSQL}, ${contactUserSQL}, ${createdSQL}, ${updatedSQL}, ${resolvedSQL})`;
}).join(',\n')}
;

-- ============================================
-- ÉTAPE 3: UPSERT des tickets
-- ============================================

DO $$
DECLARE
  v_ticket RECORD;
  v_module_id UUID;
  v_created_by UUID;
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
    -- Utiliser le module Global
    v_module_id := v_global_module_id;
    
    -- Rechercher le rapporteur
    IF v_ticket.reporter_name IS NOT NULL AND TRIM(v_ticket.reporter_name) != '' THEN
      SELECT id INTO v_created_by
      FROM profiles
      WHERE UPPER(TRIM(full_name)) = UPPER(TRIM(v_ticket.reporter_name))
      LIMIT 1;
    ELSE
      v_created_by := NULL;
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
      NULL, -- submodule_id toujours NULL pour Global
      NULL, -- feature_id toujours NULL pour Global
      v_ticket.bug_type::bug_type_enum,
      v_created_by,
      NULL, -- contact_user_id toujours NULL (constats agents)
      true, -- affects_all_companies = true (impact global)
      NULL, -- company_id toujours NULL (impact global)
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
      contact_user_id = EXCLUDED.contact_user_id,
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

async function main() {
  try {
    console.log('📥 Téléchargement du CSV depuis Google Sheets...');
    const csvContent = await downloadCSV(GOOGLE_SHEET_URL);
    writeFileSync(TEMP_CSV, csvContent, 'utf-8');
    console.log(`✅ CSV téléchargé et sauvegardé temporairement: ${TEMP_CSV}`);

    const lines = reconstructCSVLines(csvContent);
    if (lines.length < 2) {
      console.log('⚠️ Le fichier CSV est vide ou ne contient pas d\'en-têtes.');
      return;
    }

    const header = parseCSVLine(lines[0]);
    console.log('📋 En-têtes du CSV:', header.slice(0, 10).join(', '), '...');

    const colIndices = {
      jiraIssueKey: header.findIndex(h => h.includes('Clé Ticket IT') || h.includes('Ticket IT')),
      title: header.findIndex(h => h.includes('Résumé')),
      description: header.findIndex(h => h.includes('Description')),
      ticketType: header.findIndex(h => h.includes('Type_Ticket')),
      priority: header.findIndex(h => h.includes('Priorité')),
      canal: header.findIndex(h => h.includes('Canal')),
      status: header.findIndex(h => h.includes('Etat') || h.includes('État')),
      module: header.findIndex(h => h.includes('Module')),
      submodule: header.findIndex(h => h.includes('Sous-Module')),
      feature: header.findIndex(h => h.includes('Fonctionnalité')),
      bugType: header.findIndex(h => h.includes('Type de bug')),
      reporter: header.findIndex(h => h.includes('Rapporteur')),
      users: header.findIndex(h => h.includes('Utilisateurs')),
      createdAt: header.findIndex(h => h.includes('Date de creation de Jira')),
      updatedAt: header.findIndex(h => h.includes('Date de mise à jour Jira')),
      resolvedAt: header.findIndex(h => h.includes('Date de résolution')),
    };

    // Vérifier que les colonnes essentielles sont trouvées
    const requiredCols = ['jiraIssueKey', 'title', 'status'];
    for (const col of requiredCols) {
      if (colIndices[col] === -1) {
        throw new Error(`Colonne essentielle "${col}" non trouvée dans le CSV.`);
      }
    }
    console.log('🔍 Indices des colonnes:', Object.entries(colIndices).filter(([_, v]) => v !== -1).map(([k, v]) => `${k}:${v}`).join(', '));

    // Parser les tickets
    const tickets = [];
    for (let i = 1; i < lines.length; i++) {
      const fields = parseCSVLine(lines[i]);
      
      if (fields.length < 3) continue;

      const ticket = {
        jiraIssueKey: fields[colIndices.jiraIssueKey]?.trim() || '',
        title: fields[colIndices.title]?.trim() || '',
        description: fields[colIndices.description]?.trim() || '',
        ticketType: fields[colIndices.ticketType]?.trim() || '',
        bugType: fields[colIndices.bugType]?.trim() || '',
        reporter: fields[colIndices.reporter]?.trim() || '',
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

    console.log(`✅ ${tickets.length} tickets parsés`);

    // Générer le SQL
    console.log('📝 Génération du SQL de migration...');
    const sql = generateSQL(tickets);
    writeFileSync(OUTPUT_FILE, sql, 'utf-8');

    console.log(`\n✅ Migration SQL générée: ${OUTPUT_FILE}`);
    console.log(`📊 Total: ${tickets.length} tickets`);
    console.log(`📦 Taille: ${Math.round(sql.length / 1024)} KB`);
    
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






