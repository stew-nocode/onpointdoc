/* eslint-disable no-console */
/**
 * Script pour créer un accès pour Edwige Kouassi
 * 
 * Prérequis:
 * - Variables d'env: SUPABASE_SERVICE_ROLE, NEXT_PUBLIC_SUPABASE_URL
 * 
 * Exécution:
 *   npx ts-node scripts/create-edwige-user.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE ?? '';

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE manquants dans les variables d\'environnement.');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

// Configuration de l'utilisateur Edwige Kouassi
const EDWIGE_USER = {
  email: 'edwige.kouassi@onpointafrica.com',
  password: 'Edwige2025!', // Mot de passe pour test
  fullName: 'Edwige KOUASSI',
  role: 'agent' as const, // Rôle agent pour tester la vue personnalisée
  department: 'Support' as const
};

async function checkExistingUser() {
  // Vérifier si un profil existe déjà
  const { data: existingProfile } = await admin
    .from('profiles')
    .select('id, email, full_name, role, auth_uid')
    .or(`email.ilike.%${EDWIGE_USER.email}%,full_name.ilike.%edwige%kouassi%`)
    .limit(1)
    .maybeSingle();

  if (existingProfile) {
    console.log('✅ Profil existant trouvé:');
    console.log(`   ID: ${existingProfile.id}`);
    console.log(`   Email: ${existingProfile.email}`);
    console.log(`   Nom: ${existingProfile.full_name}`);
    console.log(`   Rôle: ${existingProfile.role}`);
    console.log(`   Auth UID: ${existingProfile.auth_uid}`);
    
    // Vérifier si l'utilisateur auth existe
    if (existingProfile.auth_uid) {
      try {
        const { data: authUser } = await admin.auth.admin.getUserById(existingProfile.auth_uid);
        if (authUser?.user) {
          console.log('\n✅ Compte d\'authentification existe déjà');
          console.log(`   Email Auth: ${authUser.user.email}`);
          console.log('\n📝 Informations de connexion:');
          console.log(`   Email: ${authUser.user.email || EDWIGE_USER.email}`);
          console.log(`   Mot de passe: (utilisez le mot de passe existant ou réinitialisez-le)`);
          return { profileId: existingProfile.id, authUid: existingProfile.auth_uid, exists: true };
        }
      } catch (error) {
        console.log('⚠️  Utilisateur Auth introuvable, création nécessaire');
      }
    }
    
    return { profileId: existingProfile.id, authUid: existingProfile.auth_uid, exists: true };
  }
  
  return { exists: false };
}

async function createAuthUser() {
  console.log('\n🔐 Création du compte d\'authentification...');
  
  const { data, error } = await admin.auth.admin.createUser({
    email: EDWIGE_USER.email,
    password: EDWIGE_USER.password,
    email_confirm: true
  });
  
  if (error) {
    // Si l'utilisateur existe déjà, essayer de le récupérer
    if (error.message?.toLowerCase().includes('already registered') || error.message?.toLowerCase().includes('already exists')) {
      console.log('⚠️  Utilisateur Auth existe déjà, récupération...');
      const { data: usersList } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const found = usersList?.users?.find((u) => u.email?.toLowerCase() === EDWIGE_USER.email.toLowerCase());
      if (found) {
        console.log(`✅ Utilisateur Auth trouvé: ${found.id}`);
        return found.id;
      }
    }
    throw error;
  }
  
  if (data?.user) {
    console.log(`✅ Utilisateur Auth créé: ${data.user.id}`);
    return data.user.id;
  }
  
  throw new Error('Impossible de créer l\'utilisateur Auth');
}

async function createOrUpdateProfile(authUid: string) {
  console.log('\n👤 Création/Mise à jour du profil...');
  
  const { data, error } = await admin
    .from('profiles')
    .upsert(
      {
        auth_uid: authUid,
        email: EDWIGE_USER.email,
        full_name: EDWIGE_USER.fullName,
        role: EDWIGE_USER.role,
        department: EDWIGE_USER.department,
        is_active: true
      },
      { onConflict: 'auth_uid' }
    )
    .select('id')
    .single();
    
  if (error) {
    throw error;
  }
  
  console.log(`✅ Profil créé/mis à jour: ${data.id}`);
  return data.id as string;
}

async function main() {
  console.log('🚀 CRÉATION D\'UN ACCÈS POUR EDWIGE KOUASSI\n');
  console.log('Configuration:');
  console.log(`   Email: ${EDWIGE_USER.email}`);
  console.log(`   Nom: ${EDWIGE_USER.fullName}`);
  console.log(`   Rôle: ${EDWIGE_USER.role}`);
  console.log(`   Département: ${EDWIGE_USER.department}\n`);
  
  try {
    // Vérifier si l'utilisateur existe déjà
    const existing = await checkExistingUser();
    
    if (existing.exists && existing.authUid) {
      console.log('\n✅ Utilisateur existe déjà !');
      console.log('\n📝 Informations de connexion:');
      console.log(`   Email: ${EDWIGE_USER.email}`);
      console.log(`   Mot de passe: (utilisez le mot de passe existant)`);
      console.log('\n💡 Pour réinitialiser le mot de passe, utilisez la fonctionnalité "Mot de passe oublié"');
      return;
    }
    
    // Créer l'utilisateur Auth
    const authUid = existing.authUid || await createAuthUser();
    
    // Créer/Mettre à jour le profil
    const profileId = await createOrUpdateProfile(authUid);
    
    console.log('\n✅ UTILISATEUR CRÉÉ AVEC SUCCÈS !\n');
    console.log('📝 Informations de connexion:');
    console.log(`   Email: ${EDWIGE_USER.email}`);
    console.log(`   Mot de passe: ${EDWIGE_USER.password}`);
    console.log(`   Rôle: ${EDWIGE_USER.role}`);
    console.log(`   Profile ID: ${profileId}`);
    console.log(`   Auth UID: ${authUid}\n`);
    console.log('🔐 IMPORTANT: Changez le mot de passe après la première connexion !');
    
  } catch (error) {
    console.error('\n❌ Erreur lors de la création:', error);
    if (error instanceof Error) {
      console.error(`   Message: ${error.message}`);
    }
    process.exit(1);
  }
}

main();

