import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

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
    const { departmentId, productId } = body;

    if (!departmentId || !productId) {
      return NextResponse.json({ message: 'departmentId et productId requis' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('product_department_link')
      .insert({
        department_id: departmentId,
        product_id: productId
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ message: 'Cette liaison existe déjà' }, { status: 400 });
      }
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Erreur serveur' }, { status: 500 });
  }
}

