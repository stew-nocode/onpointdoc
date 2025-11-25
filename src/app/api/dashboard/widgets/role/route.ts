import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { handleApiError } from '@/lib/errors/handlers';
import { getRoleWidgets, getAllRoleWidgets, updateRoleWidgets } from '@/services/dashboard/widgets';
import type { DashboardRole, DashboardWidget } from '@/types/dashboard-widgets';
import { getCurrentUserProfileId } from '@/services/users/server';

/**
 * GET /api/dashboard/widgets/role
 * Récupère les widgets affectés à un rôle (ou tous les rôles si ?role non spécifié)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') as DashboardRole | null;

    if (role) {
      // Récupérer les widgets pour un rôle spécifique
      const widgets = await getRoleWidgets(role);
      return NextResponse.json({ widgets });
    }

    // Récupérer tous les widgets par rôle (admin uniquement)
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const profile = await supabase
      .from('profiles')
      .select('role')
      .eq('auth_uid', user.id)
      .single();

    if (!profile.data || profile.data.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const allRoleWidgets = await getAllRoleWidgets();
    return NextResponse.json({ roleWidgets: allRoleWidgets });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/dashboard/widgets/role
 * Met à jour les widgets affectés à un rôle (admin uniquement)
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

    const body = await request.json();
    const { role, widgets } = body as {
      role: DashboardRole;
      widgets: DashboardWidget[];
    };

    if (!role || !Array.isArray(widgets)) {
      return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 });
    }

    await updateRoleWidgets(role, widgets, profile.data.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

