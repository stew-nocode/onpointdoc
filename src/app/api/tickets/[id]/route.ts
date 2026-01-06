import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { handleApiError } from '@/lib/errors/handlers';
import { createError } from '@/lib/errors/types';
import { updateTicketSchema } from '@/lib/validators/ticket';
import { updateTicket, deleteTicket } from '@/services/tickets';
import { z } from 'zod';

/**
 * Route API pour mettre à jour un ticket
 * 
 * Méthode : PATCH
 * Authentification requise : Oui
 * Permissions : Admin ou Manager uniquement
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createSupabaseServerClient();

    // Vérifier l'authentification
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return handleApiError(createError.unauthorized('Non authentifié'));
    }

    // Vérifier les permissions (Admin ou Manager uniquement)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('auth_uid', user.id)
      .single();

    const role = profile?.role;
    if (!role || !['admin', 'manager'].includes(role)) {
      return handleApiError(
        createError.forbidden('Accès refusé. Seuls les administrateurs et managers peuvent modifier les tickets.', {
          requiredRole: ['admin', 'manager']
        })
      );
    }

    // Valider le body de la requête
    const body = await request.json();
    const validationResult = updateTicketSchema.safeParse({
      id,
      ...body
    });

    if (!validationResult.success) {
      return handleApiError(
        createError.validationError('Données invalides', {
          issues: validationResult.error.issues
        })
      );
    }

    // Mettre à jour le ticket
    const updatedTicket = await updateTicket(validationResult.data);

    return NextResponse.json({
      success: true,
      ticket: updatedTicket
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

/**
 * Route API pour supprimer un ticket
 * 
 * Méthode : DELETE
 * Authentification requise : Oui
 * Permissions : Admin uniquement
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const paramsData = await context.params;
    const supabase = await createSupabaseServerClient();

    const validationResult = z.object({ id: z.string().uuid() }).safeParse(paramsData);
    if (!validationResult.success) {
      return handleApiError(
        createError.validationError('ID de ticket invalide', {
          issues: validationResult.error.issues
        })
      );
    }

    const { id } = validationResult.data;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return handleApiError(createError.unauthorized('Non authentifié'));
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('auth_uid', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return handleApiError(
        createError.forbidden('Seuls les administrateurs peuvent supprimer des tickets', {
          requiredRole: 'admin'
        })
      );
    }

    await deleteTicket(id);

    return NextResponse.json({
      success: true,
      message: 'Ticket supprimé avec succès'
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

