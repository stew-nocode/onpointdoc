import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServerClient();
    // AuthN/role check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json('Unauthorized', { status: 401 });
    const { data: profile } = await supabase.from('profiles').select('role').eq('auth_uid', user.id).single();
    const profileRole = (profile as any)?.role as string | undefined;
    // Autoriser la création de contacts aux profils Admin / Manager / Director / Agent Support
    if (!profileRole || !['admin', 'manager', 'director', 'agent'].includes(profileRole)) {
      return NextResponse.json('Forbidden', { status: 403 });
    }

    const body = await req.json();
    const { fullName, email, password, role, companyId, isActive, moduleIds } = body as {
      fullName: string; email: string; password: string;
      role: 'agent' | 'manager' | 'admin' | 'director' | 'client';
      companyId?: string | null; isActive?: boolean; moduleIds?: string[];
    };

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE!;
    if (!url || !serviceRole) return NextResponse.json('Service role missing', { status: 500 });
    const admin = createClient(url, serviceRole, { auth: { persistSession: false } });

    // create Auth user
    const { data: created, error: authErr } = await admin.auth.admin.createUser({
      email, password, email_confirm: true
    });
    if (authErr || !created?.user) return NextResponse.json(authErr?.message || 'Auth error', { status: 400 });

    const authUid = created.user.id;
    // upsert profile
    const { error: upErr } = await admin.from('profiles').upsert({
      auth_uid: authUid, email, full_name: fullName, role, company_id: companyId || null, is_active: isActive ?? true
    }, { onConflict: 'auth_uid' });
    if (upErr) return NextResponse.json(upErr.message, { status: 400 });

    // fetch profile id
    const { data: prof } = await admin.from('profiles').select('id').eq('auth_uid', authUid).single();
    const profileId = (prof as any)?.id as string | undefined;
    if (profileId && Array.isArray(moduleIds) && moduleIds.length) {
      const rows = moduleIds.map((m: string) => ({ user_id: profileId, module_id: m }));
      await admin.from('user_module_assignments').upsert(rows);
    }

    // On renvoie l'identifiant du profil pour cohérence avec le service createContact
    return NextResponse.json({ profileId });
  } catch (e: any) {
    return NextResponse.json(e?.message ?? 'Server error', { status: 500 });
  }
}


