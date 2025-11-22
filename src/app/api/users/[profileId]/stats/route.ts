import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors/handlers';
import { loadReporterStats, loadAssignedStats } from '@/services/users/stats/user';

/**
 * Route API pour récupérer les statistiques d'un utilisateur
 * GET /api/users/[profileId]/stats?type=reporter|assigned
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ profileId: string }> }
) {
  try {
    const paramsData = await context.params;
    const { profileId } = paramsData;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'assigned';

    const stats =
      type === 'reporter'
        ? await loadReporterStats(profileId)
        : await loadAssignedStats(profileId);

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    return handleApiError(error);
  }
}

