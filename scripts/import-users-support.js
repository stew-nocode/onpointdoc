/* eslint-disable no-console */
/**
 * Script d'import des utilisateurs internes Support OBC depuis JIRA
 * 
 * Usage: node scripts/import-users-support.js
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

// Utiliser le client admin pour créer les utilisateurs auth
const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

// Données des utilisateurs Support OBC depuis JIRA
const usersData = [
  { 
    "Nom Complet": "GNAHORE AMOS", 
    "Email": "agnaore@onpointafrica.om", 
    "ID Jira Agent": "712020:bb02e93b-c270-4c40-a166-a19a42e5629a",
    "Role": "agent"
  },
  { 
    "Nom Complet": "N'GBRA MOYE BERNICE DORIS", 
    "Email": "mngbra@onpointafrica.com", 
    "ID Jira Agent": "712020:ffe79a03-939f-4c9b-b02b-de08425af5b9",
    "Role": "agent"
  },
  { 
    "Nom Complet": "Edwidge Kouassi", 
    "Email": "ekouassi@onpointafrica.om", 
    "ID Jira Agent": "5fb4dd9e2730d800765b5774",
    "Role": "agent"
  },
  { 
    "Nom Complet": "Vivien DAKPOGAN", 
    "Email": "vdakpogan@onpointafrica.com", 
    "ID Jira Agent": "712020:5c9548c8-e063-4cc7-b9e3-98eb370e0d9e",
    "Role": "manager"
  },
  { 
    "Nom Complet": "EVA BASSE", 
    "Email": "ebasse@onpointafrica.om", 
    "ID Jira Agent": "712020:d1487731-a3f9-4fd1-af7d-03ad9af2dc5e",
    "Role": "agent"
  },
  { 
    "Nom Complet": "JOEL SIE", 
    "Email": "jsie@onpointafrica.om", 
    "ID Jira Agent": "712020:59ca107e-6201-472e-ab9d-ea6a335fbe18",
    "Role": "agent"
  },
  { 
    "Nom Complet": "CHARLEY KOUAME", 
    "Email": "hkouame@onpointafrica.com", 
    "ID Jira Agent": "712020:1294eacb-4c40-4947-a874-6af47ae70d35",
    "Role": "agent"
  }
];

async function importUsers() {
  console.log(`\n🚀 Import de ${usersData.length} utilisateurs Support OBC...\n`);

  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  // Traiter chaque utilisateur individuellement
  for (const user of usersData) {
    const fullName = user['Nom Complet'];
    const email = user['Email'];
    const jiraId = user['ID Jira Agent'];
    const role = user['Role']; // 'agent' ou 'manager'

    try {
      // Vérifier si l'utilisateur existe déjà (par email)
      const { data: existing } = await supabaseAdmin
        .from('profiles')
        .select('id, email, full_name, role, jira_user_id')
        .eq('email', email)
        .single();

      if (existing) {
        // Mettre à jour l'ID JIRA si nécessaire
        if (existing.jira_user_id !== jiraId) {
          const { error: updateErr } = await supabaseAdmin
            .from('profiles')
            .update({ 
              jira_user_id: jiraId,
              full_name: fullName,
              role: role,
              department: 'Support'
            })
            .eq('id', existing.id);

          if (updateErr) {
            console.error(`⚠️  Erreur lors de la mise à jour de "${fullName}": ${updateErr.message}`);
            errorCount++;
          } else {
            console.log(`🔄 "${fullName}" mis à jour (JIRA: ${jiraId})`);
            successCount++;
          }
        } else {
          console.log(`⏭️  "${fullName}" existe déjà (Email: ${email}, JIRA: ${jiraId})`);
          skippedCount++;
        }
        continue;
      }

      // Générer un mot de passe temporaire (l'utilisateur devra le changer)
      const tempPassword = `Temp${Math.random().toString(36).slice(-12)}!`;

      // Créer l'utilisateur dans auth.users
      const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true
      });

      if (authErr || !authUser?.user) {
        console.error(`❌ Erreur création auth pour "${fullName}": ${authErr?.message || 'Erreur inconnue'}`);
        errorCount++;
        continue;
      }

      // Créer le profil dans profiles
      const { data: profile, error: profileErr } = await supabaseAdmin
        .from('profiles')
        .insert({
          auth_uid: authUser.user.id,
          email,
          full_name: fullName,
          role: role,
          department: 'Support',
          jira_user_id: jiraId,
          is_active: true
        })
        .select('id, email, full_name, jira_user_id')
        .single();

      if (profileErr) {
        console.error(`❌ Erreur création profil pour "${fullName}": ${profileErr.message}`);
        // Nettoyer l'utilisateur auth créé si le profil échoue
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        errorCount++;
      } else {
        console.log(`✅ "${fullName}" importé (Email: ${email}, JIRA: ${profile.jira_user_id}, Role: ${role})`);
        console.log(`   📧 Mot de passe temporaire: ${tempPassword}`);
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
  console.log(`⚠️  Note: Les mots de passe temporaires sont affichés ci-dessus.`);
  console.log(`   Les utilisateurs devront les changer lors de leur première connexion.\n`);
}

// Exécuter l'import
importUsers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Erreur fatale:', err);
    process.exit(1);
  });

