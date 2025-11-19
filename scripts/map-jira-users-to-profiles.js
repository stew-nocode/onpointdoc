import dotenv from 'dotenv';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// Charger .env.local en priorité si présent
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  dotenv.config({ path: envPath });
} catch {
  // Si .env.local n'existe pas, essayer .env
  dotenv.config();
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const jiraUrl = process.env.JIRA_URL || process.env.JIRA_BASE_URL;
const jiraEmail = process.env.JIRA_USERNAME || process.env.JIRA_EMAIL || process.env.JIRA_API_EMAIL;
const jiraToken = process.env.JIRA_TOKEN || process.env.JIRA_API_TOKEN;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables Supabase manquantes');
  process.exit(1);
}

if (!jiraUrl || !jiraEmail || !jiraToken) {
  console.error('❌ Variables Jira manquantes:');
  if (!jiraUrl) console.error('   - JIRA_URL ou JIRA_BASE_URL');
  if (!jiraEmail) console.error('   - JIRA_USERNAME, JIRA_EMAIL ou JIRA_API_EMAIL');
  if (!jiraToken) console.error('   - JIRA_TOKEN ou JIRA_API_TOKEN');
  console.error('\nVérifiez que ces variables sont définies dans .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Nettoyer les variables d'environnement
const cleanEnvVar = (value) => {
  if (!value) return null;
  return value.toString().trim().replace(/^["']|["']$/g, '');
};

const cleanJiraUrl = cleanEnvVar(jiraUrl).replace(/\/$/, '');
const cleanJiraEmail = cleanEnvVar(jiraEmail);
const cleanJiraToken = cleanEnvVar(jiraToken);

/**
 * Récupère les informations d'un utilisateur Jira par son accountId
 */
async function getJiraUserInfo(accountId) {
  try {
    const response = await fetch(
      `${cleanJiraUrl}/rest/api/3/user?accountId=${encodeURIComponent(accountId)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${cleanJiraEmail}:${cleanJiraToken}`).toString('base64')}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`⚠️  Utilisateur Jira non trouvé: ${accountId}`);
        return null;
      }
      throw new Error(`Erreur HTTP ${response.status}: ${await response.text()}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`❌ Erreur lors de la récupération de l'utilisateur Jira ${accountId}:`, error.message);
    return null;
  }
}

/**
 * Trouve ou crée un profil pour un utilisateur Jira
 */
async function findOrCreateProfile(jiraUser) {
  const { accountId, displayName, emailAddress } = jiraUser;

  // 1. Chercher un profil existant avec ce jira_user_id
  const { data: existingByJiraId, error: error1 } = await supabase
    .from('profiles')
    .select('id, full_name, email, jira_user_id')
    .eq('jira_user_id', accountId)
    .maybeSingle();

  if (error1) {
    console.error(`❌ Erreur lors de la recherche par jira_user_id:`, error1);
  }

  if (existingByJiraId) {
    console.log(`✅ Profil existant trouvé par jira_user_id: ${existingByJiraId.full_name} (${existingByJiraId.id})`);
    return existingByJiraId.id;
  }

  // 2. Chercher par email si disponible
  if (emailAddress) {
    const { data: existingByEmail, error: error2 } = await supabase
      .from('profiles')
      .select('id, full_name, email, jira_user_id')
      .eq('email', emailAddress.toLowerCase())
      .maybeSingle();

    if (error2) {
      console.error(`❌ Erreur lors de la recherche par email:`, error2);
    }

    if (existingByEmail) {
      // Mettre à jour le profil existant avec jira_user_id
      const { data: updated, error: updateError } = await supabase
        .from('profiles')
        .update({ jira_user_id: accountId })
        .eq('id', existingByEmail.id)
        .select('id')
        .single();

      if (updateError) {
        console.error(`❌ Erreur lors de la mise à jour du profil:`, updateError);
        return null;
      }

      console.log(`✅ Profil mis à jour avec jira_user_id: ${existingByEmail.full_name} (${updated.id})`);
      return updated.id;
    }
  }

  // 3. Chercher par nom (approximatif)
  if (displayName) {
    const { data: existingByName, error: error3 } = await supabase
      .from('profiles')
      .select('id, full_name, email, jira_user_id')
      .ilike('full_name', `%${displayName}%`)
      .is('jira_user_id', null)
      .limit(5);

    if (error3) {
      console.error(`❌ Erreur lors de la recherche par nom:`, error3);
    }

    if (existingByName && existingByName.length === 1) {
      // Un seul match trouvé, on peut l'utiliser
      const { data: updated, error: updateError } = await supabase
        .from('profiles')
        .update({ jira_user_id: accountId })
        .eq('id', existingByName[0].id)
        .select('id')
        .single();

      if (updateError) {
        console.error(`❌ Erreur lors de la mise à jour du profil:`, updateError);
        return null;
      }

      console.log(`✅ Profil mis à jour avec jira_user_id (match par nom): ${existingByName[0].full_name} (${updated.id})`);
      return updated.id;
    }
  }

  // 4. Créer un nouveau profil (sans auth_uid, juste pour le mapping)
  const { data: newProfile, error: createError } = await supabase
    .from('profiles')
    .insert({
      full_name: displayName || `Jira User ${accountId.substring(0, 8)}`,
      email: emailAddress || null,
      jira_user_id: accountId,
      role: 'agent' // Rôle par défaut, à ajuster manuellement si nécessaire
    })
    .select('id')
    .single();

  if (createError) {
    console.error(`❌ Erreur lors de la création du profil:`, createError);
    return null;
  }

  console.log(`✅ Nouveau profil créé: ${displayName || 'Sans nom'} (${newProfile.id})`);
  return newProfile.id;
}

/**
 * Met à jour les tickets avec assigned_to basé sur jira_assignee_account_id
 */
async function updateTicketsWithAssignees() {
  console.log('\n📊 Récupération des assignés uniques depuis jira_sync...\n');

  // Récupérer tous les assignés uniques
  // Utiliser une requête avec toutes les données et extraire les uniques côté client
  const { data: allAssignees, error } = await supabase
    .from('jira_sync')
    .select('jira_assignee_account_id')
    .not('jira_assignee_account_id', 'is', null);
  
  if (error) {
    console.error('❌ Erreur lors de la récupération des assignés:', error);
    return;
  }
  
  // Extraire les valeurs uniques manuellement
  const uniqueSet = new Set(allAssignees.map(a => a.jira_assignee_account_id).filter(Boolean));
  const uniqueAssignees = Array.from(uniqueSet);
  
  console.log(`📋 ${uniqueAssignees.length} assignés uniques trouvés\n`);

  const mapping = new Map(); // accountId -> profileId

  // Pour chaque assigné unique, récupérer les infos Jira et créer/mapper le profil
  for (let i = 0; i < uniqueAssignees.length; i++) {
    const accountId = uniqueAssignees[i];
    console.log(`\n[${i + 1}/${uniqueAssignees.length}] Traitement de ${accountId}...`);

    const jiraUser = await getJiraUserInfo(accountId);
    if (!jiraUser) {
      console.log(`⚠️  Impossible de récupérer les infos Jira, passage au suivant`);
      continue;
    }

    console.log(`   📧 Email: ${jiraUser.emailAddress || 'N/A'}`);
    console.log(`   👤 Nom: ${jiraUser.displayName || 'N/A'}`);

    const profileId = await findOrCreateProfile(jiraUser);
    if (profileId) {
      mapping.set(accountId, profileId);
      console.log(`   ✅ Mappé vers profile: ${profileId}`);
    } else {
      console.log(`   ❌ Impossible de créer/trouver le profil`);
    }

    // Pause pour éviter le rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n\n📝 Mise à jour des tickets avec assigned_to...\n`);

  // Mettre à jour les tickets
  let updatedCount = 0;
  let errorCount = 0;

  for (const [accountId, profileId] of mapping.entries()) {
    // Récupérer tous les tickets avec cet assigné
    const { data: tickets, error: ticketsError } = await supabase
      .from('jira_sync')
      .select('ticket_id')
      .eq('jira_assignee_account_id', accountId);

    if (ticketsError) {
      console.error(`❌ Erreur lors de la récupération des tickets pour ${accountId}:`, ticketsError);
      errorCount++;
      continue;
    }

    if (!tickets || tickets.length === 0) {
      continue;
    }

    const ticketIds = tickets.map(t => t.ticket_id).filter(Boolean);

    if (ticketIds.length === 0) {
      continue;
    }

    // Mettre à jour les tickets par lots de 100 pour éviter les erreurs "Bad Request"
    const BATCH_SIZE = 100;
    let batchUpdated = 0;
    
    for (let i = 0; i < ticketIds.length; i += BATCH_SIZE) {
      const batch = ticketIds.slice(i, i + BATCH_SIZE);
      
      const { error: updateError } = await supabase
        .from('tickets')
        .update({ assigned_to: profileId })
        .in('id', batch)
        .is('assigned_to', null); // Seulement mettre à jour si assigned_to est null

      if (updateError) {
        console.error(`❌ Erreur lors de la mise à jour du lot ${Math.floor(i / BATCH_SIZE) + 1} pour ${accountId}:`, updateError);
        errorCount++;
      } else {
        batchUpdated += batch.length;
      }
    }

    if (batchUpdated > 0) {
      updatedCount += batchUpdated;
      console.log(`✅ ${batchUpdated} tickets mis à jour pour ${accountId}`);
    }
  }

  console.log(`\n\n📊 Résumé:`);
  console.log(`   ✅ ${updatedCount} tickets mis à jour`);
  console.log(`   ❌ ${errorCount} erreurs`);
  console.log(`   👥 ${mapping.size} utilisateurs mappés`);
}

// Exécution
updateTicketsWithAssignees()
  .then(() => {
    console.log('\n✅ Terminé !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });

