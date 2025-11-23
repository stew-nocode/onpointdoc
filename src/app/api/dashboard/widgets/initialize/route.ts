import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors/handlers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { initializeDefaultWidgets } from '@/services/dashboard/widgets/default-widgets';

/**
 * POST /api/dashboard/widgets/initialize
 * Initialise les widgets par défaut pour tous les rôles (admin uniquement)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const profile = await supabase
      .from('profiles')
      .select('id, role')
      .eq('auth_uid', user.id)
      .single();

    if (!profile.data || profile.data.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    await initializeDefaultWidgets(profile.data.id);
    return NextResponse.json({ success: true, message: 'Widgets initialisés avec succès' });
  } catch (error) {
    return handleApiError(error);
  }
}

