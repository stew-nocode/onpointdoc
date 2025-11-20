import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { departmentCreateSchema } from '@/lib/validators/department';
import { handleApiError } from '@/lib/errors/handlers';
import { createError } from '@/lib/errors/types';
import type { Profile } from '@/types/profile';

export async function POST(req: NextRequest) {
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
    const validationResult = departmentCreateSchema.safeParse(body);
    if (!validationResult.success) {
      return handleApiError(createError.validationError('Données invalides', {
        issues: validationResult.error.issues
      }));
    }
    const payload = validationResult.data;

    const { data, error } = await supabase
      .from('departments')
      .insert({
        name: payload.name,
        code: payload.code.toUpperCase(),
        description: payload.description || null,
        color: payload.color || null,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      return handleApiError(createError.supabaseError('Erreur lors de la création du département', new Error(error.message)));
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

