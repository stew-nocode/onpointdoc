/* eslint-disable no-console */
/**
 * Script d'import/mise à jour complète des entreprises depuis JIRA
 * 
 * Usage: node scripts/import-companies-complete.js
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

// Liste complète des entreprises avec leurs IDs JIRA
const companiesData = [
  { "Nom Entreprise": "SIT BTP", "ID Jira Entreprise": 10376 },
  { "Nom Entreprise": "FALCON", "ID Jira Entreprise": 10051 },
  { "Nom Entreprise": "ALL", "ID Jira Entreprise": 10148 },
  { "Nom Entreprise": "ECORIGINE", "ID Jira Entreprise": 10460 },
  { "Nom Entreprise": "SIE-TRAVAUX", "ID Jira Entreprise": 10461 },
  { "Nom Entreprise": "CILAGRI", "ID Jira Entreprise": 10026 },
  { "Nom Entreprise": "KOFFI & DIABATE", "ID Jira Entreprise": 10375 },
  { "Nom Entreprise": "2AAZ", "ID Jira Entreprise": 10459 },
  { "Nom Entreprise": "AFREX/MEHO CAPITAL", "ID Jira Entreprise": 11056 },
  { "Nom Entreprise": "ENVIPUR", "ID Jira Entreprise": 11221 },
  { "Nom Entreprise": "S-TEL", "ID Jira Entreprise": 10070 },
  { "Nom Entreprise": "ETS MAB", "ID Jira Entreprise": 11057 },
  { "Nom Entreprise": "ONPOINT", "ID Jira Entreprise": 10028 },
  { "Nom Entreprise": "ARIC", "ID Jira Entreprise": 10022 },
  { "Nom Entreprise": "KORI TRANSPORT", "ID Jira Entreprise": 10061 },
  { "Nom Entreprise": "MATRELEC", "ID Jira Entreprise": 10064 },
  { "Nom Entreprise": "EGBV", "ID Jira Entreprise": 10047 },
  { "Nom Entreprise": "LABOGEM", "ID Jira Entreprise": 10076 },
  { "Nom Entreprise": "SERTEM", "ID Jira Entreprise": 10020 },
  { "Nom Entreprise": "JOEL K PROPERTIES", "ID Jira Entreprise": 10060 },
  { "Nom Entreprise": "SIS", "ID Jira Entreprise": 10077 },
  { "Nom Entreprise": "EDIPRESSE", "ID Jira Entreprise": 10081 },
  { "Nom Entreprise": "FIRST CAPITAL", "ID Jira Entreprise": 10052 },
  { "Nom Entreprise": "EJARA", "ID Jira Entreprise": 10048 },
  { "Nom Entreprise": "IVOIRE DEVELOPPEMENT", "ID Jira Entreprise": 10058 },
  { "Nom Entreprise": "CSCTICAO", "ID Jira Entreprise": 10079 },
  { "Nom Entreprise": "AFRIC URBA", "ID Jira Entreprise": 10023 },
  { "Nom Entreprise": "JOEL K PERFORMANCE", "ID Jira Entreprise": 10059 },
  { "Nom Entreprise": "VENUS DISTRIBUTION", "ID Jira Entreprise": 10075 },
  { "Nom Entreprise": "TEAM SUPPORT", "ID Jira Entreprise": 10151 },
  { "Nom Entreprise": "CHURN/TEST", "ID Jira Entreprise": 10373 },
  { "Nom Entreprise": "OTOMASYS", "ID Jira Entreprise": 10067 },
  { "Nom Entreprise": "CIP", "ID Jira Entreprise": 10080 },
  { "Nom Entreprise": "ROCFED", "ID Jira Entreprise": 10069 },
  { "Nom Entreprise": "ROADMAP", "ID Jira Entreprise": 10149 },
  { "Nom Entreprise": "ETRAKOM-CI", "ID Jira Entreprise": 10082 },
  { "Nom Entreprise": "IPT", "ID Jira Entreprise": 10056 },
  { "Nom Entreprise": "ENVAL LABORATOIRE", "ID Jira Entreprise": 10050 },
  { "Nom Entreprise": "HC CAPITAL PROPERTIES", "ID Jira Entreprise": 10053 },
  { "Nom Entreprise": "MYKA", "ID Jira Entreprise": 10065 },
  { "Nom Entreprise": "ELIO GROUP", "ID Jira Entreprise": 10049 },
  { "Nom Entreprise": "PROPERTY KRO", "ID Jira Entreprise": 10068 },
  { "Nom Entreprise": "NOAH", "ID Jira Entreprise": 10066 },
  { "Nom Entreprise": "SCI RIMY", "ID Jira Entreprise": 11155 },
  { "Nom Entreprise": "ONPOINT AFRICA", "ID Jira Entreprise": null } // Pas d'ID JIRA
];

async function importCompanies() {
  console.log(`\n🚀 Import/Mise à jour de ${companiesData.length} entreprises...\n`);

  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  // Traiter chaque entreprise individuellement
  for (const company of companiesData) {
    const companyName = company['Nom Entreprise'];
    const jiraId = company['ID Jira Entreprise'];

    try {
      // Vérifier si l'entreprise existe déjà (par nom)
      const { data: existing } = await supabase
        .from('companies')
        .select('id, name, jira_company_id')
        .eq('name', companyName)
        .single();

      if (existing) {
        // Vérifier si l'ID JIRA doit être mis à jour
        if (jiraId !== null && existing.jira_company_id !== jiraId) {
          const { error: updateErr } = await supabase
            .from('companies')
            .update({ jira_company_id: jiraId })
            .eq('id', existing.id);

          if (updateErr) {
            console.error(`⚠️  Erreur lors de la mise à jour de "${companyName}": ${updateErr.message}`);
            errorCount++;
          } else {
            console.log(`🔄 "${companyName}" mis à jour (ID JIRA: ${existing.jira_company_id || 'NULL'} → ${jiraId})`);
            updatedCount++;
          }
        } else if (jiraId === null && existing.jira_company_id !== null) {
          // Si l'ID JIRA doit être supprimé (mis à NULL)
          const { error: updateErr } = await supabase
            .from('companies')
            .update({ jira_company_id: null })
            .eq('id', existing.id);

          if (updateErr) {
            console.error(`⚠️  Erreur lors de la mise à jour de "${companyName}": ${updateErr.message}`);
            errorCount++;
          } else {
            console.log(`🔄 "${companyName}" mis à jour (ID JIRA: ${existing.jira_company_id} → NULL)`);
            updatedCount++;
          }
        } else {
          console.log(`⏭️  "${companyName}" existe déjà (ID JIRA: ${existing.jira_company_id || 'NULL'})`);
          skippedCount++;
        }
        continue;
      }

      // Insérer la nouvelle entreprise
      const { data, error } = await supabase
        .from('companies')
        .insert({
          name: companyName,
          jira_company_id: jiraId // Peut être NULL
        })
        .select('id, name, jira_company_id')
        .single();

      if (error) {
        console.error(`❌ Erreur pour "${companyName}":`, error.message);
        errorCount++;
      } else {
        const jiraDisplay = data.jira_company_id || 'NULL';
        console.log(`✅ "${companyName}" créée (ID JIRA: ${jiraDisplay})`);
        createdCount++;
      }
    } catch (err) {
      console.error(`❌ Erreur pour "${companyName}":`, err.message);
      errorCount++;
    }
  }

  console.log(`\n📊 Résumé:`);
  console.log(`   ✅ Créées: ${createdCount}`);
  console.log(`   🔄 Mises à jour: ${updatedCount}`);
  console.log(`   ⏭️  Déjà à jour: ${skippedCount}`);
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

