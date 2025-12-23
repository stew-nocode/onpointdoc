/**
 * API Route - Statistiques de synchronisation JIRA
 * 
 * GET /api/jira/sync-stats
 * 
 * Retourne les statistiques de synchronisation JIRA.
 * Accès réservé aux rôles Admin, Manager et Director.
 */

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { handleApiError } from '@/lib/errors/handlers';
import { createError } from '@/lib/errors/types';
import {
  getJiraSyncStats,
  getRecentSyncErrors,
  getRecentSyncs,
} from '@/services/jira/sync-stats';

const ALLOWED_ROLES = ['admin', 'manager', 'director'];

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw createError.unauthorized('Authentification requise');
    }

    // Vérifier le rôle
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('auth_uid', user.id)
      .single();

    if (!profile || !ALLOWED_ROLES.includes(profile.role)) {
      throw createError.forbidden('Accès réservé aux administrateurs, managers et directeurs');
    }

    // Récupérer les statistiques
    const [stats, errors, recentSyncs] = await Promise.all([
      getJiraSyncStats(),
      getRecentSyncErrors(10),
      getRecentSyncs(20),
    ]);

    return NextResponse.json({
      stats,
      errors,
      recentSyncs,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

