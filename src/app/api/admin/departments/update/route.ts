import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { departmentUpdateSchema } from '@/lib/validators/department';
import { handleApiError } from '@/lib/errors/handlers';
import { createError } from '@/lib/errors/types';

export async function PUT(req: NextRequest) {
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

    const body = await req.json();
    const validationResult = departmentUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return handleApiError(createError.validationError('Données invalides', {
        issues: validationResult.error.issues
      }));
    }
    const payload = validationResult.data;

    const updateData: Record<string, unknown> = {};
    if (payload.name !== undefined) updateData.name = payload.name;
    if (payload.code !== undefined) updateData.code = payload.code.toUpperCase();
    if (payload.description !== undefined) updateData.description = payload.description;
    if (payload.color !== undefined) updateData.color = payload.color;
    if (payload.is_active !== undefined) updateData.is_active = payload.is_active;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('departments')
      .update(updateData)
      .eq('id', payload.id)
      .select()
      .single();

    if (error) {
      return handleApiError(createError.supabaseError('Erreur lors de la mise à jour du département', new Error(error.message)));
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

