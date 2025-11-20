import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { handleApiError } from '@/lib/errors/handlers';
import { createError } from '@/lib/errors/types';
import { departmentLinkProductSchema } from '@/lib/validators/department';

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
    const validationResult = departmentLinkProductSchema.safeParse(body);
    if (!validationResult.success) {
      return handleApiError(createError.validationError('Données invalides', {
        issues: validationResult.error.issues
      }));
    }
    const { departmentId, productId } = validationResult.data;

    const { data, error } = await supabase
      .from('product_department_link')
      .insert({
        department_id: departmentId,
        product_id: productId
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return handleApiError(createError.conflict('Cette liaison existe déjà'));
      }
      return handleApiError(createError.supabaseError('Erreur lors de la liaison département-produit', new Error(error.message)));
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

