/**
 * API Route: /api/brevo/config
 *
 * GET   - Récupère la configuration Brevo
 * PATCH - Met à jour la configuration Brevo
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { handleApiError } from '@/lib/errors/handlers';
import { createError } from '@/lib/errors/types';
import { brevoConfigSchema } from '@/lib/validators/brevo';

/**
 * GET /api/brevo/config
 *
 * Récupère la configuration Brevo (sans exposer la clé API complète)
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    // Vérifier l'authentification
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return handleApiError(createError.unauthorized('Non authentifié'));
    }

    // Vérifier les permissions (manager, direction, admin)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('auth_uid', user.id)
      .single();

    const allowedRoles = ['manager', 'direction', 'admin'];
    const hasAccess = profile?.role && (
      allowedRoles.includes(profile.role) ||
      profile.role.includes('manager')
    );

    if (!hasAccess) {
      return handleApiError(
        createError.forbidden('Accès réservé aux managers, direction et administrateurs')
      );
    }

    // Récupérer la config (une seule ligne - singleton)
    const { data, error } = await supabase
      .from('brevo_config')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      throw createError.internalError(`Erreur lors de la récupération de la config: ${error.message}`);
    }

    // Masquer la clé API (ne montrer que les 8 premiers caractères)
    if (data?.api_key) {
      const maskedKey = data.api_key.substring(0, 8) + '••••••••••••••••';
      return NextResponse.json({
        success: true,
        config: {
          ...data,
          api_key: maskedKey,
          api_key_configured: true
        }
      });
    }

    // Aucune config trouvée
    return NextResponse.json({
      success: true,
      config: null,
      message: 'Aucune configuration Brevo trouvée'
    });

  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/brevo/config
 *
 * Met à jour ou crée la configuration Brevo
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // Vérifier l'authentification
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return handleApiError(createError.unauthorized('Non authentifié'));
    }

    // Vérifier les permissions (admin, direction seulement)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('auth_uid', user.id)
      .single();

    if (!profile?.role || !['admin', 'direction'].includes(profile.role)) {
      return handleApiError(
        createError.forbidden('Seuls les administrateurs et la direction peuvent modifier la configuration')
      );
    }

    // Parser et valider le body
    const body = await request.json();
    const validation = brevoConfigSchema.safeParse(body);

    if (!validation.success) {
      return handleApiError(
        createError.validationError('Configuration invalide', {
          issues: validation.error.issues
        })
      );
    }

    const configData = validation.data;

    // Récupérer la config existante (s'il y en a une)
    const { data: existingConfig } = await supabase
      .from('brevo_config')
      .select('id')
      .limit(1)
      .maybeSingle();

    // Préparer les données à insérer/mettre à jour
    const dataToSave = {
      api_key: configData.apiKey,
      api_url: configData.apiUrl,
      smtp_host: configData.smtpHost || null,
      smtp_port: configData.smtpPort || null,
      is_active: configData.isActive ?? true,
      updated_at: new Date().toISOString(),
      ...(existingConfig ? {} : { created_by: profile.id })
    };

    // Upsert (insert ou update)
    const { data, error } = await supabase
      .from('brevo_config')
      .upsert(
        existingConfig?.id
          ? { id: existingConfig.id, ...dataToSave }
          : dataToSave,
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (error) {
      throw createError.internalError(`Erreur lors de la sauvegarde de la config: ${error.message}`);
    }

    // Masquer la clé API dans la réponse
    const maskedConfig = {
      ...data,
      api_key: data.api_key.substring(0, 8) + '••••••••••••••••'
    };

    return NextResponse.json({
      success: true,
      config: maskedConfig,
      message: 'Configuration Brevo mise à jour avec succès'
    });

  } catch (error) {
    return handleApiError(error);
  }
}
