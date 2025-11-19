import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function DELETE(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ message: 'ID requis' }, { status: 400 });
    }

    // Vérifier si le département est utilisé
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('department_id', id)
      .limit(1);

    if (profiles && profiles.length > 0) {
      return NextResponse.json(
        { message: 'Impossible de supprimer : des utilisateurs sont associés à ce département' },
        { status: 400 }
      );
    }

    const { error } = await supabase.from('departments').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Erreur serveur' }, { status: 500 });
  }
}

