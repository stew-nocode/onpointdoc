/**
 * API Route: /api/brevo/campaigns
 *
 * GET  - Liste des campagnes avec filtres et pagination
 * POST - Créer une nouvelle campagne
 */

import { NextRequest, NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { handleApiError } from '@/lib/errors/handlers';
import { createError } from '@/lib/errors/types';
import { getCampaigns } from '@/services/brevo/campaigns';
import { getBrevoClient } from '@/services/brevo/client';
import { createEmailCampaignSchema, campaignFiltersSchema } from '@/lib/validators/brevo';

/**
 * GET /api/brevo/campaigns
 *
 * Récupère la liste des campagnes avec filtres et pagination
 */
export async function GET(request: NextRequest) {
  // Désactiver le cache pour données temps réel
  noStore();

  try {
    const supabase = await createSupabaseServerClient();

    // Vérifier l'authentification
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return handleApiError(createError.unauthorized('Non authentifié'));
    }

    // Vérifier les permissions (marketing, manager, direction, admin)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('auth_uid', user.id)
      .single();

    if (!profile?.role || !['marketing', 'manager', 'direction', 'admin'].includes(profile.role)) {
      return handleApiError(
        createError.forbidden('Accès réservé aux rôles marketing, manager, direction ou admin')
      );
    }

    // Parser les paramètres de recherche
    const searchParams = request.nextUrl.searchParams;
    const params = Object.fromEntries(searchParams.entries());

    // Convertir les paramètres en filtres
    const filters = {
      status: params.status,
      type: params.type,
      startDate: params.startDate,
      endDate: params.endDate,
      searchQuery: params.searchQuery,
      limit: params.limit ? parseInt(params.limit) : 20,
      offset: params.offset ? parseInt(params.offset) : 0,
      sort: params.sort as 'name' | 'sentDate' | 'openRate' | 'clickRate' | undefined,
      order: params.order as 'asc' | 'desc' | undefined
    };

    // Valider les filtres
    const validation = campaignFiltersSchema.safeParse(filters);
    if (!validation.success) {
      return handleApiError(
        createError.validationError('Paramètres de filtrage invalides', {
          issues: validation.error.issues
        })
      );
    }

    // Récupérer les campagnes
    const result = await getCampaigns(validation.data);

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/brevo/campaigns
 *
 * Crée une nouvelle campagne email dans Brevo
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // Vérifier l'authentification
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return handleApiError(createError.unauthorized('Non authentifié'));
    }

    // Vérifier les permissions (marketing, admin, direction seulement pour création)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('auth_uid', user.id)
      .single();

    if (!profile?.role || !['marketing', 'admin', 'direction'].includes(profile.role)) {
      return handleApiError(
        createError.forbidden('Seuls les rôles marketing, direction ou admin peuvent créer des campagnes')
      );
    }

    // Parser et valider le body
    const body = await request.json();
    const validation = createEmailCampaignSchema.safeParse(body);

    if (!validation.success) {
      return handleApiError(
        createError.validationError('Données de campagne invalides', {
          issues: validation.error.issues
        })
      );
    }

    const campaignData = validation.data;

    // Créer la campagne dans Brevo
    const brevoClient = getBrevoClient();
    const brevoResponse = await brevoClient.createCampaign(campaignData);

    // Synchroniser la campagne dans Supabase
    const { syncCampaignFromBrevo } = await import('@/services/brevo/campaigns');
    const savedCampaign = await syncCampaignFromBrevo(brevoResponse.id);

    return NextResponse.json({
      success: true,
      campaign: savedCampaign,
      message: 'Campagne créée avec succès'
    }, { status: 201 });

  } catch (error) {
    return handleApiError(error);
  }
}
