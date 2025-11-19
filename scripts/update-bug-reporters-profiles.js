/**
 * Script pour mettre à jour les profils des rapporteurs BUG
 * 
 * Met à jour :
 * - Vivien DAKPOGAN : Manager support de OBC
 * - GNAHORE AMOS : Agent support
 * - EVA BASSE : Agent support
 * 
 * Usage: node scripts/update-bug-reporters-profiles.js
 */

import dotenv from 'dotenv';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

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

async function updateProfiles() {
  console.log('🔧 Mise à jour des profils des rapporteurs BUG...\n');

  try {
    // 1. Récupérer le département Support
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('id, name, code')
      .ilike('name', '%support%')
      .limit(1);

    if (deptError) {
      throw new Error(`Erreur lors de la récupération des départements: ${deptError.message}`);
    }

    if (!departments || departments.length === 0) {
      console.error('❌ Aucun département "Support" trouvé dans la base');
      console.error('   Veuillez créer le département Support d\'abord');
      process.exit(1);
    }

    const supportDept = departments[0];
    console.log(`✅ Département trouvé: ${supportDept.name} (${supportDept.code}) - ID: ${supportDept.id}\n`);

    // 2. Mettre à jour Vivien DAKPOGAN (Manager support)
    const vivienJiraId = '712020:5c9548c8-e063-4cc7-b9e3-98eb370e0d9e';
    console.log('📝 Mise à jour de Vivien DAKPOGAN...');
    
    const { data: vivienProfile, error: vivienFindError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, department_id, jira_user_id')
      .eq('jira_user_id', vivienJiraId)
      .single();

    if (vivienFindError || !vivienProfile) {
      console.error(`❌ Profil de Vivien DAKPOGAN non trouvé (jira_user_id: ${vivienJiraId})`);
    } else {
      const { error: vivienUpdateError } = await supabase
        .from('profiles')
        .update({
          role: 'manager',
          department_id: supportDept.id
        })
        .eq('id', vivienProfile.id);

      if (vivienUpdateError) {
        console.error(`❌ Erreur lors de la mise à jour: ${vivienUpdateError.message}`);
      } else {
        console.log(`✅ Vivien DAKPOGAN mis à jour:`);
        console.log(`   - Rôle: client → manager`);
        console.log(`   - Département: ${supportDept.name} (ID: ${supportDept.id})`);
        console.log(`   - Profil ID: ${vivienProfile.id}`);
      }
    }

    console.log('');

    // 3. Mettre à jour EVA BASSE (Agent support)
    const evaJiraId = '712020:d1487731-a3f9-4fd1-af7d-03ad9af2dc5e';
    console.log('📝 Mise à jour de EVA BASSE...');
    
    const { data: evaProfile, error: evaFindError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, department_id, jira_user_id')
      .eq('jira_user_id', evaJiraId)
      .single();

    if (evaFindError || !evaProfile) {
      console.error(`❌ Profil de EVA BASSE non trouvé (jira_user_id: ${evaJiraId})`);
    } else {
      const { error: evaUpdateError } = await supabase
        .from('profiles')
        .update({
          role: 'agent',
          department_id: supportDept.id
        })
        .eq('id', evaProfile.id);

      if (evaUpdateError) {
        console.error(`❌ Erreur lors de la mise à jour: ${evaUpdateError.message}`);
      } else {
        console.log(`✅ EVA BASSE mis à jour:`);
        console.log(`   - Rôle: client → agent`);
        console.log(`   - Département: ${supportDept.name} (ID: ${supportDept.id})`);
        console.log(`   - Profil ID: ${evaProfile.id}`);
      }
    }

    console.log('');

    // 4. Mettre à jour GNAHORE AMOS (Agent support)
    const amosJiraId = '712020:bb02e93b-c270-4c40-a166-a19a42e5629a';
    console.log('📝 Mise à jour de GNAHORE AMOS...');
    
    const { data: amosProfile, error: amosFindError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, department_id, jira_user_id')
      .eq('jira_user_id', amosJiraId)
      .single();

    if (amosFindError || !amosProfile) {
      console.error(`❌ Profil de GNAHORE AMOS non trouvé (jira_user_id: ${amosJiraId})`);
    } else {
      const { error: amosUpdateError } = await supabase
        .from('profiles')
        .update({
          role: 'agent',
          department_id: supportDept.id
        })
        .eq('id', amosProfile.id);

      if (amosUpdateError) {
        console.error(`❌ Erreur lors de la mise à jour: ${amosUpdateError.message}`);
      } else {
        console.log(`✅ GNAHORE AMOS mis à jour:`);
        console.log(`   - Rôle: client → agent`);
        console.log(`   - Département: ${supportDept.name} (ID: ${supportDept.id})`);
        console.log(`   - Profil ID: ${amosProfile.id}`);
      }
    }

    console.log('\n' + '═'.repeat(80));
    console.log('\n✅ Mise à jour terminée\n');

    // 5. Vérification finale
    console.log('🔍 Vérification des mises à jour...\n');
    
    const { data: updatedProfiles, error: verifyError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, department_id, jira_user_id, departments(name)')
      .in('jira_user_id', [vivienJiraId, amosJiraId, evaJiraId]);

    if (verifyError) {
      console.warn(`⚠️  Erreur lors de la vérification: ${verifyError.message}`);
    } else {
      updatedProfiles?.forEach(profile => {
        console.log(`✅ ${profile.full_name || 'N/A'}:`);
        console.log(`   - Rôle: ${profile.role}`);
        console.log(`   - Département: ${profile.departments?.name || 'N/A'}`);
        console.log(`   - Email: ${profile.email || 'N/A'}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Exécuter le script
updateProfiles()
  .then(() => {
    console.log('✅ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });

