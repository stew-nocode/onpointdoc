/* eslint-disable no-console */
/**
 * Script d'import des contacts clients ENVAL LABORATOIRE
 * 
 * Usage: node scripts/import-contacts-enval.js
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

// Données des contacts ENVAL LABORATOIRE
const contactsData = [
  { "Nom Complet": "SEY ARTHUR", "Email": "avenance@enval-group.com", "Rôle": "Directeur Administratif et Financier" },
  { "Nom Complet": "Yannick YAO", "Email": "yannick@enval-group.com", "Rôle": "Responsable Achats et Logistique" }
];

async function importContacts() {
  console.log(`\n🔍 Recherche de l'entreprise ENVAL LABORATOIRE...\n`);

  // Récupérer l'ID de l'entreprise ENVAL LABORATOIRE
  const { data: companies, error: companyErr } = await supabase
    .from('companies')
    .select('id, name, jira_company_id')
    .ilike('name', '%enval%');

  if (companyErr || !companies || companies.length === 0) {
    console.error(`❌ Entreprise ENVAL LABORATOIRE non trouvée`);
    console.error(`   Erreur: ${companyErr?.message || 'Entreprise introuvable'}`);
    process.exit(1);
  }

  // Prendre la première entreprise trouvée (normalement il n'y en a qu'une)
  const envalCompany = companies[0];
  console.log(`✅ Entreprise ENVAL LABORATOIRE trouvée (ID: ${envalCompany.id}, Nom: ${envalCompany.name})\n`);

  console.log(`🚀 Import de ${contactsData.length} contacts clients...\n`);

  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  // Traiter chaque contact individuellement
  for (const contact of contactsData) {
    const fullName = contact['Nom Complet'];
    const email = contact['Email']?.trim() || null; // NULL si vide
    const jobTitle = contact['Rôle']?.trim() || null; // Fonction/poste de travail

    try {
      // Vérifier si le contact existe déjà (par email si présent, sinon par nom)
      let existing = null;
      if (email) {
        const { data } = await supabase
          .from('profiles')
          .select('id, email, full_name, company_id, job_title')
          .eq('email', email)
          .single();
        existing = data;
      } else {
        // Si pas d'email, vérifier par nom et company_id
        const { data } = await supabase
          .from('profiles')
          .select('id, email, full_name, company_id, job_title')
          .eq('full_name', fullName)
          .eq('company_id', envalCompany.id)
          .single();
        existing = data;
      }

      if (existing) {
        // Si le contact existe, mettre à jour la fonction si elle a changé
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

      // Insérer le nouveau contact client
      // Note: Pas de création dans auth.users pour l'instant (prévu pour l'avenir)
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          email: email, // Peut être NULL
          full_name: fullName,
          role: 'client',
          company_id: envalCompany.id,
          job_title: jobTitle, // Fonction/poste de travail
          jira_user_id: null, // Laissé vide comme demandé
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
  console.log(`ℹ️  Note: Ces contacts sont créés sans compte de connexion pour l'instant.`);
  console.log(`   L'authentification pourra être ajoutée ultérieurement si nécessaire.\n`);
}

// Exécuter l'import
importContacts()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Erreur fatale:', err);
    process.exit(1);
  });

