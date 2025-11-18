/* eslint-disable no-console */
/**
 * Script d'import des sous-modules CRM depuis JIRA
 * 
 * Usage: node scripts/import-submodules-crm.js
 * 
 * Variables d'environnement requises:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import dotenv from 'dotenv';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// Charger .env.local en priorité si présent
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  dotenv.config({ path: envPath });
} catch {}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

// Données des sous-modules CRM depuis JIRA
const submodulesData = [
  { "Nom Sous-Module": "Activités commerciales", "ID Jira Sous-Module": 10860 },
  { "Nom Sous-Module": "Offres", "ID Jira Sous-Module": 10865 },
  { "Nom Sous-Module": "Clients", "ID Jira Sous-Module": 10861 },
  { "Nom Sous-Module": "Pilotage commercial", "ID Jira Sous-Module": 10864 }
];

async function importSubmodules() {
  console.log(`\n🔍 Recherche du module CRM...\n`);

  // Récupérer l'ID du module CRM (JIRA ID: 10033)
  const { data: crmModule, error: moduleErr } = await supabase
    .from('modules')
    .select('id, name, id_module_jira')
    .eq('id_module_jira', 10033)
    .single();

  if (moduleErr || !crmModule) {
    console.error(`❌ Module CRM non trouvé (JIRA ID: 10033)`);
    console.error(`   Erreur: ${moduleErr?.message || 'Module introuvable'}`);
    process.exit(1);
  }

  console.log(`✅ Module CRM trouvé (ID: ${crmModule.id}, Nom: ${crmModule.name})\n`);

  console.log(`🚀 Import de ${submodulesData.length} sous-modules...\n`);

  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  // Traiter chaque sous-module individuellement
  for (const submodule of submodulesData) {
    const submoduleName = submodule['Nom Sous-Module'];
    const jiraId = submodule['ID Jira Sous-Module'];

    try {
      // Vérifier si le sous-module existe déjà (par nom et module_id)
      const { data: existing } = await supabase
        .from('submodules')
        .select('id, name, id_module_jira')
        .eq('name', submoduleName)
        .eq('module_id', crmModule.id)
        .single();

      if (existing) {
        // Vérifier si l'ID JIRA est correct, sinon le mettre à jour
        if (existing.id_module_jira !== jiraId) {
          const { error: updateErr } = await supabase
            .from('submodules')
            .update({ id_module_jira: jiraId })
            .eq('id', existing.id);

          if (updateErr) {
            console.error(`⚠️  Erreur lors de la mise à jour de "${submoduleName}": ${updateErr.message}`);
            errorCount++;
          } else {
            console.log(`🔄 "${submoduleName}" mis à jour (ID JIRA: ${existing.id_module_jira} → ${jiraId})`);
            successCount++;
          }
        } else {
          console.log(`⏭️  "${submoduleName}" existe déjà (ID: ${existing.id}, JIRA: ${jiraId})`);
          skippedCount++;
        }
        continue;
      }

      // Insérer le nouveau sous-module avec l'ID JIRA
      const { data, error } = await supabase
        .from('submodules')
        .insert({
          name: submoduleName,
          module_id: crmModule.id,
          id_module_jira: jiraId
        })
        .select('id, name, id_module_jira')
        .single();

      if (error) {
        console.error(`❌ Erreur pour "${submoduleName}":`, error.message);
        errorCount++;
      } else {
        console.log(`✅ "${submoduleName}" importé (ID: ${data.id}, JIRA: ${data.id_module_jira})`);
        successCount++;
      }
    } catch (err) {
      console.error(`❌ Erreur pour "${submoduleName}":`, err.message);
      errorCount++;
    }
  }

  console.log(`\n📊 Résumé:`);
  console.log(`   ✅ Importés/Mis à jour: ${successCount}`);
  console.log(`   ⏭️  Déjà existants: ${skippedCount}`);
  console.log(`   ❌ Erreurs: ${errorCount}`);
  console.log(`\n✨ Import terminé!\n`);
}

// Exécuter l'import
importSubmodules()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Erreur fatale:', err);
    process.exit(1);
  });

