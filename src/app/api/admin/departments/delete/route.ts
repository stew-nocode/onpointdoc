import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { handleApiError } from '@/lib/errors/handlers';
import { createError } from '@/lib/errors/types';
import { z } from 'zod';

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return handleApiError(createError.unauthorized('Non authentifié'));
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('auth_uid', user.id)
      .single();

    if (!profile || !['admin', 'director'].includes(profile.role)) {
      return handleApiError(createError.forbidden('Accès refusé', { requiredRole: ['admin', 'director'] }));
    }

    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get('id');
    const validationResult = z.object({ id: z.string().uuid() }).safeParse({ id: idParam });
    if (!validationResult.success) {
      return handleApiError(createError.validationError('ID invalide', {
        issues: validationResult.error.issues
      }));
    }
    const { id } = validationResult.data;

    // Vérifier si le département est utilisé
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('department_id', id)
      .limit(1);

    if (profiles && profiles.length > 0) {
      return handleApiError(createError.conflict('Impossible de supprimer : des utilisateurs sont associés à ce département'));
    }

    const { error } = await supabase.from('departments').delete().eq('id', id);

    if (error) {
      return handleApiError(createError.supabaseError('Erreur lors de la suppression du département', new Error(error.message)));
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

