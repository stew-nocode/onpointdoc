/**
 * Route API pour récupérer les items de planning pour une date donnée
 * 
 * Utilisée par les composants client du planning
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPlanningItemsForDate } from '@/services/planning/get-planning-items-for-date';
import { handleApiError } from '@/lib/errors/handlers';
import { z } from 'zod';

const QuerySchema = z.object({
  date: z.string().datetime(), // ISO date string
  viewMode: z.enum(['starts', 'dueDates']).optional().default('starts')
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get('date');
    const viewModeParam = searchParams.get('viewMode') || 'starts';

    // Valider les paramètres
    const validation = QuerySchema.safeParse({
      date: dateParam,
      viewMode: viewModeParam
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Paramètres invalides', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { date, viewMode } = validation.data;

    // Parser la date
    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json(
        { error: 'Date invalide' },
        { status: 400 }
      );
    }

    // Récupérer les items
    const items = await getPlanningItemsForDate(targetDate, viewMode);

    return NextResponse.json({ items });
  } catch (error) {
    return handleApiError(error);
  }
}



