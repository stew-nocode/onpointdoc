/* eslint-disable no-console */
/**
 * Script d'import des employés ONPOINT AFRICA GROUP
 * 
 * Gère à la fois :
 * - Les utilisateurs INTERNES (éditeur) : rôles agent/manager/admin/director avec département et modules
 * - Les utilisateurs CLIENTS (externe) : rôle client, associés à l'entreprise ONPOINT AFRICA GROUP
 * 
 * Usage: node scripts/import-onpoint-africa-group-users.js
 * 
 * Structure des données attendues :
 * {
 *   "Nom Complet": "Nom Prénom",
 *   "Email": "email@onpoint.africa",
 *   "Rôle": "agent" | "manager" | "admin" | "director" | "client",
 *   "Département": "Support" | "IT" | "Marketing" | "",
 *   "Fonction": "Chef de projet, Directeur Technique...",
 *   "Modules": "Finance, RH" (noms séparés par virgule),
 *   "Mot de passe": "password123" (optionnel, généré si absent)
 * }
 */

import dotenv from 'dotenv';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

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

// ============================================
// DONNÉES À MODIFIER ICI
// ============================================
const usersData = [
  // Exemple utilisateurs INTERNES (éditeur)
  // {
  //   "Nom Complet": "John Doe",
  //   "Email": "john.doe@onpoint.africa",
  //   "Rôle": "agent",
  //   "Département": "Support",
  //   "Fonction": "Agent Support",
  //   "Modules": "Finance, RH",
  //   "Mot de passe": "TempPass123!"
  // },
  // Exemple utilisateurs CLIENTS (externe)
  // {
  //   "Nom Complet": "Jane Client",
  //   "Email": "jane.client@onpoint.africa",
  //   "Rôle": "client",
  //   "Département": "",
  //   "Fonction": "Chef de projet",
  //   "Modules": "",
  //   "Mot de passe": "TempPass123!"
  // }
];

// ============================================
// FONCTIONS
// ============================================

/**
 * Génère un mot de passe temporaire si non fourni
 */
function generateTempPassword() {
  return `Temp${Math.random().toString(36).slice(-8)}!`;
}

/**
 * Trouve ou crée un utilisateur Auth
 */
