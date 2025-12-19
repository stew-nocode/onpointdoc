/**
 * Script de génération SQL pour synchroniser les tickets depuis client-users-all.csv
 * Génère une migration SQL complète avec UPSERT
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CSV_FILE = join(__dirname, '..', 'docs', 'ticket', 'client-users-all.csv - rest.csv');
const OUTPUT_FILE = join(__dirname, '..', 'supabase', 'migrations', `2025-12-08-sync-tickets-from-csv-rest.sql`);

// Fonction pour parser CSV avec gestion des guillemets et retours à la ligne
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

// Reconstruire les lignes complètes (gérer les retours à la ligne dans les champs)
function reconstructCSVLines(content) {
  const lines = content.split('\n');
  const completeLines = [];
  let currentLine = '';
  let inQuotes = false;
  let quoteCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineQuoteCount = (line.match(/"/g) || []).length;
    quoteCount += lineQuoteCount;
    
    // Détecter le début d'un nouveau ticket (commence par OBCS- ou OD-)
    const isNewTicket = /^(OBCS-\d+|OD-\d+),/.test(line.trim());
    
    if (inQuotes) {
      // On est dans un champ multi-lignes (description)
      currentLine += '\n' + line;
      // Si nombre pair de guillemets, on sort des guillemets
      if (quoteCount % 2 === 0) {
        inQuotes = false;
        quoteCount = 0;
      }
    } else if (isNewTicket && currentLine) {
      // Nouveau ticket détecté, sauvegarder le précédent
      completeLines.push(currentLine);
      currentLine = line;
      // Vérifier si cette ligne commence dans des guillemets
      if (lineQuoteCount % 2 === 1) {
        inQuotes = true;
        quoteCount = lineQuoteCount;
      } else {
        quoteCount = 0;
      }
    } else {
      // Continuer à accumuler la ligne actuelle
      if (currentLine) {
        currentLine += '\n' + line;
      } else {
        currentLine = line;
      }
      // Vérifier si on entre dans des guillemets
      if (lineQuoteCount % 2 === 1) {
        inQuotes = true;
        quoteCount = lineQuoteCount;
      } else {
        quoteCount = 0;
      }
    }
  }

  if (currentLine) {
    completeLines.push(currentLine);
  }

  return completeLines;
}

// Échapper les chaînes pour SQL
function escapeSQL(str) {
  if (!str) return 'NULL';
  return "'" + str.replace(/'/g, "''").replace(/\\/g, '\\\\') + "'";
}

// Parser une date (format ISO ou français)
function parseDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') return 'NULL';
  
  const trimmed = dateStr.trim();
  
  // Format ISO : "2025-10-24 09:34"
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/);
  if (isoMatch) {
    const [, year, month, day, hour, minute] = isoMatch;
    return `'${year}-${month}-${day} ${hour}:${minute}:00+00'::timestamptz`;
  }
  
  // Format français : "3/11/2025 11:30" ou "13/8/2025 08:45"
  const frenchMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})/);
  if (frenchMatch) {
    const [, day, month, year, hour, minute] = frenchMatch;
    const dayPadded = day.padStart(2, '0');
    const monthPadded = month.padStart(2, '0');
    return `'${year}-${monthPadded}-${dayPadded} ${hour.padStart(2, '0')}:${minute}:00+00'::timestamptz`;
  }
  
  // Format français sans heure : "3/11/2025"
  const frenchDateOnly = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (frenchDateOnly) {
    const [, day, month, year] = frenchDateOnly;
    const dayPadded = day.padStart(2, '0');
    const monthPadded = month.padStart(2, '0');
    return `'${year}-${monthPadded}-${dayPadded} 00:00:00+00'::timestamptz`;
  }
  
  // Format ISO date seule : "2025-10-24"
  const isoDateOnly = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDateOnly) {
    const [, year, month, day] = isoDateOnly;
    return `'${year}-${month}-${day} 00:00:00+00'::timestamptz`;
  }
  
  console.warn(`⚠️  Format de date non reconnu: "${trimmed}"`);
  return 'NULL';
}

// Mapping des priorités
function mapPriority(priority) {
  if (!priority) return 'NULL';
  const trimmed = priority.trim();
  
  if (trimmed.includes('Priorité 1') || trimmed === '1') return "'Critical'::priority_t";
  if (trimmed.includes('Priorité 2') || trimmed === '2') return "'High'::priority_t";
  if (trimmed.includes('Priorité 3') || trimmed === '3') return "'Medium'::priority_t";
  if (trimmed.includes('Priorité 4') || trimmed === '4') return "'Low'::priority_t";
  
  return 'NULL';
}

// Mapping des types de tickets
function mapTicketType(type) {
  if (!type) return 'NULL';
  const trimmed = type.trim();
  
  if (trimmed.toLowerCase().includes('bug')) return "'BUG'::ticket_type_t";
  if (trimmed.toLowerCase().includes('requête') || trimmed.toLowerCase().includes('requete')) return "'REQ'::ticket_type_t";
  
  return 'NULL';
}

// Mapping des canaux
function mapCanal(canal) {
  if (!canal) return "'Autre'::canal_t";
  const trimmed = canal.trim();
  
  // Mapping des canaux connus
  const canalMap = {
    'Constat Interne': 'Constat Interne',
    'En présentiel': 'En présentiel',
    'En prsentiel': 'En présentiel', // Typo
    'Appel Téléphonique': 'Appel Téléphonique',
    'Appel': 'Appel',
    'E-mail': 'E-mail',
    'Email': 'E-mail',
    'Whatsapp': 'Whatsapp',
    'Chat WhatsApp': 'Chat WhatsApp',
    'Appel WhatsApp': 'Appel WhatsApp',
    'Chat SMS': 'Chat SMS',
    'Online (Google Meet, Teams...)': 'Online (Google Meet, Teams...)',
    'Non enregistré': 'Non enregistré',
  };
  
  if (canalMap[trimmed]) {
    return `'${canalMap[trimmed].replace(/'/g, "''")}'::canal_t`;
  }
  
  return "'Autre'::canal_t";
}

// Mapping des types de bugs
function mapBugType(bugType) {
  if (!bugType || bugType.trim() === '' || bugType === 'Non renseigné') return 'NULL';
  
  const trimmed = bugType.trim();
  
  // Vérifier si c'est une valeur valide de l'enum
  const validBugTypes = [
    'Autres',
    'Mauvais déversement des données',
    'Dysfonctionnement sur le Calcul des salaires',
    'Duplication anormale',
    'Enregistrement impossible',
    'Page d\'erreur',
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
    'Dysfonctionnement des liens d\'accès',
    'Formulaire indisponible',
    'Erreur Ajax',
    'Export de données impossible',
    'Connexion impossible',
  ];
  
  if (validBugTypes.includes(trimmed)) {
    return `'${trimmed.replace(/'/g, "''")}'::bug_type_enum`;
  }
  
  return 'NULL';
}

// Mapping des statuts (conserver JIRA dynamiques)
function mapStatus(status) {
  if (!status) return 'NULL';
  const trimmed = status.trim();
  
  // Conserver les statuts JIRA dynamiques tels quels
  return escapeSQL(trimmed);
}

// Lire le fichier CSV
console.log('📖 Lecture du fichier CSV...');
const content = readFileSync(CSV_FILE, 'utf-8');
const completeLines = reconstructCSVLines(content);

// Parser l'en-tête
const header = parseCSVLine(completeLines[0]);
console.log(`✅ ${completeLines.length - 1} lignes détectées`);

// Index des colonnes
const colIndex = {
  ticketKey: header.indexOf('Clé de ticket'),
  ticketITKey: header.indexOf('Clé Ticket IT'),
  summary: header.indexOf('Résumé'),
  description: header.indexOf('Description'),
  reporter: header.indexOf('Rapporteur'),
  users: header.indexOf('Utilisateurs'),
  companies: header.indexOf('Entreprises'),
  team: header.indexOf('Equipe'),
  canal: header.indexOf('Canal'),
  module: header.indexOf('Module'),
  submodule: header.indexOf('Sous-Module(s)'),
  ticketType: header.indexOf('Type_Ticket'),
  bugType: header.indexOf('Type de bug'),
  project: header.indexOf('Projet'),
  priority: header.indexOf('Priorité'),
  status: header.indexOf('Etat'),
  createdDate: header.indexOf('Date de creation de Jira'),
  updatedDate: header.indexOf('Date de mise à jour Jira'),
  resolvedDate: header.indexOf('Date de résolution'),
  feature: header.indexOf('Fonctionnalité'),
};

// Parser les données
const tickets = [];
let skipped = 0;

for (let i = 1; i < completeLines.length; i++) {
  const fields = parseCSVLine(completeLines[i]);
  
  if (fields.length < header.length) {
    console.warn(`⚠️  Ligne ${i} ignorée (nombre de champs incorrect)`);
    skipped++;
    continue;
  }
  
  const ticketITKey = fields[colIndex.ticketITKey]?.trim();
  if (!ticketITKey || ticketITKey === '') {
    skipped++;
    continue;
  }
  
  tickets.push({
    ticketKey: fields[colIndex.ticketKey]?.trim() || '',
    ticketITKey: ticketITKey,
    summary: fields[colIndex.summary]?.trim() || '',
    description: fields[colIndex.description]?.trim() || '',
    reporter: fields[colIndex.reporter]?.trim() || '',
    users: fields[colIndex.users]?.trim() || '',
    companies: fields[colIndex.companies]?.trim() || '',
    team: fields[colIndex.team]?.trim() || '',
    canal: fields[colIndex.canal]?.trim() || '',
    module: fields[colIndex.module]?.trim() || '',
    submodule: fields[colIndex.submodule]?.trim() || '',
    ticketType: fields[colIndex.ticketType]?.trim() || '',
    bugType: fields[colIndex.bugType]?.trim() || '',
    project: fields[colIndex.project]?.trim() || '',
    priority: fields[colIndex.priority]?.trim() || '',
    status: fields[colIndex.status]?.trim() || '',
    createdDate: fields[colIndex.createdDate]?.trim() || '',
    updatedDate: fields[colIndex.updatedDate]?.trim() || '',
    resolvedDate: fields[colIndex.resolvedDate]?.trim() || '',
    feature: fields[colIndex.feature]?.trim() || '',
  });
}

console.log(`✅ ${tickets.length} tickets parsés (${skipped} ignorés)`);

// Générer la migration SQL
console.log('📝 Génération de la migration SQL...');

const sql = `-- OnpointDoc - Synchronisation des tickets depuis CSV (rest)
-- Date: 2025-12-08
-- Généré automatiquement depuis scripts/generate-sync-tickets-from-csv.mjs
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
  const statusSQL = mapStatus(t.status);
  const bugTypeSQL = mapBugType(t.bugType);
  const reporterSQL = t.reporter ? escapeSQL(t.reporter) : 'NULL';
  const contactUserSQL = t.users ? escapeSQL(t.users) : 'NULL';
  const companySQL = t.companies ? escapeSQL(t.companies) : 'NULL';
  const moduleSQL = t.module ? escapeSQL(t.module) : 'NULL';
  const submoduleSQL = t.submodule ? escapeSQL(t.submodule) : 'NULL';
  const featureSQL = t.feature ? escapeSQL(t.feature) : 'NULL';
  const createdDateSQL = parseDate(t.createdDate);
  const updatedDateSQL = parseDate(t.updatedDate);
  const resolvedDateSQL = parseDate(t.resolvedDate);
  
  return `  (${escapeSQL(t.ticketITKey)}, ${escapeSQL(t.summary)}, ${descriptionSQL}, ${ticketTypeSQL}, ${prioritySQL}, ${canalSQL}, ${statusSQL}, ${moduleSQL}, ${submoduleSQL}, ${featureSQL}, ${bugTypeSQL}, ${reporterSQL}, ${contactUserSQL}, ${companySQL}, ${createdDateSQL}, ${updatedDateSQL}, ${resolvedDateSQL})`;
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
        v_submodule_id := NULL; -- Pas de sous-module pour Global
      ELSE
        SELECT id INTO v_module_id
        FROM modules
        WHERE UPPER(TRIM(name)) = UPPER(TRIM(v_ticket.module_name))
        LIMIT 1;
      END IF;
    ELSE
      v_module_id := NULL;
    END IF;
    
    -- Rechercher le sous-module (seulement si module n'est pas Global)
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
    
    -- Rechercher la fonctionnalité (seulement si sous-module existe)
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
    
    -- Rechercher l'utilisateur contact (si présent, sinon c'est un constat interne)
    -- Note: Ne pas filtrer par rôle, car l'utilisateur peut être client, agent, etc.
    IF v_ticket.contact_user_name IS NOT NULL AND TRIM(v_ticket.contact_user_name) != '' THEN
      SELECT id INTO v_contact_user_id
      FROM profiles
      WHERE UPPER(TRIM(full_name)) = UPPER(TRIM(v_ticket.contact_user_name))
      LIMIT 1;
    ELSE
      v_contact_user_id := NULL; -- Constat interne, pas d'utilisateur contact
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
        false, -- affects_all_companies (tickets pour entreprises spécifiques)
        v_company_id, -- company_id (entreprise spécifique)
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

// Écrire le fichier SQL
writeFileSync(OUTPUT_FILE, sql, 'utf-8');
console.log(`✅ Migration SQL générée : ${OUTPUT_FILE}`);
console.log(`📊 ${tickets.length} tickets à synchroniser`);

