import { NextResponse } from 'next/server';
import { listBasicProfiles } from '@/services/users/server';

export async function GET() {
  try {
    const profiles = await listBasicProfiles(200);
    return NextResponse.json(profiles);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des profils' },
      { status: 500 }
    );
  }
}

