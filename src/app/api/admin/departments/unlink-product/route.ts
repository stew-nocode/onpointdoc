import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { handleApiError } from '@/lib/errors/handlers';
import { createError } from '@/lib/errors/types';
import { departmentUnlinkProductSchema } from '@/lib/validators/department';

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
    const rawParams = {
      departmentId: searchParams.get('departmentId'),
      productId: searchParams.get('productId')
    };
    const validationResult = departmentUnlinkProductSchema.safeParse(rawParams);
    if (!validationResult.success) {
      return handleApiError(createError.validationError('Paramètres invalides', {
        issues: validationResult.error.issues
      }));
    }
    const { departmentId, productId } = validationResult.data;

    const { error } = await supabase
      .from('product_department_link')
      .delete()
      .eq('department_id', departmentId)
      .eq('product_id', productId);

    if (error) {
      return handleApiError(createError.supabaseError('Erreur lors de la suppression de la liaison département-produit', new Error(error.message)));
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

