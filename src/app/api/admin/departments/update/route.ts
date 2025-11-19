import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { departmentUpdateSchema } from '@/lib/validators/department';

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
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
    const payload = departmentUpdateSchema.parse(body);

    const updateData: any = {};
    if (payload.name !== undefined) updateData.name = payload.name;
    if (payload.code !== undefined) updateData.code = payload.code.toUpperCase();
    if (payload.description !== undefined) updateData.description = payload.description;
    if (payload.color !== undefined) updateData.color = payload.color;
    if (payload.is_active !== undefined) updateData.is_active = payload.is_active;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('departments')
      .update(updateData)
      .eq('id', payload.id)
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

