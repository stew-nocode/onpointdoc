/* eslint-disable no-console */
/**
 * Script de mise à jour des fonctions (job_title) pour les contacts CILAGRI déjà importés
 * 
 * Usage: node scripts/update-cilagri-job-titles.js
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

// Données des contacts CILAGRI avec leurs fonctions
const contactsData = [
  { "Nom Complet": "Nadia Jocelyn Bouazo", "Email": "jbouazo@cilagri.com", "Rôle": "Chef comptable" },
  { "Nom Complet": "EHUI Inesse", "Email": "iehui@cilagri.com", "Rôle": "Assistante Ressources H..." },
  { "Nom Complet": "Léa DIABATE", "Email": "", "Rôle": "" },
  { "Nom Complet": "Serge Tahi", "Email": "stahi@cilagricajou.com", "Rôle": "Comptable" },
  { "Nom Complet": "Narcisse Abaleyty KOFFI", "Email": "nkoffi@cilagri.com", "Rôle": "Directeur Technique" },
  { "Nom Complet": "ATTOUNGBRE K Gerard", "Email": "", "Rôle": "" },
  { "Nom Complet": "Léa N'GUESSAN", "Email": "inguessan@cilagricajou.com", "Rôle": "Responsable Juridique" },
  { "Nom Complet": "Aristide Kouadio", "Email": "akouadio@cilagri.com", "Rôle": "Comptable" },
  { "Nom Complet": "Tous les Chefs de service", "Email": "", "Rôle": "" },
  { "Nom Complet": "Natacha Seri", "Email": "nseri@cilagri.com", "Rôle": "Responsable Achats" },
  { "Nom Complet": "Sanata Coulibaly", "Email": "scoulibaly@cilagri.com", "Rôle": "Standard" },
  { "Nom Complet": "Eudes Yapi", "Email": "eyapi@cilagricajou.com", "Rôle": "Contrôleur de Gestion" }
];

async function updateJobTitles() {
  console.log(`\n🔍 Recherche de l'entreprise CILAGRI...\n`);

  // Récupérer l'ID de l'entreprise CILAGRI
  const { data: companies, error: companyErr } = await supabase
    .from('companies')
    .select('id, name, jira_company_id')
    .ilike('name', '%cilagri%');

  if (companyErr || !companies || companies.length === 0) {
    console.error(`❌ Entreprise CILAGRI non trouvée`);
    console.error(`   Erreur: ${companyErr?.message || 'Entreprise introuvable'}`);
    process.exit(1);
  }

  // Prendre la première entreprise trouvée (normalement il n'y en a qu'une)
  const cilagriCompany = companies[0];
  console.log(`✅ Entreprise CILAGRI trouvée (ID: ${cilagriCompany.id}, Nom: ${cilagriCompany.name})\n`);

  console.log(`🚀 Mise à jour des fonctions pour ${contactsData.length} contacts...\n`);

  let updatedCount = 0;
  let notFoundCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  // Traiter chaque contact individuellement
  for (const contact of contactsData) {
    const fullName = contact['Nom Complet'];
    const email = contact['Email']?.trim() || null;
    const jobTitle = contact['Rôle']?.trim() || null;

    try {
      // Chercher le contact par email (prioritaire) ou par nom + company_id
      let existing = null;
      if (email) {
        const { data } = await supabase
          .from('profiles')
          .select('id, email, full_name, company_id, job_title')
          .eq('email', email)
          .eq('company_id', cilagriCompany.id)
          .single();
        existing = data;
      } else {
        // Si pas d'email, chercher par nom et company_id
        const { data } = await supabase
          .from('profiles')
          .select('id, email, full_name, company_id, job_title')
          .eq('full_name', fullName)
          .eq('company_id', cilagriCompany.id)
          .single();
        existing = data;
      }

      if (!existing) {
        console.log(`⚠️  "${fullName}" non trouvé dans la base de données`);
        notFoundCount++;
        continue;
      }

      // Si la fonction est vide dans les données, on ne met pas à jour
      if (!jobTitle) {
        console.log(`⏭️  "${fullName}" - Fonction vide, ignoré`);
        skippedCount++;
        continue;
      }

      // Si la fonction est déjà la même, on skip
      if (existing.job_title === jobTitle) {
        console.log(`⏭️  "${fullName}" - Fonction déjà à jour: "${jobTitle}"`);
        skippedCount++;
        continue;
      }

      // Mettre à jour la fonction
      const { error } = await supabase
        .from('profiles')
        .update({ job_title: jobTitle })
        .eq('id', existing.id);

      if (error) {
        console.error(`❌ Erreur pour "${fullName}":`, error.message);
        errorCount++;
      } else {
        const oldTitle = existing.job_title || '(vide)';
        console.log(`✅ "${fullName}" - Fonction mise à jour: "${oldTitle}" → "${jobTitle}"`);
        updatedCount++;
      }
    } catch (err) {
      console.error(`❌ Erreur pour "${fullName}":`, err.message);
      errorCount++;
    }
  }

  console.log(`\n📊 Résumé:`);
  console.log(`   ✅ Mis à jour: ${updatedCount}`);
  console.log(`   ⏭️  Déjà à jour/Ignorés: ${skippedCount}`);
  console.log(`   ⚠️  Non trouvés: ${notFoundCount}`);
  console.log(`   ❌ Erreurs: ${errorCount}`);
  console.log(`\n✨ Mise à jour terminée!\n`);
}

// Exécuter la mise à jour
updateJobTitles()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Erreur fatale:', err);
    process.exit(1);
  });

