import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { departmentCreateSchema } from '@/lib/validators/department';

export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ message: 'Non authentifié' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('auth_uid', user.id)
      .single();

    if (!profile || !['admin', 'director'].includes(profile.role)) {
      return NextResponse.json({ message: 'Accès refusé' }, { status: 403 });
    }

    const body = await req.json();
    const payload = departmentCreateSchema.parse(body);

    const { data, error } = await supabase
      .from('departments')
      .insert({
        name: payload.name,
        code: payload.code.toUpperCase(),
        description: payload.description || null,
        color: payload.color || null,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Erreur serveur' }, { status: 500 });
  }
}

