/* eslint-disable no-console */
/**
 * Script pour créer un utilisateur Marketing avec 5 tâches et 5 activités
 * Utilise les nouveaux champs de durée (estimated_duration_hours, actual_duration_hours)
 * 
 * Prérequis:
 * - Variables d'env: SUPABASE_SERVICE_ROLE, NEXT_PUBLIC_SUPABASE_URL
 * 
 * Exécution:
 *   node scripts/seed-marketing-user.js
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE ?? '';

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE manquants dans les variables d\'environnement.');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

// ID du département Marketing
const MARKETING_DEPARTMENT_ID = '49922b70-f462-4db8-9090-8af9ce41aea2';

const USER_DATA = {
  email: 'marketing.demo@onpointdoc.com',
  password: 'Marketing2025!',
  fullName: 'Sophie Marketing',
  role: 'agent',
  department: MARKETING_DEPARTMENT_ID
};

async function ensureAuthUser(email, password) {
  try {
    // Essayer de créer l'utilisateur
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });
    
    if (data?.user) {
      console.log(`  ✅ Utilisateur Auth créé: ${data.user.id}`);
      return data.user.id;
    }
    
    // Si erreur et utilisateur existe déjà, le récupérer
    if (error) {
      const { data: usersList } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const found = usersList?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      if (found) {
        console.log(`  ✅ Utilisateur Auth trouvé: ${found.id}`);
        return found.id;
      }
      throw error;
    }
  } catch (error) {
    console.error('  ❌ Erreur lors de la création de l\'utilisateur Auth:', error.message);
    throw error;
  }
}

async function ensureProfile(authUid) {
  const { data, error } = await admin
    .from('profiles')
    .upsert(
      {
        auth_uid: authUid,
        email: USER_DATA.email,
        full_name: USER_DATA.fullName,
        role: USER_DATA.role,
        department: USER_DATA.department,
        is_active: true
      },
      { onConflict: 'auth_uid' }
    )
    .select('id')
    .single();
    
  if (error) throw error;
  console.log(`  ✅ Profil créé/mis à jour: ${data.id}`);
  return data.id;
}

async function createTasks(profileId) {
  const today = new Date();
  const tasks = [
    {
      title: 'Analyser les performances des campagnes email',
      description: 'Analyser les taux d\'ouverture et de clics des dernières campagnes',
      start_date: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      estimated_duration_hours: 3.5,
      actual_duration_hours: null,
      assigned_to: profileId,
      status: 'A_faire',
      is_planned: true,
      created_by: profileId
    },
    {
      title: 'Préparer le rapport mensuel marketing',
      description: 'Compiler les statistiques et créer le rapport pour la direction',
      start_date: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      estimated_duration_hours: 4,
      actual_duration_hours: null,
      assigned_to: profileId,
      status: 'A_faire',
      is_planned: true,
      created_by: profileId
    },
    {
      title: 'Organiser la campagne de lancement produit',
      description: 'Planifier et coordonner les actions marketing pour le nouveau produit',
      start_date: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      estimated_duration_hours: 8,
      actual_duration_hours: null,
      assigned_to: profileId,
      status: 'A_faire',
      is_planned: true,
      created_by: profileId
    },
    {
      title: 'Mettre à jour le site web avec les nouveaux contenus',
      description: 'Intégrer les nouveaux textes et visuels sur le site',
      start_date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      estimated_duration_hours: 6,
      actual_duration_hours: 7.5,
      assigned_to: profileId,
      status: 'Termine',
      is_planned: true,
      created_by: profileId
    },
    {
      title: 'Créer les visuels pour les réseaux sociaux',
      description: 'Designer les visuels pour les posts de la semaine',
      start_date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      estimated_duration_hours: 2,
      actual_duration_hours: 2.5,
      assigned_to: profileId,
      status: 'Termine',
      is_planned: true,
      created_by: profileId
    }
  ];

  const { data, error } = await admin
    .from('tasks')
    .insert(tasks)
    .select('id, title');
    
  if (error) throw error;
  console.log(`  ✅ ${data.length} tâches créées`);
  data.forEach((task) => console.log(`     - ${task.title}`));
  return data;
}

async function createActivities(profileId) {
  const today = new Date();
  
  const plannedStart1 = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
  plannedStart1.setHours(10, 0, 0, 0);
  const plannedEnd1 = new Date(plannedStart1);
  plannedEnd1.setHours(12, 0, 0, 0);
  
  const plannedStart2 = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  plannedStart2.setHours(14, 0, 0, 0);
  const plannedEnd2 = new Date(plannedStart2);
  plannedEnd2.setHours(17, 0, 0, 0);
  
  const plannedStart3 = new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000);
  plannedStart3.setHours(9, 0, 0, 0);
  const plannedEnd3 = new Date(plannedStart3);
  plannedEnd3.setHours(11, 30, 0, 0);
  
  const plannedStart4 = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
  plannedStart4.setHours(13, 0, 0, 0);
  const plannedEnd4 = new Date(plannedStart4);
  plannedEnd4.setHours(15, 30, 0, 0);
  
  const plannedStart5 = new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000);
  plannedStart5.setHours(10, 0, 0, 0);
  const plannedEnd5 = new Date(plannedStart5);
  plannedEnd5.setHours(12, 0, 0, 0);

  const activities = [
    {
      title: 'Réunion de revue stratégique marketing',
      activity_type: 'Revue',
      planned_start: plannedStart1.toISOString(),
      planned_end: plannedEnd1.toISOString(),
      estimated_duration_hours: 2,
      actual_duration_hours: null,
      status: 'Planifie',
      created_by: profileId
    },
    {
      title: 'Atelier de brainstorming nouveaux produits',
      activity_type: 'Atelier',
      planned_start: plannedStart2.toISOString(),
      planned_end: plannedEnd2.toISOString(),
      estimated_duration_hours: 3,
      actual_duration_hours: null,
      status: 'Planifie',
      created_by: profileId
    },
    {
      title: 'Présentation des résultats trimestriels',
      activity_type: 'Presentation',
      planned_start: plannedStart3.toISOString(),
      planned_end: plannedEnd3.toISOString(),
      estimated_duration_hours: 2.5,
      actual_duration_hours: null,
      status: 'Planifie',
      created_by: profileId
    },
    {
      title: 'Démo produit pour les clients',
      activity_type: 'Demo',
      planned_start: plannedStart4.toISOString(),
      planned_end: plannedEnd4.toISOString(),
      estimated_duration_hours: 2.5,
      actual_duration_hours: 3,
      status: 'Termine',
      created_by: profileId
    },
    {
      title: 'Revue de process campagne email',
      activity_type: 'Revue',
      planned_start: plannedStart5.toISOString(),
      planned_end: plannedEnd5.toISOString(),
      estimated_duration_hours: 2,
      actual_duration_hours: 1.75,
      status: 'Termine',
      created_by: profileId
    }
  ];

  const { data, error } = await admin
    .from('activities')
    .insert(activities)
    .select('id, title');
    
  if (error) throw error;
  console.log(`  ✅ ${data.length} activités créées`);
  data.forEach((activity) => console.log(`     - ${activity.title}`));
  
  // Ajouter l'utilisateur comme participant à toutes les activités
  const participants = data.map((activity) => ({
    activity_id: activity.id,
    user_id: profileId,
    role: 'internal',
    is_invited_external: false
  }));
  
  const { error: participantsError } = await admin
    .from('activity_participants')
    .insert(participants);
    
  if (participantsError) {
    console.warn('  ⚠️  Erreur lors de l\'ajout des participants:', participantsError.message);
  } else {
    console.log(`  ✅ Participants ajoutés aux activités`);
  }
  
  return data;
}

async function main() {
  console.log('\n🚀 Création de l\'utilisateur Marketing avec tâches et activités\n');
  
  try {
    console.log('📧 Création de l\'utilisateur Auth...');
    const authUid = await ensureAuthUser(USER_DATA.email, USER_DATA.password);
    
    console.log('\n👤 Création du profil...');
    const profileId = await ensureProfile(authUid);
    
    console.log('\n📋 Création des tâches...');
    await createTasks(profileId);
    
    console.log('\n📅 Création des activités...');
    await createActivities(profileId);
    
    console.log('\n✅ Terminé avec succès!\n');
    console.log(`📧 Email: ${USER_DATA.email}`);
    console.log(`🔑 Mot de passe: ${USER_DATA.password}`);
    console.log(`👤 Profil ID: ${profileId}`);
    console.log('\n💡 Vous pouvez maintenant vous connecter avec ces identifiants.\n');
    
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    process.exit(1);
  }
}

main();



