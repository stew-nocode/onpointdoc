/**
 * Script pour créer les profils manquants des rapporteurs
 * 
 * Ce script :
 * 1. Crée les profils manquants dans Supabase avec jira_user_id
 * 2. Met à jour les tickets restants avec created_by
 * 3. Génère un rapport des actions effectuées
 * 
 * Usage: node scripts/create-missing-reporters-profiles.js
 */

import dotenv from 'dotenv';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'node:fs';

// Charger .env.local en priorité si présent
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  dotenv.config({ path: envPath });
} catch {
  dotenv.config();
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Définition des profils à créer
 * 
 * IMPORTANT: Remplir ces informations depuis JIRA avant d'exécuter le script
 */
const PROFILES_TO_CREATE = [
  {
    jira_user_id: '712020:d4a5e54b-dc78-41d8-a397-cc5dbd0461f0',
    full_name: 'EVA BASSE', // Trouvé dans le Google Sheet
    email: 'ebasse@onpointafrica.om', // Email connu d'EVA BASSE (profil existant)
    role: 'agent', // Agent support (comme l'autre profil EVA BASSE)
    department_id: null, // Sera rempli automatiquement avec Support
    is_active: true,
    note: '⚠️  EVA BASSE existe déjà avec jira_user_id: 712020:d1487731-a3f9-4fd1-af7d-03ad9af2dc5e. Ce profil sera créé avec un nouveau jira_user_id ou le profil existant sera mis à jour.'
  },
  {
    jira_user_id: 'qm:f507503c-9014-4349-850e-b2659005bfbd:fc62df1a-ef74-43b4-9cdf-e9360887885c',
    full_name: 'JOEL SIE', // D'après l'email jsie@onpointafrica.coM
    email: 'jsie@onpointafrica.om', // Email déduit du nom trouvé
    role: 'agent', // À vérifier dans JIRA
    department_id: null, // Sera rempli automatiquement avec Support
    is_active: true
  }
];

/**
 * Récupère le département Support
 */
async function getSupportDepartment() {
  const { data: departments, error } = await supabase
    .from('departments')
    .select('id, name, code')
    .ilike('name', '%support%')
    .limit(1);

  if (error) {
    throw new Error(`Erreur lors de la récupération des départements: ${error.message}`);
  }

  if (!departments || departments.length === 0) {
    console.warn('⚠️  Aucun département "Support" trouvé');
    return null;
  }

  return departments[0];
}

/**
 * Vérifie si un profil existe déjà
 */
async function profileExists(jira_user_id) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('jira_user_id', jira_user_id)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Erreur lors de la vérification: ${error.message}`);
  }

  return data || null;
}

/**
 * Crée un profil
 */
async function createProfile(profileData) {
  // Vérifier si le profil existe déjà avec ce jira_user_id
  const existing = await profileExists(profileData.jira_user_id);
  if (existing) {
    return {
      success: false,
      reason: 'Profil existe déjà avec ce jira_user_id',
      profile: existing
    };
  }

  // Vérifier si un profil existe déjà avec le même email (pour éviter les doublons)
  const { data: existingByEmail, error: emailError } = await supabase
    .from('profiles')
    .select('id, full_name, email, jira_user_id')
    .eq('email', profileData.email)
    .single();

  if (!emailError && existingByEmail) {
    // Profil existe avec le même email mais jira_user_id différent
    // Mettre à jour le jira_user_id du profil existant
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ jira_user_id: profileData.jira_user_id })
      .eq('id', existingByEmail.id);

    if (updateError) {
      return {
        success: false,
        reason: `Erreur lors de la mise à jour du jira_user_id: ${updateError.message}`,
        profile: existingByEmail
      };
    }

    return {
      success: true,
      reason: 'Profil existant mis à jour avec nouveau jira_user_id',
      profile: { ...existingByEmail, jira_user_id: profileData.jira_user_id }
    };
  }

  // Vérifier que les champs requis sont remplis
  if (!profileData.full_name || !profileData.email) {
    return {
      success: false,
      reason: 'Champs requis manquants (full_name ou email)'
    };
  }

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      full_name: profileData.full_name,
      email: profileData.email,
      jira_user_id: profileData.jira_user_id,
      role: profileData.role,
      department_id: profileData.department_id,
      is_active: profileData.is_active,
      auth_uid: null // Pas de compte Auth pour les utilisateurs JIRA uniquement
    })
    .select('id, full_name, email, role, jira_user_id')
    .single();

  if (error) {
    return {
      success: false,
      reason: error.message
    };
  }

  return {
    success: true,
    profile: data
  };
}

/**
 * Met à jour les tickets avec le nouveau profil
 */
async function updateTicketsWithProfile(jira_user_id, profile_id) {
  // Récupérer tous les tickets avec ce rapporteur depuis jira_sync
  const { data: jiraSync, error: syncError } = await supabase
    .from('jira_sync')
    .select(`
      ticket_id,
      jira_issue_key,
      tickets!inner (
        id,
        title,
        created_by
      )
    `)
    .eq('jira_reporter_account_id', jira_user_id);

  if (syncError) {
    throw new Error(`Erreur lors de la récupération des tickets: ${syncError.message}`);
  }

  if (!jiraSync || jiraSync.length === 0) {
    return {
      updated: 0,
      skipped: 0,
      tickets: []
    };
  }

  const results = {
    updated: 0,
    skipped: 0,
    tickets: []
  };

  for (const entry of jiraSync) {
    const ticket = entry.tickets;
    
    if (!ticket) continue;

    // Vérifier si déjà correct
    if (ticket.created_by === profile_id) {
      results.skipped++;
      continue;
    }

    // Mettre à jour le ticket
    const { error: updateError } = await supabase
      .from('tickets')
      .update({ created_by: profile_id })
      .eq('id', ticket.id);

    if (updateError) {
      console.error(`⚠️  Erreur lors de la mise à jour de ${entry.jira_issue_key}:`, updateError.message);
      results.skipped++;
    } else {
      results.updated++;
      results.tickets.push({
        jira_issue_key: entry.jira_issue_key,
        ticket_id: ticket.id,
        title: ticket.title
      });
    }
  }

  return results;
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🔧 Création des profils manquants...\n');

  try {
    // Vérifier les profils à créer
    console.log('📋 Profils à créer:\n');
    for (let i = 0; i < PROFILES_TO_CREATE.length; i++) {
      const profile = PROFILES_TO_CREATE[i];
      console.log(`${i + 1}. JIRA ID: ${profile.jira_user_id}`);
      console.log(`   - Nom: ${profile.full_name || '❌ À remplir'}`);
      console.log(`   - Email: ${profile.email || '❌ À remplir'}`);
      console.log(`   - Rôle: ${profile.role}`);
      console.log(`   - Département: ${profile.department_id || '❌ À définir'}`);
      console.log('');
    }

    // Vérifier que tous les champs sont remplis
    const missingFields = PROFILES_TO_CREATE.some(p => !p.full_name || !p.email);
    if (missingFields) {
      console.error('❌ ERREUR: Certains champs sont manquants dans PROFILES_TO_CREATE');
      console.error('   Veuillez remplir full_name et email pour tous les profils avant d\'exécuter le script\n');
      process.exit(1);
    }

    // Récupérer le département Support si nécessaire
    let supportDept = null;
    if (PROFILES_TO_CREATE.some(p => !p.department_id)) {
      supportDept = await getSupportDepartment();
      if (supportDept) {
        console.log(`✅ Département Support trouvé: ${supportDept.name} (${supportDept.code}) - ID: ${supportDept.id}\n`);
        // Utiliser Support par défaut si non défini
        PROFILES_TO_CREATE.forEach(p => {
          if (!p.department_id) {
            p.department_id = supportDept.id;
          }
        });
      }
    }

    console.log('⚠️  ATTENTION: Ce script va créer des profils et modifier la base de données');
    console.log('Appuyez sur Ctrl+C pour annuler, ou attendez 5 secondes pour continuer...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));

    const results = {
      profilesCreated: [],
      profilesSkipped: [],
      ticketsUpdated: 0,
      ticketsSkipped: 0
    };

    // Créer chaque profil
    for (const profileData of PROFILES_TO_CREATE) {
      console.log(`\n📝 Création du profil pour ${profileData.jira_user_id}...`);
      
      const createResult = await createProfile(profileData);
      
      if (!createResult.success) {
        console.log(`   ⚠️  ${createResult.reason}`);
        if (createResult.profile) {
          results.profilesSkipped.push({
            jira_user_id: profileData.jira_user_id,
            reason: createResult.reason,
            existing_profile: createResult.profile
          });
          
          // Utiliser le profil existant pour mettre à jour les tickets
          console.log(`   ✅ Profil existant trouvé: ${createResult.profile.full_name} (${createResult.profile.id})`);
          const updateResult = await updateTicketsWithProfile(profileData.jira_user_id, createResult.profile.id);
          results.ticketsUpdated += updateResult.updated;
          results.ticketsSkipped += updateResult.skipped;
        }
        continue;
      }

      console.log(`   ✅ Profil créé: ${createResult.profile.full_name} (${createResult.profile.id})`);
      results.profilesCreated.push(createResult.profile);

      // Mettre à jour les tickets
      console.log(`   🔄 Mise à jour des tickets...`);
      const updateResult = await updateTicketsWithProfile(profileData.jira_user_id, createResult.profile.id);
      console.log(`   ✅ ${updateResult.updated} tickets mis à jour, ${updateResult.skipped} ignorés`);
      results.ticketsUpdated += updateResult.updated;
      results.ticketsSkipped += updateResult.skipped;
    }

    // Afficher le rapport final
    console.log('\n' + '═'.repeat(80));
    console.log('📊 RAPPORT FINAL');
    console.log('═'.repeat(80));
    console.log('');
    console.log(`✅ Profils créés: ${results.profilesCreated.length}`);
    console.log(`⏭️  Profils ignorés (existaient déjà): ${results.profilesSkipped.length}`);
    console.log(`✅ Tickets mis à jour: ${results.ticketsUpdated}`);
    console.log(`⏭️  Tickets ignorés: ${results.ticketsSkipped}`);
    console.log('');

    if (results.profilesCreated.length > 0) {
      console.log('📋 Profils créés:');
      results.profilesCreated.forEach(profile => {
        console.log(`   - ${profile.full_name} (${profile.email})`);
        console.log(`     ID: ${profile.id}`);
        console.log(`     JIRA ID: ${profile.jira_user_id}`);
        console.log('');
      });
    }

    // Sauvegarder le rapport
    const reportPath = path.resolve(process.cwd(), 'docs/analysis/rapport-creation-profils.json');
    writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf-8');
    console.log(`💾 Rapport sauvegardé dans: ${reportPath}\n`);

  } catch (error) {
    console.error('❌ Erreur fatale:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Exécuter le script
main()
  .then(() => {
    console.log('✅ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });

