/* eslint-disable no-console */
/**
 * Script d'import des sous-modules Projets depuis JIRA
 * 
 * Usage: node scripts/import-submodules-projets.js
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

// Données des sous-modules Projets (sans ID JIRA)
const submodulesData = [
  { "Nom Sous-Module": "Gérer mes projets" },
  { "Nom Sous-Module": "Gérer mes tâches" },
  { "Nom Sous-Module": "Feuille de temps" },
  { "Nom Sous-Module": "Note de frais" },
  { "Nom Sous-Module": "Analytique" }
];

async function importSubmodules() {
  console.log(`\n🔍 Recherche du module Projets...\n`);

  // Récupérer l'ID du module Projets (JIRA ID: 10032)
  const { data: projetsModule, error: moduleErr } = await supabase
    .from('modules')
    .select('id, name, id_module_jira')
    .eq('id_module_jira', 10032)
    .single();

  if (moduleErr || !projetsModule) {
    console.error(`❌ Module Projets non trouvé (JIRA ID: 10032)`);
    console.error(`   Erreur: ${moduleErr?.message || 'Module introuvable'}`);
    process.exit(1);
  }

  console.log(`✅ Module Projets trouvé (ID: ${projetsModule.id}, Nom: ${projetsModule.name})\n`);

  console.log(`🚀 Import de ${submodulesData.length} sous-modules (sans ID JIRA)...\n`);

  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  // Traiter chaque sous-module individuellement
  for (const submodule of submodulesData) {
    const submoduleName = submodule['Nom Sous-Module'];

    try {
      // Vérifier si le sous-module existe déjà (par nom et module_id)
      const { data: existing } = await supabase
        .from('submodules')
        .select('id, name, id_module_jira')
        .eq('name', submoduleName)
        .eq('module_id', projetsModule.id)
        .single();

      if (existing) {
        console.log(`⏭️  "${submoduleName}" existe déjà (ID: ${existing.id})`);
        skippedCount++;
        continue;
      }

      // Insérer le nouveau sous-module sans ID JIRA
      const { data, error } = await supabase
        .from('submodules')
        .insert({
          name: submoduleName,
          module_id: projetsModule.id
          // id_module_jira laissé vide (NULL) comme demandé
        })
        .select('id, name, id_module_jira')
        .single();

      if (error) {
        console.error(`❌ Erreur pour "${submoduleName}":`, error.message);
        errorCount++;
      } else {
        console.log(`✅ "${submoduleName}" importé (ID: ${data.id}, JIRA: ${data.id_module_jira || 'non défini'})`);
        successCount++;
      }
    } catch (err) {
      console.error(`❌ Erreur pour "${submoduleName}":`, err.message);
      errorCount++;
    }
  }

  console.log(`\n📊 Résumé:`);
  console.log(`   ✅ Importés: ${successCount}`);
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

