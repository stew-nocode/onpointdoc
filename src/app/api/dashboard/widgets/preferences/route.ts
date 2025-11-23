import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { handleApiError } from '@/lib/errors/handlers';
import {
  getUserWidgetPreferences,
  updateUserWidgetPreferences,
  resetUserWidgetPreferences,
} from '@/services/dashboard/widgets';
import type { DashboardWidget } from '@/types/dashboard-widgets';

/**
 * GET /api/dashboard/widgets/preferences
 * Récupère les préférences de widgets d'un utilisateur
 */
export async function GET(request: NextRequest) {
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
      .select('id')
      .eq('auth_uid', user.id)
      .single();

    if (!profile.data) {
      return NextResponse.json({ error: 'Profil non trouvé' }, { status: 404 });
    }

    const hiddenWidgets = await getUserWidgetPreferences(profile.data.id);
    return NextResponse.json({ hiddenWidgets });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/dashboard/widgets/preferences
 * Met à jour les préférences de widgets d'un utilisateur
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
      .select('id')
      .eq('auth_uid', user.id)
      .single();

    if (!profile.data) {
      return NextResponse.json({ error: 'Profil non trouvé' }, { status: 404 });
    }

    const body = await request.json();
    const { hiddenWidgets } = body as {
      hiddenWidgets: DashboardWidget[];
    };

    if (!Array.isArray(hiddenWidgets)) {
      return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 });
    }

    await updateUserWidgetPreferences(profile.data.id, hiddenWidgets);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/dashboard/widgets/preferences
 * Réinitialise les préférences de widgets d'un utilisateur
 */
export async function DELETE(request: NextRequest) {
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
      .select('id')
      .eq('auth_uid', user.id)
      .single();

    if (!profile.data) {
      return NextResponse.json({ error: 'Profil non trouvé' }, { status: 404 });
    }

    await resetUserWidgetPreferences(profile.data.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

