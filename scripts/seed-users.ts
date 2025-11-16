/* eslint-disable no-console */
/**
 * Script de seed d'utilisateurs Auth + profils + affectations modules.
 * Prérequis:
 * - Variables d'env: SUPABASE_SERVICE_ROLE, NEXT_PUBLIC_SUPABASE_URL
 * - Dépendance: @supabase/supabase-js (déjà présente)
 *
 * Exécution:
 *   npx ts-node scripts/seed-users.ts
 *   # ou
 *   node -r ts-node/register scripts/seed-users.ts
 */
import { createClient } from '@supabase/supabase-js';

type SeedUser = {
  email: string;
  password: string;
  fullName: string;
  role: 'agent' | 'manager' | 'admin' | 'director' | 'client';
  department?: 'Support' | 'IT' | 'Marketing';
  modulesByName?: string[]; // noms des modules à affecter
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE ?? '';

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE manquants dans les variables d’environnement.');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

// Modifie cette liste selon tes besoins
const USERS: SeedUser[] = [
  {
    email: 'agent1@example.com',
    password: 'Password!123',
    fullName: 'Agent One',
    role: 'agent',
    department: 'Support',
    modulesByName: ['Module A']
  },
  {
    email: 'agent2@example.com',
    password: 'Password!123',
    fullName: 'Agent Two',
    role: 'agent',
    department: 'Support',
    modulesByName: ['Module B']
  },
  {
    email: 'manager1@example.com',
    password: 'Password!123',
    fullName: 'Manager One',
    role: 'manager',
    department: 'Support',
    modulesByName: ['Module A', 'Module B']
  },
  {
    email: 'admin1@example.com',
    password: 'Password!123',
    fullName: 'Admin One',
    role: 'admin',
    department: 'IT'
  },
  {
    email: 'director1@example.com',
    password: 'Password!123',
    fullName: 'Director One',
    role: 'director',
    department: 'Marketing'
  }
];

async function ensureAuthUser(user: SeedUser) {
  // Tente de retrouver un user auth par email (pas d'endpoint direct: on essaie createUser avec conflict ignorable)
  const { data, error } = await admin.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true
  });
  if (error && !String(error.message || '').toLowerCase().includes('already registered')) {
    throw error;
  }
  if (data?.user) {
    return data.user.id;
  }
  // Si déjà existant, récupère via invite ou export (pas dispo ici). On passe par profiles ensuite.
  // On lira le profile par email pour retrouver auth_uid si le profil existait déjà.
  const { data: profilesByEmail } = await admin
    .from('profiles')
    .select('auth_uid')
    .eq('email', user.email)
    .limit(1)
    .maybeSingle();
  if (profilesByEmail?.auth_uid) return profilesByEmail.auth_uid as string;

  // Dernier recours: fetch via auth.admin.listUsers (paginer léger)
  const { data: usersList } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const found = usersList?.users?.find((u) => u.email?.toLowerCase() === user.email.toLowerCase());
  if (!found) {
    throw new Error(`Impossible de retrouver le user Auth pour ${user.email}`);
  }
  return found.id;
}

async function ensureProfile(authUid: string, user: SeedUser) {
  const { data, error } = await admin
    .from('profiles')
    .upsert(
      {
        auth_uid: authUid,
        email: user.email,
        full_name: user.fullName,
        role: user.role,
        department: user.department ?? null
      },
      { onConflict: 'auth_uid' }
    )
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

async function assignModules(profileId: string, moduleNames?: string[]) {
  if (!moduleNames?.length) return;
  const { data: modules, error: modErr } = await admin
    .from('modules')
    .select('id, name')
    .in('name', moduleNames);
  if (modErr) throw modErr;

  const rows = (modules ?? []).map((m) => ({ user_id: profileId, module_id: m.id }));
  if (!rows.length) return;
  const { error } = await admin.from('user_module_assignments').upsert(rows);
  if (error) throw error;
}

async function main() {
  for (const u of USERS) {
    console.log(`\n==> Traitement ${u.email} (${u.role})`);
    const authUid = await ensureAuthUser(u);
    console.log(`Auth UID: ${authUid}`);
    const profileId = await ensureProfile(authUid, u);
    console.log(`Profile ID: ${profileId}`);
    await assignModules(profileId, u.modulesByName);
    console.log(`Affectations modules: ${u.modulesByName?.join(', ') || '(aucune)'}`);
  }
  console.log('\nTerminé ✅');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


