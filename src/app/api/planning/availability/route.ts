/**
 * Route API pour récupérer la disponibilité des utilisateurs pour une date donnée
 * 
 * Utilisée par le composant PlanningAvailability
 * 
 * NOTE: Cette route utilise le client service_role car elle doit accéder
 * aux données de TOUS les utilisateurs (tâches, activités) pour calculer
 * leur disponibilité. Les RLS normales bloquent cet accès.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAvailabilityForDate } from '@/services/planning/get-availability-for-date';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import { handleApiError } from '@/lib/errors/handlers';
import { z } from 'zod';

const QuerySchema = z.object({
  date: z.string().datetime() // ISO date string
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get('date');

    // Valider les paramètres
    const validation = QuerySchema.safeParse({
      date: dateParam
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Paramètres invalides', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { date } = validation.data;

    // Parser la date
    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json(
        { error: 'Date invalide' },
        { status: 400 }
      );
    }

    // Utiliser le client service_role pour contourner les RLS
    // Car on doit voir les tâches/activités de TOUS les utilisateurs
    const supabase = createSupabaseServiceRoleClient();
    const availability = await getAvailabilityForDate(supabase, targetDate);

    return NextResponse.json({ availability });
  } catch (error) {
    return handleApiError(error);
  }
}

