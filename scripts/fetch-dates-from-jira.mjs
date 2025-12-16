/**
 * Script pour récupérer les dates depuis JIRA et générer une migration SQL
 * 
 * Processus:
 * 1. Récupère tous les jira_issue_key des tickets d'assistance depuis Supabase
 * 2. Pour chaque ticket, appelle l'API JIRA via MCP pour récupérer les dates
 * 3. Génère un fichier SQL avec les UPDATE statements
 * 
 * Note: Ce script nécessite que le MCP JIRA soit configuré et accessible
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Configuration de sortie
const OUTPUT_DIR = join(__dirname, '..', 'supabase', 'migrations', 'fix-dates-from-jira');
const BATCH_SIZE = 500; // Nombre de tickets par fichier SQL

/**
 * Récupère tous les jira_issue_key des tickets d'assistance depuis Supabase
 */
async function getAllAssistanceTicketKeys() {
  console.log('📥 Récupération des tickets d\'assistance depuis Supabase...');
  
  const { data, error } = await supabase
    .from('tickets')
    .select('jira_issue_key')
    .eq('ticket_type', 'ASSISTANCE')
    .not('jira_issue_key', 'is', null)
    .like('jira_issue_key', 'OBCS-%')
    .order('jira_issue_key');
  
  if (error) {
    throw new Error(`Erreur Supabase: ${error.message}`);
  }
  
  console.log(`✅ ${data.length} tickets trouvés`);
  return data.map(t => t.jira_issue_key);
}

/**
 * Récupère les dates d'un ticket depuis JIRA via MCP
 * 
 * Note: Cette fonction devrait être appelée via l'API MCP JIRA
 * Pour l'instant, c'est un exemple de structure
 * 
 * @param {string} jiraIssueKey - Clé JIRA (ex: "OBCS-6362")
 * @returns {Promise<{created: string, updated: string, resolved: string|null}>}
 */
async function fetchDatesFromJira(jiraIssueKey) {
  // TODO: Implémenter l'appel MCP JIRA
  // Exemple avec mcp_jira_jira_get_issue:
  // const issue = await mcp_jira_jira_get_issue({
  //   issue_key: jiraIssueKey,
  //   fields: 'created,updated,resolutiondate'
  // });
  
  // Pour l'instant, retourne null (sera implémenté avec MCP)
  return null;
}

/**
 * Génère le fichier SQL de migration
 */
function generateMigrationSQL(updates, partNumber, totalParts) {
  const header = `-- OnpointDoc - Correction des dates depuis JIRA (PARTIE ${partNumber})
-- Date: ${new Date().toISOString().split('T')[0]}
-- Description: Met à jour les dates de création et mise à jour depuis JIRA
-- Partie ${partNumber} sur ${totalParts} (${updates.length} tickets)

`;

  const sqlStatements = updates.map(update => {
    const resolvedClause = update.resolved_at 
      ? `, resolved_at = '${update.resolved_at}'::timestamptz`
      : '';
    
    return `UPDATE tickets SET created_at = '${update.created_at}'::timestamptz, updated_at = '${update.updated_at}'::timestamptz${resolvedClause} WHERE jira_issue_key = '${update.jira_issue_key}';`;
  }).join('\n');

  return header + sqlStatements + '\n';
}

/**
 * Fonction principale
 */
async function main() {
  try {
    // 1. Récupérer tous les jira_issue_key
    const jiraIssueKeys = await getAllAssistanceTicketKeys();
    
    if (jiraIssueKeys.length === 0) {
      console.log('⚠️  Aucun ticket trouvé');
      return;
    }
    
    console.log(`\n🔄 Récupération des dates depuis JIRA pour ${jiraIssueKeys.length} tickets...`);
    console.log('⚠️  Note: Cette opération peut prendre plusieurs heures (rate limiting JIRA)');
    console.log('⚠️  Estimation: ~5-10 secondes par ticket\n');
    
    // 2. Pour chaque ticket, récupérer les dates depuis JIRA
    const updates = [];
    let processed = 0;
    let errors = 0;
    
    for (const jiraIssueKey of jiraIssueKeys) {
      try {
        const dates = await fetchDatesFromJira(jiraIssueKey);
        
        if (dates) {
          updates.push({
            jira_issue_key: jiraIssueKey,
            created_at: dates.created,
            updated_at: dates.updated,
            resolved_at: dates.resolved || null
          });
        }
        
        processed++;
        
        // Afficher la progression
        if (processed % 100 === 0) {
          console.log(`   Progression: ${processed}/${jiraIssueKeys.length} (${errors} erreurs)`);
        }
        
        // Rate limiting: attendre 100ms entre chaque requête
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`   ❌ Erreur pour ${jiraIssueKey}: ${error.message}`);
        errors++;
      }
    }
    
    console.log(`\n✅ Récupération terminée: ${updates.length} tickets mis à jour, ${errors} erreurs`);
    
    // 3. Générer les fichiers SQL par batch
    const totalParts = Math.ceil(updates.length / BATCH_SIZE);
    console.log(`\n📝 Génération de ${totalParts} fichier(s) SQL...`);
    
    for (let i = 0; i < totalParts; i++) {
      const start = i * BATCH_SIZE;
      const end = Math.min(start + BATCH_SIZE, updates.length);
      const batch = updates.slice(start, end);
      
      const sql = generateMigrationSQL(batch, i + 1, totalParts);
      const filename = join(OUTPUT_DIR, `2025-12-09-fix-assistance-tickets-dates-from-jira-part-${String(i + 1).padStart(2, '0')}.sql`);
      
      writeFileSync(filename, sql, 'utf-8');
      console.log(`   ✅ ${filename} (${batch.length} tickets)`);
    }
    
    console.log(`\n✅ Migration générée avec succès!`);
    console.log(`\n📋 Résumé:`);
    console.log(`   - Tickets traités: ${updates.length}`);
    console.log(`   - Erreurs: ${errors}`);
    console.log(`   - Fichiers générés: ${totalParts}`);
    console.log(`\n⚠️  Prochaine étape: Appliquer les migrations via Supabase MCP`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

// Exécuter le script
main();

