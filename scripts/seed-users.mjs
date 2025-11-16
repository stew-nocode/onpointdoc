/* eslint-disable no-console */
import dotenv from 'dotenv';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// Charger .env.local en priorité si présent
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  dotenv.config({ path: envPath });
} catch {}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SERVICE_ROLE =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SERVICE_ROLE ??
  '';

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE manquants.');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

const USERS = [
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

async function ensureAuthUser(u) {
  const { data, error } = await admin.auth.admin.createUser({
    email: u.email,
    password: u.password,
    email_confirm: true
  });
  if (error && !String(error.message || '').toLowerCase().includes('already registered')) {
    throw error;
  }
  if (data?.user) return data.user.id;

  const { data: profilesByEmail } = await admin
    .from('profiles')
    .select('auth_uid')
    .eq('email', u.email)
    .limit(1)
    .maybeSingle();
  if (profilesByEmail?.auth_uid) return profilesByEmail.auth_uid;

  const { data: usersList } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const found = usersList?.users?.find((x) => x.email?.toLowerCase() === u.email.toLowerCase());
  if (!found) throw new Error(`User Auth introuvable pour ${u.email}`);
  return found.id;
}

async function ensureProfile(authUid, u) {
  const { data, error } = await admin
    .from('profiles')
    .upsert(
      {
        auth_uid: authUid,
        email: u.email,
        full_name: u.fullName,
        role: u.role,
        department: u.department ?? null
      },
      { onConflict: 'auth_uid' }
    )
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

async function assignModules(profileId, moduleNames) {
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
    console.log(`\n==> ${u.email} (${u.role})`);
    const authUid = await ensureAuthUser(u);
    console.log('Auth UID:', authUid);
    const profileId = await ensureProfile(authUid, u);
    console.log('Profile ID:', profileId);
    await assignModules(profileId, u.modulesByName);
    console.log('Modules:', u.modulesByName?.join(', ') || '(aucun)');
  }
  console.log('\nTerminé ✅');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


