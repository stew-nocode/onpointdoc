import { NextResponse } from 'next/server';
import { loadTicketStatsBatch } from '@/services/tickets/stats/ticket';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const ticketIds = Array.isArray(body.ticketIds) ? body.ticketIds.filter((id: unknown) => typeof id === 'string') : [];

    if (ticketIds.length === 0) {
      return NextResponse.json(
        { error: 'ticketIds doit être un tableau de chaînes non vide' },
        { status: 400 }
      );
    }

    const stats = await loadTicketStatsBatch(ticketIds);

    return NextResponse.json({ data: stats });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
