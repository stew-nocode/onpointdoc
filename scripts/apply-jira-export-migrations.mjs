/**
 * Script pour appliquer les migrations de mise à jour depuis l'export JIRA
 * 
 * Exécute les fichiers SQL de migration via le client Supabase et affiche la progression
 */

import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
try {
  const envPath = join(__dirname, '..', '.env.local');
  dotenv.config({ path: envPath });
} catch {}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE ?? '';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY:', SERVICE_ROLE_KEY ? '✓' : '✗');
  process.exit(1);
}

// Créer le client Supabase avec service role
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

// Chemin vers les fichiers de migration
const MIGRATIONS_DIR = join(__dirname, '..', 'supabase', 'migrations', 'update-from-jira-export');

/**
 * Exécute une requête SQL via une fonction RPC Supabase
 * Note: Il faut d'abord créer une fonction SQL dans Supabase qui exécute du SQL brut
 */
async function executeSQLViaRPC(sql) {
  // Utiliser une fonction RPC qui exécute du SQL
  // Cette fonction doit être créée dans Supabase au préalable
  const { data, error } = await supabase.rpc('exec_sql', { query: sql });
  
  if (error) {
    throw new Error(`RPC Error: ${error.message}`);
  }
  
  return data;
}


/**
 * Parse un UPDATE statement SQL et retourne les données structurées
 */
function parseUpdateStatement(statement) {
  // Format: UPDATE tickets SET col1 = val1, col2 = val2 WHERE jira_issue_key = 'KEY';
  const setMatch = statement.match(/SET\s+(.+?)\s+WHERE/i);
  if (!setMatch) {
    throw new Error('Format UPDATE invalide: clause SET non trouvée');
  }

  const whereMatch = statement.match(/WHERE\s+jira_issue_key\s*=\s*'([^']+)'/i);
  if (!whereMatch) {
    throw new Error('Format UPDATE invalide: clause WHERE jira_issue_key non trouvée');
  }

  const jiraIssueKey = whereMatch[1];
  const setClause = setMatch[1];

  // Parser les paires colonne = valeur
  const updates = {};
  const pairs = setClause.split(',').map(p => p.trim());
  
  for (const pair of pairs) {
    const match = pair.match(/^(\w+)\s*=\s*(.+)$/);
    if (match) {
      const [, column, value] = match;
      // Nettoyer la valeur (enlever les quotes, gérer NULL, casts PostgreSQL, etc.)
      let cleanValue = value.trim();
      
      // Enlever les casts PostgreSQL (::timestamptz, ::text, etc.) AVANT de traiter les quotes
      cleanValue = cleanValue.replace(/::\w+$/, '').trim();
      
      if (cleanValue === 'NULL') {
        updates[column] = null;
      } else if (cleanValue.startsWith("'") && cleanValue.endsWith("'")) {
        // String ou Timestamp entre quotes: enlever les quotes et gérer les échappements
        cleanValue = cleanValue.slice(1, -1).replace(/''/g, "'");
        
        // Vérifier si c'est un timestamp ISO
        if (cleanValue.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
          updates[column] = cleanValue; // Timestamp ISO
        } else {
          updates[column] = cleanValue; // String normale
        }
      } else if (!isNaN(cleanValue) && cleanValue !== '' && !cleanValue.includes('-')) {
        // Number (vérifier qu'il n'y a pas de tiret pour éviter les dates)
        updates[column] = parseFloat(cleanValue);
      } else if (cleanValue.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
        // Timestamp ISO (sans quotes)
        updates[column] = cleanValue;
      } else {
        // Autre (garder tel quel)
        updates[column] = cleanValue;
      }
    }
  }

  return { jiraIssueKey, updates };
}

/**
 * Récupère la liste des tickets déjà mis à jour (avec action_menee ou objet_principal)
 */
async function getAlreadyUpdatedTickets() {
  const { data, error } = await supabase
    .from('tickets')
    .select('jira_issue_key')
    .not('action_menee', 'is', null)
    .not('objet_principal', 'is', null);
  
  if (error) {
    console.warn('   ⚠️  Impossible de récupérer les tickets déjà mis à jour:', error.message);
    return new Set();
  }
  
  return new Set(data.map(t => t.jira_issue_key));
}

