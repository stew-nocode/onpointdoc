/* eslint-disable no-console */
/**
 * Script d'import des entreprises depuis Airtable/JIRA
 * 
 * Usage: node scripts/import-companies.js
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

// Données des entreprises depuis Airtable
const companiesData = [
  { "Nom Entreprise": "SIT BTP", "ID Jira Entreprise": 11103 },
  { "Nom Entreprise": "SAPH", "ID Jira Entreprise": 11104 },
  { "Nom Entreprise": "SIPROCHIM", "ID Jira Entreprise": 11105 },
  { "Nom Entreprise": "DISTRILAB SANTE", "ID Jira Entreprise": 11106 },
  { "Nom Entreprise": "ISOCEL", "ID Jira Entreprise": 11107 },
  { "Nom Entreprise": "MATCA", "ID Jira Entreprise": 11108 },
  { "Nom Entreprise": "SCI TEG", "ID Jira Entreprise": 11109 },
  { "Nom Entreprise": "NTT COM", "ID Jira Entreprise": 11110 },
  { "Nom Entreprise": "CERIS", "ID Jira Entreprise": 11111 },
  { "Nom Entreprise": "CAP ENERGY", "ID Jira Entreprise": 11112 },
  { "Nom Entreprise": "NASIA", "ID Jira Entreprise": 11113 },
  { "Nom Entreprise": "MOVIS COTE DIVOIRE", "ID Jira Entreprise": 11114 },
  { "Nom Entreprise": "Easy Finance", "ID Jira Entreprise": 11115 },
  { "Nom Entreprise": "HAGEP", "ID Jira Entreprise": 11116 },
  { "Nom Entreprise": "MANUTENTION AFRICAINE COTE D'IVOIRE", "ID Jira Entreprise": 11117 },
  { "Nom Entreprise": "CIPREL", "ID Jira Entreprise": 11118 },
  { "Nom Entreprise": "CIE", "ID Jira Entreprise": 11119 },
  { "Nom Entreprise": "SODECI", "ID Jira Entreprise": 11120 },
  { "Nom Entreprise": "CTE", "ID Jira Entreprise": 11121 },
  { "Nom Entreprise": "SEP-CI", "ID Jira Entreprise": 11122 },
  { "Nom Entreprise": "FILTISAC", "ID Jira Entreprise": 11123 },
  { "Nom Entreprise": "NOIROT", "ID Jira Entreprise": 11124 },
  { "Nom Entreprise": "ASNA", "ID Jira Entreprise": 11125 },
  { "Nom Entreprise": "SOFIVO", "ID Jira Entreprise": 11126 },
  { "Nom Entreprise": "BCC", "ID Jira Entreprise": 11127 },
  { "Nom Entreprise": "SONACO", "ID Jira Entreprise": 11128 },
  { "Nom Entreprise": "AGUIMA", "ID Jira Entreprise": 11129 },
  { "Nom Entreprise": "AGRI 2000", "ID Jira Entreprise": 11130 },
  { "Nom Entreprise": "PAPETÀ", "ID Jira Entreprise": 11131 },
  { "Nom Entreprise": "SCI CAB", "ID Jira Entreprise": 11132 },
  { "Nom Entreprise": "SCI LA PYRAMIDE", "ID Jira Entreprise": 11133 },
  { "Nom Entreprise": "SCI LES PALMIERS", "ID Jira Entreprise": 11134 },
  { "Nom Entreprise": "SCI PRIMAVERA", "ID Jira Entreprise": 11135 },
  { "Nom Entreprise": "SCI RIMY", "ID Jira Entreprise": 11155 }
];

async function importCompanies() {
  console.log(`\n🧹 Nettoyage des entreprises existantes...\n`);

  // 1. Supprimer les liens de secteurs
  const { error: linkErr } = await supabase.from('company_sector_link').delete().neq('company_id', '00000000-0000-0000-0000-000000000000');
  if (linkErr) {
    console.warn(`⚠️  Erreur lors de la suppression des liens secteurs: ${linkErr.message}`);
  } else {
    console.log(`✅ Liens secteurs supprimés`);
  }

  // 2. Supprimer les relations company_sectors (si la table existe)
  const { error: sectorsErr } = await supabase.from('company_sectors').delete().neq('company_id', '00000000-0000-0000-0000-000000000000');
  if (sectorsErr && !sectorsErr.message.includes('does not exist')) {
    console.warn(`⚠️  Erreur lors de la suppression de company_sectors: ${sectorsErr.message}`);
  } else if (!sectorsErr) {
    console.log(`✅ Relations company_sectors supprimées`);
  }

  // 3. Mettre à jour profiles pour mettre company_id à NULL
  const { error: profilesErr } = await supabase.from('profiles').update({ company_id: null }).not('company_id', 'is', null);
  if (profilesErr) {
    console.warn(`⚠️  Erreur lors de la mise à jour des profiles: ${profilesErr.message}`);
  } else {
    console.log(`✅ Profiles mis à jour (company_id = NULL)`);
  }

  // 4. Supprimer toutes les entreprises
  const { data: existingCompanies, error: selectErr } = await supabase.from('companies').select('id, name');
  if (selectErr) {
    console.error(`❌ Erreur lors de la récupération des entreprises: ${selectErr.message}`);
  } else if (existingCompanies && existingCompanies.length > 0) {
    const { error: deleteErr } = await supabase.from('companies').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (deleteErr) {
      console.error(`❌ Erreur lors de la suppression des entreprises: ${deleteErr.message}`);
      throw new Error(`Impossible de supprimer les entreprises existantes: ${deleteErr.message}`);
    } else {
      console.log(`✅ ${existingCompanies.length} entreprise(s) supprimée(s)`);
    }
  } else {
    console.log(`ℹ️  Aucune entreprise existante à supprimer`);
  }

  console.log(`\n🚀 Import de ${companiesData.length} entreprises...\n`);

  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  // Traiter chaque entreprise individuellement pour gérer les conflits
  for (const company of companiesData) {
    const companyName = company['Nom Entreprise'];
    const jiraId = company['ID Jira Entreprise'];

    try {
      // Insérer la nouvelle entreprise avec l'ID JIRA
      // (Plus besoin de vérifier l'existence car on a tout supprimé)
      const { data, error } = await supabase
        .from('companies')
        .insert({
          name: companyName,
          jira_company_id: jiraId
        })
        .select('id, name, jira_company_id')
        .single();

      if (error) {
        console.error(`❌ Erreur pour "${companyName}":`, error.message);
        errorCount++;
      } else {
        console.log(`✅ "${companyName}" importée (ID: ${data.id}, JIRA: ${data.jira_company_id})`);
        successCount++;
      }
    } catch (err) {
      console.error(`❌ Erreur pour "${companyName}":`, err.message);
      errorCount++;
    }
  }

  console.log(`\n📊 Résumé:`);
  console.log(`   ✅ Importées: ${successCount}`);
  console.log(`   ⏭️  Déjà existantes: ${skippedCount}`);
  console.log(`   ❌ Erreurs: ${errorCount}`);
  console.log(`\n✨ Import terminé!\n`);
}

// Exécuter l'import
importCompanies()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Erreur fatale:', err);
    process.exit(1);
  });

