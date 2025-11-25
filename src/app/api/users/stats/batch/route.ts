import { NextResponse } from 'next/server';
import { loadUserStatsBatch } from '@/services/users/stats/user';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const profileIds = Array.isArray(body.profileIds)
      ? body.profileIds.filter((id: unknown) => typeof id === 'string')
      : [];
    const type = body.type === 'assigned' ? 'assigned' : body.type === 'reporter' ? 'reporter' : null;

    if (profileIds.length === 0 || !type) {
      return NextResponse.json(
        { error: 'profileIds et type (reporter|assigned) sont requis' },
        { status: 400 }
      );
    }

    const stats = await loadUserStatsBatch(profileIds, type);

    return NextResponse.json({ data: stats });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
