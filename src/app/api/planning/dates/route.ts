/**
 * Route API pour récupérer les dates avec événements pour un mois donné
 * 
 * Utilisée par les composants client du planning pour surbrillance calendrier
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPlanningDatesWithEvents } from '@/services/planning/get-planning-dates-with-events';
import { handleApiError } from '@/lib/errors/handlers';
import { z } from 'zod';

const QuerySchema = z.object({
  year: z.string().regex(/^\d+$/).transform(Number),
  month: z.string().regex(/^\d+$/).transform(Number),
  viewMode: z.enum(['starts', 'dueDates']).optional().default('starts')
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const yearParam = searchParams.get('year');
    const monthParam = searchParams.get('month');
    const viewModeParam = searchParams.get('viewMode') || 'starts';

    // Valider les paramètres
    const validation = QuerySchema.safeParse({
      year: yearParam,
      month: monthParam,
      viewMode: viewModeParam
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Paramètres invalides', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { year, month, viewMode } = validation.data;

    // Valider le mois (0-11)
    if (month < 0 || month > 11) {
      return NextResponse.json(
        { error: 'Mois invalide (doit être entre 0 et 11)' },
        { status: 400 }
      );
    }

    // Récupérer les dates
    const dates = await getPlanningDatesWithEvents(year, month, viewMode);

    // Convertir les dates en ISO strings pour la réponse JSON
    const dateStrings = dates.map((date) => date.toISOString());

    return NextResponse.json({ dates: dateStrings });
  } catch (error) {
    return handleApiError(error);
  }
}



