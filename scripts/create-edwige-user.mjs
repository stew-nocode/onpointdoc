/* eslint-disable no-console */
/**
 * Script pour créer un accès pour Edwige Kouassi
 * 
 * Prérequis:
 * - Variables d'env: SUPABASE_SERVICE_ROLE, NEXT_PUBLIC_SUPABASE_URL
 * 
 * Exécution:
 *   node scripts/create-edwige-user.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
// Essayer les deux noms de variables possibles
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE/SUPABASE_SERVICE_ROLE_KEY manquants dans les variables d\'environnement.');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

// Configuration de l'utilisateur Edwige Kouassi
const EDWIGE_USER = {
  email: 'edwige.kouassi@onpointafrica.com',
  password: 'Edwige2025!',
  fullName: 'Edwige KOUASSI',
  role: 'agent',
  department: 'Support'
};

async function main() {
  console.log('🚀 CRÉATION D\'UN ACCÈS POUR EDWIGE KOUASSI\n');
  
  try {
    // Vérifier si un profil existe déjà
    const { data: existingProfile } = await admin
      .from('profiles')
      .select('id, email, full_name, role, auth_uid')
      .or(`email.ilike.%${EDWIGE_USER.email}%,full_name.ilike.%edwige%kouassi%`)
      .limit(1)
      .maybeSingle();

    let authUid = null;
    
    if (existingProfile?.auth_uid) {
      // Vérifier si l'utilisateur auth existe
      try {
        const { data: authUser } = await admin.auth.admin.getUserById(existingProfile.auth_uid);
        if (authUser?.user) {
          console.log('✅ Utilisateur existe déjà !');
          console.log(`   Email actuel: ${authUser.user.email}`);
          
          // Réinitialiser le mot de passe
          console.log('\n🔐 Réinitialisation du mot de passe...');
          const { error: updateError } = await admin.auth.admin.updateUserById(
            existingProfile.auth_uid,
            { password: EDWIGE_USER.password }
          );
          
          if (updateError) {
            console.error('❌ Erreur lors de la réinitialisation:', updateError.message);
          } else {
            console.log('✅ Mot de passe réinitialisé');
            
            // Mettre à jour le profil pour s'assurer que le rôle est "agent"
            console.log('👤 Mise à jour du profil (rôle: agent)...');
            const { error: profileError } = await admin
              .from('profiles')
              .update({
                role: EDWIGE_USER.role,
                department: EDWIGE_USER.department,
                is_active: true
              })
              .eq('id', existingProfile.id);
            
            if (profileError) {
              console.warn('⚠️  Erreur lors de la mise à jour du profil:', profileError.message);
            } else {
              console.log('✅ Profil mis à jour\n');
            }
            
            console.log('═══════════════════════════════════════');
            console.log('📝 INFORMATIONS DE CONNEXION:');
            console.log('═══════════════════════════════════════');
            console.log(`   Email: ${authUser.user.email}`);
            console.log(`   Mot de passe: ${EDWIGE_USER.password}`);
            console.log(`   Rôle: ${EDWIGE_USER.role}`);
            console.log('═══════════════════════════════════════\n');
            return;
          }
        }
      } catch (error) {
        console.log('⚠️  Utilisateur Auth introuvable, création nécessaire...\n');
      }
      authUid = existingProfile.auth_uid;
    }
    
    // Créer l'utilisateur Auth si nécessaire
    if (!authUid) {
      console.log('🔐 Création du compte d\'authentification...');
      const { data, error } = await admin.auth.admin.createUser({
        email: EDWIGE_USER.email,
        password: EDWIGE_USER.password,
        email_confirm: true
      });
      
      if (error) {
        if (error.message?.toLowerCase().includes('already registered') || error.message?.toLowerCase().includes('already exists')) {
          console.log('⚠️  Utilisateur Auth existe déjà, récupération...');
          const { data: usersList } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
          const found = usersList?.users?.find((u) => u.email?.toLowerCase() === EDWIGE_USER.email.toLowerCase());
          if (found) {
            authUid = found.id;
          } else {
            throw new Error('Utilisateur Auth existe mais introuvable');
          }
        } else {
          throw error;
        }
      } else if (data?.user) {
        authUid = data.user.id;
        console.log('✅ Utilisateur Auth créé');
      }
    }
    
    // Créer/Mettre à jour le profil
    console.log('👤 Création/Mise à jour du profil...');
    const { data: profile, error: profileError } = await admin
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
      
    if (profileError) {
      throw profileError;
    }
    
    console.log('✅ Profil créé/mis à jour\n');
    
    console.log('✅ UTILISATEUR CRÉÉ AVEC SUCCÈS !\n');
    console.log('═══════════════════════════════════════');
    console.log('📝 INFORMATIONS DE CONNEXION:');
    console.log('═══════════════════════════════════════');
    console.log(`   Email: ${EDWIGE_USER.email}`);
    console.log(`   Mot de passe: ${EDWIGE_USER.password}`);
    console.log(`   Rôle: ${EDWIGE_USER.role}`);
    console.log('═══════════════════════════════════════\n');
    console.log('🔐 IMPORTANT: Changez le mot de passe après la première connexion !');
    
  } catch (error) {
    console.error('\n❌ Erreur:', error.message || error);
    process.exit(1);
  }
}

main();

