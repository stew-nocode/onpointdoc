/* eslint-disable no-console */
/**
 * Script pour réinitialiser le mot de passe d'Edwige Kouassi
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
try {
  const envPath = join(__dirname, '..', '.env.local');
  dotenv.config({ path: envPath });
} catch {}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE/SUPABASE_SERVICE_ROLE_KEY manquants.');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

// Configuration de l'utilisateur Edwige Kouassi
const EDWIGE_USER = {
  email: 'edwige.kouassi@onpointafrica.com',
  password: 'Edwige2025!',
  fullName: 'Edwige KOUASSI'
};

async function main() {
  console.log('🔐 RÉINITIALISATION DU MOT DE PASSE POUR EDWIGE KOUASSI\n');
  
  try {
    // Trouver le profil
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id, email, full_name, auth_uid')
      .or(`email.ilike.%${EDWIGE_USER.email}%,full_name.ilike.%edwige%kouassi%`)
      .limit(1)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    if (!profile) {
      console.error('❌ Profil introuvable pour Edwige Kouassi');
      process.exit(1);
    }

    console.log(`✅ Profil trouvé: ${profile.full_name} (${profile.email})`);

    if (!profile.auth_uid) {
      console.error('❌ Aucun auth_uid associé au profil');
      process.exit(1);
    }

    // Réinitialiser le mot de passe
    console.log('\n🔐 Réinitialisation du mot de passe...');
    const { error: updateError } = await admin.auth.admin.updateUserById(
      profile.auth_uid,
      { password: EDWIGE_USER.password }
    );

    if (updateError) {
      throw updateError;
    }

    console.log('✅ Mot de passe réinitialisé avec succès !\n');
    
    console.log('═══════════════════════════════════════');
    console.log('📝 INFORMATIONS DE CONNEXION:');
    console.log('═══════════════════════════════════════');
    console.log(`   Email: ${EDWIGE_USER.email}`);
    console.log(`   Mot de passe: ${EDWIGE_USER.password}`);
    console.log('═══════════════════════════════════════\n');
    
  } catch (error) {
    console.error('\n❌ Erreur:', error.message || error);
    process.exit(1);
  }
}

main();