async function ensureAuthUser(email, password) {
  // Vérifie si l'utilisateur existe déjà
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existing = existingUsers?.users?.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  if (existing) {
    console.log(`   ⚠️  Compte Auth existant pour ${email}, réutilisation...`);
    return existing.id;
  }

  // Crée un nouveau compte Auth
  const { data: created, error: authErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (authErr) {
    throw new Error(`Erreur création Auth: ${authErr.message}`);
  }

  if (!created?.user) {
    throw new Error('Aucun utilisateur créé');
  }

  return created.user.id;
}

/**
 * Récupère les IDs des modules par leurs noms
 */
async function getModuleIds(moduleNames) {
  if (!moduleNames || !moduleNames.trim()) return [];

  const names = moduleNames
    .split(',')
    .map((n) => n.trim())
    .filter(Boolean);

  if (names.length === 0) return [];

  const { data: modules, error } = await supabase
    .from('modules')
    .select('id, name')
    .in('name', names);

  if (error) {
    console.warn(`   ⚠️  Erreur lors de la récupération des modules: ${error.message}`);
    return [];
  }

  return (modules || []).map((m) => m.id);
}

/**
 * Assigne les modules à un utilisateur
 */
async function assignModules(profileId, moduleIds) {
  if (!moduleIds || moduleIds.length === 0) return;

  // Supprime les anciennes affectations
  await supabase.from('user_module_assignments').delete().eq('user_id', profileId);

  // Crée les nouvelles affectations
  const rows = moduleIds.map((moduleId) => ({
    user_id: profileId,
    module_id: moduleId
  }));

  const { error } = await supabase.from('user_module_assignments').insert(rows);

  if (error) {
    console.warn(`   ⚠️  Erreur lors de l'affectation des modules: ${error.message}`);
  }
}

/**
 * Importe un utilisateur
 */
async function importUser(userData, onpointCompanyId) {
  const fullName = userData['Nom Complet']?.trim();
  const email = userData['Email']?.trim();
  const role = userData['Rôle']?.trim().toLowerCase();
  const department = userData['Département']?.trim() || null;
  const jobTitle = userData['Fonction']?.trim() || null;
  const moduleNames = userData['Modules']?.trim() || '';
  const password = userData['Mot de passe']?.trim() || generateTempPassword();

  if (!fullName || !email) {
    throw new Error('Nom complet et email requis');
  }

  // Validation du rôle
  const validInternalRoles = ['agent', 'manager', 'admin', 'director'];
  const isValidRole = role === 'client' || validInternalRoles.includes(role);
  if (!isValidRole) {
    throw new Error(`Rôle invalide: ${role}. Attendu: agent, manager, admin, director, ou client`);
  }

  // Validation du département (requis pour internes, optionnel pour clients)
  if (role !== 'client' && !department) {
    console.warn(`   ⚠️  Département manquant pour utilisateur interne ${email}, utilisation de "Support" par défaut`);
  }

  // Vérifie si le profil existe déjà
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, auth_uid, email, full_name, role, department, job_title, company_id')
    .eq('email', email)
    .maybeSingle();

  let authUid;
  let profileId;

  if (existingProfile) {
    console.log(`   🔄 Profil existant trouvé pour ${email}`);
    profileId = existingProfile.id;
    authUid = existingProfile.auth_uid;

    // Met à jour le profil
    const updatePayload = {
      full_name: fullName,
      role,
      department: role === 'client' ? null : (department || 'Support'),
      job_title: jobTitle,
      company_id: role === 'client' ? onpointCompanyId : null
    };

    const { error: updateErr } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', profileId);

    if (updateErr) {
      throw new Error(`Erreur mise à jour profil: ${updateErr.message}`);
    }

    // Si pas de compte Auth, on en crée un
    if (!authUid) {
      authUid = await ensureAuthUser(email, password);
      await supabase
        .from('profiles')
        .update({ auth_uid: authUid })
        .eq('id', profileId);
    }
  } else {
    // Crée le compte Auth
    authUid = await ensureAuthUser(email, password);

    // Crée le profil
    const profilePayload = {
      auth_uid: authUid,
      email,
      full_name: fullName,
      role,
      department: role === 'client' ? null : (department || 'Support'),
      job_title: jobTitle,
      company_id: role === 'client' ? onpointCompanyId : null,
      is_active: true
    };

    const { data: newProfile, error: insertErr } = await supabase
      .from('profiles')
      .insert(profilePayload)
      .select('id')
      .single();

    if (insertErr) {
      throw new Error(`Erreur création profil: ${insertErr.message}`);
    }

    profileId = newProfile.id;
  }

  // Gère les affectations modules (uniquement pour utilisateurs internes)
  if (role !== 'client' && moduleNames) {
    const moduleIds = await getModuleIds(moduleNames);
    if (moduleIds.length > 0) {
      await assignModules(profileId, moduleIds);
    }
  }

  return {
    profileId,
    authUid,
    email,
    fullName,
    role,
    department,
    jobTitle,
    password: existingProfile ? '(compte existant)' : password
  };
}

/**
 * Fonction principale
 */
async function main() {
  if (usersData.length === 0) {
    console.error('❌ Aucune donnée à importer. Veuillez remplir le tableau `usersData` dans le script.');
    process.exit(1);
  }

  console.log(`\n🔍 Recherche de l'entreprise ONPOINT AFRICA GROUP...\n`);

  const { data: companies, error: companyErr } = await supabase
    .from('companies')
    .select('id, name, jira_company_id')
    .ilike('name', '%onpoint%africa%');

  if (companyErr || !companies || companies.length === 0) {
    console.error(`❌ Entreprise ONPOINT AFRICA GROUP non trouvée`);
    console.error(`   Erreur: ${companyErr?.message || 'Entreprise introuvable'}`);
    process.exit(1);
  }

  const onpointCompany = companies[0];
  console.log(`✅ Entreprise trouvée (ID: ${onpointCompany.id}, Nom: ${onpointCompany.name})\n`);

  console.log(`🚀 Import de ${usersData.length} utilisateurs...\n`);

  let successCount = 0;
  let errorCount = 0;
  const results = [];

  for (const userData of usersData) {
    try {
      const result = await importUser(userData, onpointCompany.id);
      results.push(result);

      const roleDisplay = result.role === 'client' ? 'CLIENT' : `INTERNE (${result.role.toUpperCase()})`;
      const deptDisplay = result.department ? `, Département: ${result.department}` : '';
      const jobDisplay = result.jobTitle ? `, Fonction: ${result.jobTitle}` : '';
      const passwordDisplay = result.password !== '(compte existant)' ? `, Mot de passe: ${result.password}` : '';

      console.log(
        `✅ "${result.fullName}" importé (${roleDisplay}${deptDisplay}${jobDisplay}${passwordDisplay})`
      );
      successCount++;
    } catch (err) {
      console.error(`❌ Erreur pour "${userData['Nom Complet']}":`, err.message);
      errorCount++;
    }
  }

  console.log(`\n📊 Résumé:`);
  console.log(`   ✅ Importés/Mis à jour: ${successCount}`);
  console.log(`   ❌ Erreurs: ${errorCount}`);

  // Affiche un résumé des mots de passe générés
  const newPasswords = results.filter((r) => r.password !== '(compte existant)');
  if (newPasswords.length > 0) {
    console.log(`\n🔑 Mots de passe générés pour ${newPasswords.length} nouveaux utilisateurs:`);
    newPasswords.forEach((r) => {
      console.log(`   - ${r.email}: ${r.password}`);
    });
  }

  console.log(`\n✨ Import terminé!\n`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Erreur fatale:', err);
    process.exit(1);
  });

