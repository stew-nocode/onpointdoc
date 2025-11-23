import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors/handlers';
import { getUserDashboardConfig } from '@/services/dashboard/widgets';
import type { DashboardRole } from '@/types/dashboard-widgets';

/**
 * GET /api/dashboard/widgets/config?profileId=xxx&role=xxx
 * Récupère la configuration finale des widgets pour un utilisateur
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');
    const role = searchParams.get('role') as DashboardRole | null;

    if (!profileId || !role) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    const config = await getUserDashboardConfig(profileId, role);
    return NextResponse.json(config);
  } catch (error) {
    return handleApiError(error);
  }
}