/**
 * Parse et exécute les UPDATE statements individuellement via l'API Supabase
 */
async function executeUpdateStatements(sqlContent, alreadyUpdated = new Set()) {
  // Extraire toutes les lignes UPDATE complètes
  const lines = sqlContent.split('\n');
  const updateStatements = [];
  let currentStatement = '';

  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('UPDATE')) {
      if (currentStatement) {
        updateStatements.push(currentStatement.trim());
      }
      currentStatement = trimmed;
    } else if (currentStatement) {
      currentStatement += ' ' + trimmed;
      if (trimmed.endsWith(';')) {
        updateStatements.push(currentStatement.trim());
        currentStatement = '';
      }
    }
  }
  
  if (currentStatement) {
    updateStatements.push(currentStatement.trim());
  }

  if (updateStatements.length === 0) {
    console.warn('   ⚠️  Aucune instruction UPDATE trouvée dans le fichier');
    return { success: 0, failed: 0, errors: [] };
  }

  console.log(`   📝 ${updateStatements.length} instructions UPDATE à exécuter`);

  let success = 0;
  let failed = 0;
  const errors = [];

  // Exécuter chaque UPDATE via l'API Supabase
  for (let i = 0; i < updateStatements.length; i++) {
    const statement = updateStatements[i];
    
    try {
      // Parser l'UPDATE statement
      const { jiraIssueKey, updates } = parseUpdateStatement(statement);
      
      // Vérifier si ce ticket a déjà été mis à jour
      if (alreadyUpdated.has(jiraIssueKey)) {
        success++; // Compter comme succès car déjà fait
        continue; // Passer au suivant
      }
      
      // Exécuter la mise à jour via Supabase
      const { data, error } = await supabase
        .from('tickets')
        .update(updates)
        .eq('jira_issue_key', jiraIssueKey)
        .select('id');

      if (error) {
        throw new Error(error.message);
      }

      // Si aucune ligne n'a été mise à jour, le ticket n'existe peut-être pas
      if (!data || data.length === 0) {
        // Ne pas compter comme erreur, juste passer
        continue;
      }

      success++;
      
      // Afficher la progression tous les 50 updates
      if ((i + 1) % 50 === 0 || i === updateStatements.length - 1) {
        const percentage = Math.round((i + 1) / updateStatements.length * 100);
        console.log(`   ⏳ Progression: ${i + 1}/${updateStatements.length} (${percentage}%)`);
      }
    } catch (error) {
      failed++;
      errors.push({ statement: statement.substring(0, 100), error: error.message });
      
      // Afficher l'erreur mais continuer
      if (failed <= 10) {
        console.log(`   ⚠️  Erreur sur UPDATE ${i + 1}: ${error.message.substring(0, 150)}`);
      } else if (failed === 11) {
        console.log(`   ⚠️  ... (autres erreurs masquées, voir le résumé final)`);
      }
    }
    
    // Petite pause pour éviter la surcharge
    if (i < updateStatements.length - 1 && (i + 1) % 100 === 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return { success, failed, errors };
}

/**
 * Applique une migration en exécutant le SQL
 */
async function applyMigration(filePath, fileNumber, totalFiles, alreadyUpdated) {
  const fileName = filePath.split(/[/\\]/).pop();
  
  // Le message de début est déjà affiché dans la boucle principale si nécessaire
  const sqlContent = readFileSync(filePath, 'utf-8');
  
  try {
    // Compter les UPDATE statements
    const updateCount = (sqlContent.match(/^UPDATE/gm) || []).length;
    
    // Si le message n'a pas été affiché dans la boucle principale, l'afficher ici
    if (!sqlContent.includes('WHERE jira_issue_key')) {
      console.log(`\n📄 [${fileNumber}/${totalFiles}] Application de: ${fileName}`);
    }
    
    console.log(`   📊 ${updateCount} instructions UPDATE trouvées`);
    console.log('   ⚙️  Exécution du SQL...');
    
    // Exécuter chaque UPDATE individuellement via l'API Supabase
    console.log('   💡 Exécution UPDATE par UPDATE via API Supabase...');
    const result = await executeUpdateStatements(sqlContent, alreadyUpdated);
    
    if (result.failed === 0) {
      console.log(`   ✅ Migration appliquée avec succès (${result.success} UPDATE exécutés)`);
      result.success = true;
    } else {
      console.log(`   ⚠️  Migration partielle: ${result.success} réussis, ${result.failed} échoués`);
      result.success = result.failed < result.success; // Succès si majorité réussie
    }
    result.method = 'api';
    result.updateCount = updateCount;
    
    return result;
  } catch (error) {
    console.error(`   ❌ Erreur lors de l'application: ${error.message}`);
    return { success: false, error: error.message, updateCount: 0 };
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 Démarrage de l\'application des migrations JIRA Export\n');
  
  // Lister les fichiers de migration
  const files = readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.sql'))
    .sort()
    .map(file => join(MIGRATIONS_DIR, file));

  if (files.length === 0) {
    console.error('❌ Aucun fichier de migration trouvé dans:', MIGRATIONS_DIR);
    process.exit(1);
  }

  console.log(`📦 ${files.length} fichier(s) de migration trouvé(s)\n`);

  // Vérifier quels fichiers ont déjà été traités
  // On considère qu'un fichier est traité si la majorité de ses tickets ont action_menee et objet_principal
  console.log('🔍 Vérification des fichiers déjà traités...');
  const alreadyUpdated = await getAlreadyUpdatedTickets();
  console.log(`   ℹ️  ${alreadyUpdated.size} tickets déjà mis à jour trouvés\n`);

  const results = [];
  let totalSuccess = 0;
  let totalFailed = 0;
  let totalUpdates = 0;
  let skippedFiles = 0;

  // Appliquer chaque migration
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    // Vérifier rapidement si ce fichier a déjà été traité
    // (on peut le faire en vérifiant quelques tickets du fichier)
    const sqlContent = readFileSync(file, 'utf-8');
    const updateCount = (sqlContent.match(/^UPDATE/gm) || []).length;
    
    // Extraire tous les jira_issue_key du fichier
    const allKeys = sqlContent.match(/WHERE jira_issue_key = '([^']+)'/g)?.map(m => m.match(/'([^']+)'/)[1]) || [];
    
    if (allKeys.length > 0) {
      // Vérifier combien de tickets de ce fichier sont déjà mis à jour
      const alreadyUpdatedCount = allKeys.filter(k => alreadyUpdated.has(k)).length;
      const percentage = (alreadyUpdatedCount / allKeys.length) * 100;
      
      if (percentage >= 80) {
        // 80% ou plus des tickets sont déjà mis à jour, considérer le fichier comme traité
        console.log(`\n⏭️  [${i + 1}/${files.length}] Fichier déjà traité: ${file.split(/[/\\]/).pop()}`);
        console.log(`   ℹ️  ${alreadyUpdatedCount}/${allKeys.length} tickets déjà mis à jour (${percentage.toFixed(1)}%) - Fichier ignoré\n`);
        skippedFiles++;
        continue;
      } else if (alreadyUpdatedCount > 0) {
        // Certains tickets sont déjà mis à jour, on les ignorera individuellement
        console.log(`\n📄 [${i + 1}/${files.length}] Application de: ${file.split(/[/\\]/).pop()}`);
        console.log(`   ℹ️  ${alreadyUpdatedCount}/${allKeys.length} tickets déjà mis à jour seront ignorés`);
      }
    }
    
    const result = await applyMigration(file, i + 1, files.length, alreadyUpdated);
    
    results.push({ file, ...result });
    
    if (result.success) {
      totalSuccess++;
      totalUpdates += result.updateCount || 0;
    } else {
      totalFailed++;
    }
    
    // Pause entre les migrations pour éviter la surcharge
    if (i < files.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Résumé
  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSUMÉ');
  console.log('='.repeat(60));
  console.log(`✅ Migrations réussies: ${totalSuccess}/${files.length}`);
  console.log(`⏭️  Fichiers ignorés (déjà traités): ${skippedFiles}/${files.length}`);
  console.log(`❌ Migrations échouées: ${totalFailed}/${files.length}`);
  console.log(`📝 Total d'instructions UPDATE: ${totalUpdates}`);
  console.log('='.repeat(60));

  if (totalFailed > 0) {
    console.log('\n❌ Migrations échouées:');
    results
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`   - ${r.file.split(/[/\\]/).pop()}: ${r.error}`);
      });
    process.exit(1);
  }
}

// Exécuter le script
main().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});

