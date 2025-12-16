/**
 * API Route: /api/brevo/campaigns/sync
 *
 * POST - Synchronise toutes les campagnes depuis Brevo vers Supabase
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { handleApiError } from '@/lib/errors/handlers';
import { createError } from '@/lib/errors/types';
import { syncAllCampaignsFromBrevo } from '@/services/brevo/campaigns';

/**
 * POST /api/brevo/campaigns/sync
 *
 * Déclenche une synchronisation complète des campagnes Brevo
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // Vérifier l'authentification
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return handleApiError(createError.unauthorized('Non authentifié'));
    }

    // Vérifier les permissions (admin ou direction seulement)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('auth_uid', user.id)
      .single();

    if (!profile?.role || !['admin', 'direction'].includes(profile.role)) {
      return handleApiError(
        createError.forbidden('Seuls les administrateurs peuvent synchroniser les campagnes')
      );
    }

    // Parser les paramètres optionnels
    const body = await request.json().catch(() => ({}));
    const limit = body.limit || 50;

    // Lancer la synchronisation
    const result = await syncAllCampaignsFromBrevo(limit);

    return NextResponse.json({
      success: true,
      message: `Synchronisation terminée : ${result.synced} campagnes synchronisées, ${result.errors} erreurs`,
      synced: result.synced,
      errors: result.errors
    });

  } catch (error) {
    return handleApiError(error);
  }
}
