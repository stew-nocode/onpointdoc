import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export type TicketTypeFilter = 'BUG' | 'REQ' | 'ASSISTANCE';
export type TicketStatusFilter = 'Nouveau' | 'En_cours' | 'Transfere' | 'Resolue';

const TICKET_STATUSES = ['Nouveau', 'En_cours', 'Transfere', 'Resolue'] as const;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') as TicketTypeFilter | null;
    const status = searchParams.get('status') as TicketStatusFilter | null;
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '25', 10);

    // Utiliser le service role key pour contourner RLS dans l'API
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from('tickets')
      .select('id, title, ticket_type, status, priority, assigned_to, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (type && (type === 'BUG' || type === 'REQ' || type === 'ASSISTANCE')) {
      query = query.eq('ticket_type', type);
    }

    if (status && TICKET_STATUSES.includes(status as any)) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      tickets: data || [],
      hasMore: count ? offset + limit < count : false,
      total: count || 0
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur lors du chargement des tickets' },
      { status: 500 }
    );
  }
}

