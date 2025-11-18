/* eslint-disable no-console */
/**
 * Script d'import des contacts clients FIRST CAPITAL
 * 
 * Usage: node scripts/import-contacts-first-capital.js
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

const contactsData = [
  { "Nom Complet": "Florence OUAYOU", "Email": "florence.ouayou@fc-sa.com", "Rôle": "Consultant DAF" },
  { "Nom Complet": "HERVE GERARD YOH", "Email": "herve-gerard.yoh@fc-sa.com", "Rôle": "Directeur d'Exploitation" },
  { "Nom Complet": "FERDINAND KOUADIO", "Email": "ferdinand.kouadio@fc-sa.com", "Rôle": "Comptable" },
  { "Nom Complet": "MARIE AUDE COFFIE", "Email": "marieaude.coffie@fc-sa.com", "Rôle": "Directeur Administratif et Financier" },
  { "Nom Complet": "SYLVIANE KOBRI", "Email": "sylviane.kobri@fc-sa.com", "Rôle": "Responsable des Ressources Humaines" }
];

async function importContacts() {
  console.log(`\n🔍 Recherche de l'entreprise FIRST CAPITAL...\n`);

  const { data: companies, error: companyErr } = await supabase
    .from('companies')
    .select('id, name, jira_company_id')
    .ilike('name', '%first%capital%');

  if (companyErr || !companies || companies.length === 0) {
    console.error(`❌ Entreprise FIRST CAPITAL non trouvée`);
    console.error(`   Erreur: ${companyErr?.message || 'Entreprise introuvable'}`);
    process.exit(1);
  }

  const firstCapitalCompany = companies[0];
  console.log(`✅ Entreprise FIRST CAPITAL trouvée (ID: ${firstCapitalCompany.id}, Nom: ${firstCapitalCompany.name})\n`);

  console.log(`🚀 Import de ${contactsData.length} contacts clients...\n`);

  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const contact of contactsData) {
    const fullName = contact['Nom Complet'];
    const email = contact['Email']?.trim() || null;
    const jobTitle = contact['Rôle']?.trim() || null;

    try {
      let existing = null;
      if (email) {
        const { data } = await supabase
          .from('profiles')
          .select('id, email, full_name, company_id, job_title')
          .eq('email', email)
          .single();
        existing = data;
      } else {
        const { data } = await supabase
          .from('profiles')
          .select('id, email, full_name, company_id, job_title')
          .eq('full_name', fullName)
          .eq('company_id', firstCapitalCompany.id)
          .single();
        existing = data;
      }

      if (existing) {
        if (jobTitle && existing.job_title !== jobTitle) {
          const { error: updateErr } = await supabase
            .from('profiles')
            .update({ job_title: jobTitle })
            .eq('id', existing.id);
          
          if (updateErr) {
            console.error(`❌ Erreur lors de la mise à jour de "${fullName}":`, updateErr.message);
            errorCount++;
          } else {
            console.log(`🔄 "${fullName}" mis à jour (Fonction: ${jobTitle})`);
            successCount++;
          }
        } else {
          console.log(`⏭️  "${fullName}" existe déjà (Email: ${existing.email || 'N/A'})`);
          skippedCount++;
        }
        continue;
      }

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          email: email,
          full_name: fullName,
          role: 'client',
          company_id: firstCapitalCompany.id,
          job_title: jobTitle,
          jira_user_id: null,
          is_active: true
        })
        .select('id, email, full_name, company_id, job_title')
        .single();

      if (error) {
        console.error(`❌ Erreur pour "${fullName}":`, error.message);
        errorCount++;
      } else {
        const emailDisplay = data.email || 'Sans email';
        const jobTitleDisplay = data.job_title ? `, Fonction: ${data.job_title}` : '';
        console.log(`✅ "${fullName}" importé (Email: ${emailDisplay}${jobTitleDisplay}, ID: ${data.id})`);
        successCount++;
      }
    } catch (err) {
      console.error(`❌ Erreur pour "${fullName}":`, err.message);
      errorCount++;
    }
  }

  console.log(`\n📊 Résumé:`);
  console.log(`   ✅ Importés/Mis à jour: ${successCount}`);
  console.log(`   ⏭️  Déjà existants: ${skippedCount}`);
  console.log(`   ❌ Erreurs: ${errorCount}`);
  console.log(`\n✨ Import terminé!\n`);
}

importContacts()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Erreur fatale:', err);
    process.exit(1);
  });

