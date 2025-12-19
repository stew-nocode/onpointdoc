/**
 * Script pour diviser la migration des tickets d'assistance en plusieurs parties
 * Chaque partie contient 500 tickets maximum pour être acceptable par l'éditeur SQL Supabase
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const INPUT_FILE = join(__dirname, '..', 'supabase', 'migrations', '2025-12-09-sync-assistance-tickets-from-sheet.sql');
const OUTPUT_DIR = join(__dirname, '..', 'supabase', 'migrations', 'assistance-tickets-split');
const TICKETS_PER_FILE = 500; // Nombre de tickets par fichier

// En-tête et pied de page SQL
const SQL_HEADER = `-- OnpointDoc - Synchronisation des tickets d'assistance depuis Google Sheet (PARTIE {PART})
-- Date: 2025-12-09
-- Partie {PART} sur {TOTAL_PARTS}
-- Tickets: {START} à {END} sur 5308 total

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
`;

const SQL_FOOTER = `;

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
  v_obc_product_id UUID := '11111111-1111-1111-1111-111111111111';
  v_global_module_id UUID := '98ce1c5f-e53c-4baf-9af1-52255d499378';
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
          LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(v_ticket.reporter_name), '[^a-zA-Z0-9s]', '', 'g'), '\\s+', '.', 'g')) || '@assistance.onpoint.local',
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
          LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(v_ticket.contact_user_name), '[^a-zA-Z0-9s]', '', 'g'), '\\s+', '.', 'g')) || '@assistance.onpoint.local',
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
  
  RAISE NOTICE '=== RÉSUMÉ PARTIE {PART} ===';
  RAISE NOTICE 'Tickets créés: %', v_created_count;
  RAISE NOTICE 'Tickets mis à jour: %', v_updated_count;
  RAISE NOTICE 'Tickets ignorés: %', v_skipped_count;
END $$;

-- ============================================
-- NETTOYAGE
-- ============================================

DROP TABLE IF EXISTS temp_assistance_tickets;
`;

function splitMigration() {
  console.log('📖 Lecture du fichier de migration...');
  const content = readFileSync(INPUT_FILE, 'utf-8');
  
  // Extraire les lignes INSERT (entre "VALUES" et ";")
  const lines = content.split('\n');
  const insertStartIndex = lines.findIndex(line => line.trim().startsWith('INSERT INTO temp_assistance_tickets'));
  const valuesStartIndex = lines.findIndex((line, idx) => idx > insertStartIndex && line.trim() === 'VALUES');
  const insertEndIndex = lines.findIndex((line, idx) => idx > valuesStartIndex && line.trim() === ';');
  
  // Extraire les lignes de valeurs (tickets)
  const ticketLines = lines.slice(valuesStartIndex + 1, insertEndIndex);
  
  // Filtrer les lignes vides et garder seulement les lignes avec des données
  const validTicketLines = ticketLines.filter(line => {
    const trimmed = line.trim();
    return trimmed.length > 0 && trimmed.startsWith('(');
  });
  
  const totalTickets = validTicketLines.length;
  const totalParts = Math.ceil(totalTickets / TICKETS_PER_FILE);
  
  console.log(`📊 Total de tickets: ${totalTickets}`);
  console.log(`📦 Nombre de fichiers à créer: ${totalParts} (${TICKETS_PER_FILE} tickets par fichier)`);
  
  // Créer le dossier de sortie
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`📁 Dossier créé: ${OUTPUT_DIR}`);
  }
  
  // Diviser en parties
  for (let part = 1; part <= totalParts; part++) {
    const startIndex = (part - 1) * TICKETS_PER_FILE;
    const endIndex = Math.min(startIndex + TICKETS_PER_FILE, totalTickets);
    const partTickets = validTicketLines.slice(startIndex, endIndex);
    
    // Construire le contenu du fichier
    let fileContent = SQL_HEADER
      .replace(/{PART}/g, part)
      .replace(/{TOTAL_PARTS}/g, totalParts)
      .replace(/{START}/g, startIndex + 1)
      .replace(/{END}/g, endIndex);
    
    // Ajouter les tickets avec virgules appropriées
    fileContent += partTickets
      .map((line, idx) => {
        let trimmed = line.trim();
        // Retirer la virgule finale si présente
        if (trimmed.endsWith(',')) {
          trimmed = trimmed.slice(0, -1);
        }
        // Ajouter une virgule sauf pour le dernier ticket
        if (idx < partTickets.length - 1) {
          return trimmed + ',';
        }
        return trimmed;
      })
      .join('\n');
    
    // Ajouter le footer
    fileContent += SQL_FOOTER.replace(/{PART}/g, part);
    
    // Écrire le fichier
    const outputFile = join(OUTPUT_DIR, `2025-12-09-sync-assistance-tickets-part-${part.toString().padStart(2, '0')}.sql`);
    writeFileSync(outputFile, fileContent, 'utf-8');
    
    const fileSize = (fileContent.length / 1024).toFixed(2);
    console.log(`✅ Partie ${part}/${totalParts}: ${partTickets.length} tickets (${fileSize} KB) → ${outputFile}`);
  }
  
  console.log(`\n✨ Division terminée ! ${totalParts} fichiers créés dans ${OUTPUT_DIR}`);
  console.log(`\n📋 Instructions:`);
  console.log(`   1. Exécutez les fichiers dans l'ordre (part-01, part-02, etc.)`);
  console.log(`   2. Chaque fichier peut être exécuté dans l'éditeur SQL Supabase`);
  console.log(`   3. Attendez la fin de chaque partie avant de passer à la suivante`);
}

splitMigration();

