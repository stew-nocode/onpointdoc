/* eslint-disable no-console */
/**
 * Script de vérification des entreprises ONPOINT dans la base
 * 
 * Usage: node scripts/check-onpoint-companies.js
 */

import dotenv from 'dotenv';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

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

async function checkOnpointCompanies() {
  console.log(`\n🔍 Recherche des entreprises ONPOINT...\n`);

  const { data: companies, error } = await supabase
    .from('companies')
    .select('id, name, jira_company_id, created_at')
    .ilike('name', '%onpoint%')
    .order('name', { ascending: true });

  if (error) {
    console.error(`❌ Erreur lors de la recherche:`, error.message);
    process.exit(1);
  }

  if (!companies || companies.length === 0) {
    console.log(`⚠️  Aucune entreprise ONPOINT trouvée dans la base de données.\n`);
    process.exit(0);
  }

  console.log(`✅ ${companies.length} entreprise(s) ONPOINT trouvée(s):\n`);

  companies.forEach((company, index) => {
    console.log(`${index + 1}. ${company.name}`);
    console.log(`   ID: ${company.id}`);
    if (company.jira_company_id) {
      console.log(`   JIRA ID: ${company.jira_company_id}`);
    }
    console.log(`   Créée le: ${new Date(company.created_at).toLocaleDateString('fr-FR')}`);
    console.log('');
  });

  console.log(`\n💡 Pour utiliser une entreprise spécifique dans le script d'import,`);
  console.log(`   modifiez la recherche dans import-onpoint-africa-group-users.js`);
  console.log(`   ou utilisez directement l'ID de l'entreprise souhaitée.\n`);
}

checkOnpointCompanies()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Erreur fatale:', err);
    process.exit(1);
  });

