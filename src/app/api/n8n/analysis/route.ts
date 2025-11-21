/**
 * Route API pour générer une analyse via N8N
 * 
 * POST /api/n8n/analysis
 * 
 * Body: { context: 'ticket' | 'company' | 'contact', id: string }
 * 
 * Nécessite une authentification.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateAnalysis } from '@/services/n8n/analysis';
import { generateAnalysisSchema } from '@/lib/validators/n8n';
import { handleApiError } from '@/lib/errors/handlers';
import { createError } from '@/lib/errors/types';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Profile } from '@/types/profile';

/**
 * Génère une analyse via N8N
 * 
 * @param req - La requête HTTP
 * @returns L'analyse générée ou une erreur
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // 1. Vérification de l'authentification
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return handleApiError(createError.unauthorized('Non authentifié'));
    }

    // 2. Récupération du profil pour vérifier les permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('auth_uid', user.id)
      .single();

    if (!profile) {
      return handleApiError(createError.unauthorized('Profil utilisateur introuvable'));
    }

    const profileRole = (profile as Profile).role;

    // 3. Vérification des permissions (admin, manager, agent peuvent générer des analyses)
    if (!profileRole || !['admin', 'manager', 'agent'].includes(profileRole)) {
      return handleApiError(
        createError.forbidden('Seuls les administrateurs, managers et agents peuvent générer des analyses')
      );
    }

    // 4. Validation du body
    const body = await req.json().catch(() => ({}));
    const validationResult = generateAnalysisSchema.safeParse(body);

    if (!validationResult.success) {
      return handleApiError(
        createError.validationError('Données invalides', {
          issues: validationResult.error.issues
        })
      );
    }

    const { context, id } = validationResult.data;

    // 5. Générer l'analyse via le service N8N
    const result = await generateAnalysis(context, id);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

