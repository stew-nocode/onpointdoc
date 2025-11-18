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
  { "Nom Complet": "Edwige KOUASSI", "Email": "", "Rôle": "client", "Département": "", "Fonction": "", "Modules": "", "Mot de passe": "" },
  { "Nom Complet": "DORIS N'GBRA", "Email": "", "Rôle": "client", "Département": "", "Fonction": "", "Modules": "", "Mot de passe": "" },
  { "Nom Complet": "KOKONBO PHILOMENE", "Email": "", "Rôle": "client", "Département": "", "Fonction": "", "Modules": "", "Mot de passe": "" },
  { "Nom Complet": "Joël SIE", "Email": "", "Rôle": "client", "Département": "", "Fonction": "", "Modules": "", "Mot de passe": "" },
  { "Nom Complet": "GNAHORE AMOS", "Email": "", "Rôle": "client", "Département": "", "Fonction": "", "Modules": "", "Mot de passe": "" },
  { "Nom Complet": "MONSIEUR VATI", "Email": "", "Rôle": "client", "Département": "", "Fonction": "", "Modules": "", "Mot de passe": "" },
  { "Nom Complet": "M. Martial", "Email": "", "Rôle": "client", "Département": "", "Fonction": "", "Modules": "", "Mot de passe": "" },
  { "Nom Complet": "Vivien DAKPOGAN", "Email": "", "Rôle": "client", "Département": "", "Fonction": "", "Modules": "", "Mot de passe": "" },
  { "Nom Complet": "EVA BASSE", "Email": "", "Rôle": "client", "Département": "", "Fonction": "", "Modules": "", "Mot de passe": "" },
  { "Nom Complet": "DELPHIN", "Email": "", "Rôle": "client", "Département": "", "Fonction": "", "Modules": "", "Mot de passe": "" },
  { "Nom Complet": "FABIEN VATI", "Email": "", "Rôle": "client", "Département": "", "Fonction": "", "Modules": "", "Mot de passe": "" },
  { "Nom Complet": "Olivier Kacou", "Email": "", "Rôle": "client", "Département": "", "Fonction": "", "Modules": "", "Mot de passe": "" },
  { "Nom Complet": "CEDRIC EMMANUELLA", "Email": "", "Rôle": "client", "Département": "", "Fonction": "", "Modules": "", "Mot de passe": "" },
  { "Nom Complet": "M.SANANKOUA", "Email": "", "Rôle": "client", "Département": "", "Fonction": "", "Modules": "", "Mot de passe": "" },
  { "Nom Complet": "Ursula YANGANGOUSSOU", "Email": "", "Rôle": "client", "Département": "", "Fonction": "", "Modules": "", "Mot de passe": "" },
  { "Nom Complet": "OLIVIA NGO", "Email": "", "Rôle": "client", "Département": "", "Fonction": "", "Modules": "", "Mot de passe": "" },
  { "Nom Complet": "Gaelle TOURE", "Email": "", "Rôle": "client", "Département": "", "Fonction": "", "Modules": "", "Mot de passe": "" },
  { "Nom Complet": "MADAME ALAO", "Email": "", "Rôle": "client", "Département": "", "Fonction": "", "Modules": "", "Mot de passe": "" },
  { "Nom Complet": "DORIANE", "Email": "", "Rôle": "client", "Département": "", "Fonction": "", "Modules": "", "Mot de passe": "" },
  { "Nom Complet": "M. SIE KONAN", "Email": "", "Rôle": "client", "Département": "", "Fonction": "", "Modules": "", "Mot de passe": "" },
  { "Nom Complet": "Charley KOUAME", "Email": "", "Rôle": "client", "Département": "", "Fonction": "", "Modules": "", "Mot de passe": "" },
  { "Nom Complet": "Mme EBEQUOI", "Email": "", "Rôle": "client", "Département": "", "Fonction": "", "Modules": "", "Mot de passe": "" },
  { "Nom Complet": "ESTHER ALIDJA", "Email": "", "Rôle": "client", "Département": "", "Fonction": "", "Modules": "", "Mot de passe": "" },
  { "Nom Complet": "MYRIAM", "Email": "", "Rôle": "client", "Département": "", "Fonction": "", "Modules": "", "Mot de passe": "" },
  { "Nom Complet": "FABIEN", "Email": "", "Rôle": "client", "Département": "", "Fonction": "", "Modules": "", "Mot de passe": "" },
  { "Nom Complet": "MONSIEUR KOFFI MARIUS", "Email": "", "Rôle": "client", "Département": "", "Fonction": "", "Modules": "", "Mot de passe": "" },
  { "Nom Complet": "SUPPORT JOEL", "Email": "", "Rôle": "client", "Département": "", "Fonction": "", "Modules": "", "Mot de passe": "" }
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
  const email = userData['Email']?.trim() || null;
  const role = userData['Rôle']?.trim().toLowerCase();
  const department = userData['Département']?.trim() || null;
  const jobTitle = userData['Fonction']?.trim() || null;
  const moduleNames = userData['Modules']?.trim() || '';
  const password = userData['Mot de passe']?.trim() || generateTempPassword();

  if (!fullName) {
    throw new Error('Nom complet requis');
  }

  // Pour les utilisateurs internes, l'email est requis pour créer un compte Auth
  const validInternalRoles = ['agent', 'manager', 'admin', 'director'];
  const isInternalUser = validInternalRoles.includes(role);
  if (isInternalUser && !email) {
    throw new Error(`Email requis pour les utilisateurs internes (${role})`);
  }

  // Validation du rôle
  const isValidRole = role === 'client' || validInternalRoles.includes(role);
  if (!isValidRole) {
    throw new Error(`Rôle invalide: ${role}. Attendu: agent, manager, admin, director, ou client`);
  }

  // Validation du département (requis pour internes, optionnel pour clients)
  if (isInternalUser && !department) {
    console.warn(`   ⚠️  Département manquant pour utilisateur interne ${email || fullName}, utilisation de "Support" par défaut`);
  }

  // Vérifie si le profil existe déjà
  let existingProfile = null;
  if (email) {
    const { data } = await supabase
      .from('profiles')
      .select('id, auth_uid, email, full_name, role, department, job_title, company_id, jira_user_id')
      .eq('email', email)
      .maybeSingle();
    existingProfile = data;
  } else {
    // Pour les contacts sans email, recherche par nom + entreprise
    const { data } = await supabase
      .from('profiles')
      .select('id, auth_uid, email, full_name, role, department, job_title, company_id, jira_user_id')
      .eq('full_name', fullName)
      .eq('company_id', onpointCompanyId)
      .maybeSingle();
    existingProfile = data;
  }

  let authUid;
  let profileId;
  let finalRole = role;
  let finalDepartment = role === 'client' ? null : (department || 'Support');
  let finalCompanyId = role === 'client' ? onpointCompanyId : null;

  if (existingProfile) {
    const existingRole = existingProfile.role;
    const isExistingInternal = validInternalRoles.includes(existingRole);
    
    const hasJiraId = existingProfile.jira_user_id ? `, JIRA ID: ${existingProfile.jira_user_id}` : '';
    console.log(`   🔄 Profil existant trouvé (Rôle actuel: ${existingRole}${hasJiraId})`);
    profileId = existingProfile.id;
    authUid = existingProfile.auth_uid;

    // Préserver le rôle interne existant, ne pas le remplacer par "client"
    finalRole = isExistingInternal ? existingRole : role;
    
    // Si c'est un utilisateur interne existant, préserver le département et company_id
    // Sinon, utiliser les nouvelles valeurs
    finalDepartment = isExistingInternal 
      ? (existingProfile.department || department || 'Support')
      : (role === 'client' ? null : (department || 'Support'));
    
    finalCompanyId = isExistingInternal
      ? existingProfile.company_id
      : (role === 'client' ? onpointCompanyId : null);

    // Met à jour le profil en préservant les données importantes
    // IMPORTANT: Ne jamais écraser jira_user_id car il est utilisé pour mapper les tickets JIRA
    const updatePayload = {
      full_name: fullName,
      role: finalRole,
      department: finalDepartment,
      job_title: jobTitle || existingProfile.job_title || null,
      company_id: finalCompanyId
      // jira_user_id est préservé automatiquement car non inclus dans updatePayload
    };

    // Ne mettre à jour que si les valeurs ont changé
    const hasChanges = 
      existingProfile.full_name !== fullName ||
      existingProfile.role !== finalRole ||
      existingProfile.department !== finalDepartment ||
      (jobTitle && existingProfile.job_title !== jobTitle) ||
      existingProfile.company_id !== finalCompanyId;

    if (hasChanges) {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', profileId);

      if (updateErr) {
        throw new Error(`Erreur mise à jour profil: ${updateErr.message}`);
      }
      
      if (isExistingInternal) {
        console.log(`   ✅ Rôle interne préservé: ${finalRole}`);
      }
      
      // Confirmer la préservation du jira_user_id
      if (existingProfile.jira_user_id) {
        console.log(`   ✅ JIRA User ID préservé: ${existingProfile.jira_user_id} (utilisé pour mapper les tickets)`);
      }
    } else {
      console.log(`   ⏭️  Aucune modification nécessaire`);
    }

    // Si pas de compte Auth et email disponible, on en crée un
    if (!authUid && email) {
      authUid = await ensureAuthUser(email, password);
      await supabase
        .from('profiles')
        .update({ auth_uid: authUid })
        .eq('id', profileId);
    }
  } else {
    // Crée le compte Auth uniquement si email disponible
    if (email) {
      authUid = await ensureAuthUser(email, password);
    }

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
    role: finalRole,
    department: finalDepartment,
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
    .ilike('name', '%onpoint%');

  if (companyErr) {
    console.error(`❌ Erreur lors de la recherche: ${companyErr.message}`);
    process.exit(1);
  }

  if (!companies || companies.length === 0) {
    console.error(`❌ Aucune entreprise ONPOINT trouvée`);
    process.exit(1);
  }

  // Priorité : ONPOINT AFRICA GROUP > ONPOINT AFRICA > ONPOINT
  let onpointCompany = companies.find((c) => 
    c.name.toLowerCase().includes('onpoint africa group')
  );
  
  if (!onpointCompany) {
    onpointCompany = companies.find((c) => 
      c.name.toLowerCase().includes('onpoint africa')
    );
  }
  
  if (!onpointCompany) {
    onpointCompany = companies[0];
  }

  if (companies.length > 1) {
    console.log(`⚠️  ${companies.length} entreprise(s) ONPOINT trouvée(s):`);
    companies.forEach((c) => {
      const marker = c.id === onpointCompany.id ? '👉' : '  ';
      console.log(`${marker} - ${c.name} (ID: ${c.id})`);
    });
    console.log('');
  }

  console.log(`✅ Entreprise sélectionnée: ${onpointCompany.name} (ID: ${onpointCompany.id})`);
  if (onpointCompany.jira_company_id) {
    console.log(`   JIRA ID: ${onpointCompany.jira_company_id}`);
  }
  console.log('');

  console.log(`🚀 Import de ${usersData.length} utilisateurs...\n`);

  let successCount = 0;
  let errorCount = 0;
  const results = [];

  for (const userData of usersData) {
    try {
      const result = await importUser(userData, onpointCompany.id);
      results.push(result);

    const roleDisplay = result.role === 'client' ? 'CLIENT' : `INTERNE (${result.role.toUpperCase()})`;
    const emailDisplay = result.email ? `, Email: ${result.email}` : '';
    const deptDisplay = result.department ? `, Département: ${result.department}` : '';
    const jobDisplay = result.jobTitle ? `, Fonction: ${result.jobTitle}` : '';
    const passwordDisplay = result.password !== '(compte existant)' && result.email ? `, Mot de passe: ${result.password}` : '';

    console.log(
      `✅ "${result.fullName}" importé (${roleDisplay}${emailDisplay}${deptDisplay}${jobDisplay}${passwordDisplay})`
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

