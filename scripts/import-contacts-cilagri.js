/* eslint-disable no-console */
/**
 * Script d'import des contacts clients CILAGRI
 * 
 * Usage: node scripts/import-contacts-cilagri.js
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

// Données des contacts CILAGRI
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

async function importContacts() {
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

  console.log(`🚀 Import de ${contactsData.length} contacts clients...\n`);

  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  // Traiter chaque contact individuellement
  for (const contact of contactsData) {
    const fullName = contact['Nom Complet'];
    const email = contact['Email']?.trim() || null; // NULL si vide
    const roleText = contact['Rôle']?.trim() || null; // Rôle textuel (pas le role du profil)

    try {
      // Vérifier si le contact existe déjà (par email si présent, sinon par nom)
      let existing = null;
      if (email) {
        const { data } = await supabase
          .from('profiles')
          .select('id, email, full_name, company_id')
          .eq('email', email)
          .single();
        existing = data;
      } else {
        // Si pas d'email, vérifier par nom et company_id
        const { data } = await supabase
          .from('profiles')
          .select('id, email, full_name, company_id')
          .eq('full_name', fullName)
          .eq('company_id', cilagriCompany.id)
          .single();
        existing = data;
      }

      if (existing) {
        console.log(`⏭️  "${fullName}" existe déjà (Email: ${existing.email || 'N/A'})`);
        skippedCount++;
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
          company_id: cilagriCompany.id,
          job_title: roleText, // Fonction/poste de travail
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
  console.log(`   ✅ Importés: ${successCount}`);
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

