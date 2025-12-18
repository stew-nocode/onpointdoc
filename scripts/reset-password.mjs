/**
 * Script pour réinitialiser le mot de passe d'un utilisateur
 * Exécution: node scripts/reset-password.mjs
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { 
  auth: { persistSession: false } 
});

const EMAIL = 'admin1@example.com';
const NEW_PASSWORD = 'Password!123';

async function main() {
  console.log(`\n🔄 Recherche de l'utilisateur ${EMAIL}...`);
  
  // Lister les utilisateurs pour trouver l'ID
  const { data: usersList, error: listError } = await admin.auth.admin.listUsers({ 
    page: 1, 
    perPage: 100 
  });
  
  if (listError) {
    console.error('❌ Erreur lors de la liste:', listError);
    process.exit(1);
  }
  
  const user = usersList?.users?.find(u => u.email?.toLowerCase() === EMAIL.toLowerCase());
  
  if (!user) {
    console.log(`❌ Utilisateur ${EMAIL} non trouvé. Création...`);
    
    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
      email: EMAIL,
      password: NEW_PASSWORD,
      email_confirm: true
    });
    
    if (createError) {
      console.error('❌ Erreur création:', createError);
      process.exit(1);
    }
    
    console.log(`✅ Utilisateur créé: ${newUser.user.id}`);
    return;
  }
  
  console.log(`✅ Utilisateur trouvé: ${user.id}`);
  console.log(`📧 Email: ${user.email}`);
  console.log(`📅 Dernière connexion: ${user.last_sign_in_at || 'Jamais'}`);
  
  // Mettre à jour le mot de passe
  console.log(`\n🔐 Réinitialisation du mot de passe...`);
  
  const { data, error } = await admin.auth.admin.updateUserById(user.id, {
    password: NEW_PASSWORD
  });
  
  if (error) {
    console.error('❌ Erreur mise à jour:', error);
    process.exit(1);
  }
  
  console.log(`✅ Mot de passe réinitialisé avec succès !`);
  console.log(`\n📋 Credentials:`);
  console.log(`   Email: ${EMAIL}`);
  console.log(`   Password: ${NEW_PASSWORD}`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});

