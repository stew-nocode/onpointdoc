/* eslint-disable no-console */
/**
 * Script d'import des contacts clients KOFFI & DIABATE
 * 
 * Usage: node scripts/import-contacts-koffi-diabate.js
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
  { "Nom Complet": "Corinne LADJI", "Email": "cl@koffi-diabate.com", "Rôle": "" },
  { "Nom Complet": "Diane N'GBLA", "Email": "dn@koffi-diabate.com", "Rôle": "Comptable & Responsable Administrative" },
  { "Nom Complet": "Kouadio N'dri Florent Alfred", "Email": "fy@koffi-diabate.com", "Rôle": "" },
  { "Nom Complet": "Alassane MEITE", "Email": "am@koffi-diabate.com", "Rôle": "" },
  { "Nom Complet": "Jeronime GBAGUIDI", "Email": "gj@koffi-diabate.com", "Rôle": "" },
  { "Nom Complet": "KADIA KOFFI", "Email": "kkoffi@koffi-diabate.com", "Rôle": "Responsable Stratégie Financière" },
  { "Nom Complet": "Auguste QUENUM", "Email": "aq@koffi-diabate.com", "Rôle": "Comptable" },
  { "Nom Complet": "Patrice KOUAO", "Email": "pk@koffi-diabate.com", "Rôle": "Comptable" },
  { "Nom Complet": "Huberte ZOUNVO", "Email": "zounvo.huberte@objectifci.com", "Rôle": "Comptable" },
  { "Nom Complet": "DESIRE ERIKA SARAKA", "Email": "esaraka@koffi-diabate.com", "Rôle": "" },
  { "Nom Complet": "LYDIE N'GUESSAN", "Email": "ln@koffi-diabate.com", "Rôle": "" }
];

async function importContacts() {
  console.log(`\n🔍 Recherche de l'entreprise KOFFI & DIABATE...\n`);

  const { data: companies, error: companyErr } = await supabase
    .from('companies')
    .select('id, name, jira_company_id')
    .ilike('name', '%koffi%diabate%');

  if (companyErr || !companies || companies.length === 0) {
    console.error(`❌ Entreprise KOFFI & DIABATE non trouvée`);
    console.error(`   Erreur: ${companyErr?.message || 'Entreprise introuvable'}`);
    process.exit(1);
  }

  const koffiDiabateCompany = companies[0];
  console.log(`✅ Entreprise KOFFI & DIABATE trouvée (ID: ${koffiDiabateCompany.id}, Nom: ${koffiDiabateCompany.name})\n`);

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
          .eq('company_id', koffiDiabateCompany.id)
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
          company_id: koffiDiabateCompany.id,
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

