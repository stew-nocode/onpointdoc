import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import type { Profile } from '@/types/profile';
import { handleApiError } from '@/lib/errors/handlers';
import { createError } from '@/lib/errors/types';
import { userCreateSchema } from '@/lib/validators/user';

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    // AuthN/role check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return handleApiError(createError.unauthorized('Non authentifié'));
    }
    const { data: profile } = await supabase.from('profiles').select('role').eq('auth_uid', user.id).single();
    const profileRole = (profile as Profile | null)?.role;
    // Autoriser la création de contacts aux profils Admin / Manager / Director / Agent Support
    if (!profileRole || !['admin', 'manager', 'director', 'agent'].includes(profileRole)) {
      return handleApiError(createError.forbidden('Accès refusé', { requiredRole: ['admin', 'manager', 'director', 'agent'] }));
    }

    const body = await req.json();
    const validationResult = userCreateSchema.safeParse(body);
    if (!validationResult.success) {
      return handleApiError(createError.validationError('Données invalides', {
        issues: validationResult.error.issues
      }));
    }
    const { fullName, email, password, role, companyId, isActive, moduleIds, department, jobTitle } = validationResult.data;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
    if (!url || !serviceRole) {
      return handleApiError(createError.internalError('Configuration Supabase manquante', undefined, {
        missing: !url ? 'NEXT_PUBLIC_SUPABASE_URL' : 'SUPABASE_SERVICE_ROLE_KEY'
      }));
    }
    const admin = createClient(url, serviceRole, { auth: { persistSession: false } });

    // create Auth user
    const { data: created, error: authErr } = await admin.auth.admin.createUser({
      email, password, email_confirm: true
    });
    if (authErr || !created?.user) {
      return handleApiError(createError.supabaseError('Erreur lors de la création de l\'utilisateur', authErr ? new Error(authErr.message) : undefined));
    }

    const authUid = created.user.id;
    // upsert profile
    const { error: upErr } = await admin.from('profiles').upsert({
      auth_uid: authUid, 
      email, 
      full_name: fullName, 
      role, 
      company_id: companyId || null, 
      is_active: isActive ?? true,
      department: department || null,
      job_title: jobTitle || null
    }, { onConflict: 'auth_uid' });
    if (upErr) {
      return handleApiError(createError.supabaseError('Erreur lors de la création du profil', new Error(upErr.message)));
    }

    // fetch profile id
    const { data: prof } = await admin.from('profiles').select('id').eq('auth_uid', authUid).single();
    const profileId = (prof as { id: string } | null)?.id;
    if (profileId && Array.isArray(moduleIds) && moduleIds.length) {
      const rows = moduleIds.map((m: string) => ({ user_id: profileId, module_id: m }));
      await admin.from('user_module_assignments').upsert(rows);
    }

    // On renvoie l'identifiant du profil pour cohérence avec le service createContact
    return NextResponse.json({ profileId });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}


