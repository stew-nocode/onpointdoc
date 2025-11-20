import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { applyQuickFilter } from '@/services/tickets';
import type { QuickFilter } from '@/types/ticket-filters';

export type TicketTypeFilter = 'BUG' | 'REQ' | 'ASSISTANCE';
export type TicketStatusFilter = string; // Accepte tous les statuts (JIRA ou locaux)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') as TicketTypeFilter | null;
    const status = searchParams.get('status') as TicketStatusFilter | null;
    const search = searchParams.get('search') || null;
    const quickFilterParam = searchParams.get('quick') as QuickFilter | null;
    const currentProfileIdParam = searchParams.get('currentProfileId');
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
      .select(`
        id,
        title,
        description,
        ticket_type,
        status,
        priority,
        canal,
        jira_issue_key,
        origin,
        target_date,
        bug_type,
        created_at,
        created_by,
        created_user:profiles!tickets_created_by_fkey(id, full_name),
        assigned_to,
        assigned_user:profiles!tickets_assigned_to_fkey(id, full_name),
        product:products(id, name),
        module:modules(id, name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (type && (type === 'BUG' || type === 'REQ' || type === 'ASSISTANCE')) {
      query = query.eq('ticket_type', type);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // Recherche textuelle dans titre, description et clé Jira
    if (search && search.trim().length > 0) {
      const searchTerm = `%${search.trim()}%`;
      // Utiliser .or() avec la syntaxe correcte pour Supabase
      // Format: "col1.op.val1,col2.op.val2" (sans guillemets autour des valeurs)
      query = query.or(`title.ilike.${searchTerm},description.ilike.${searchTerm},jira_issue_key.ilike.${searchTerm}`);
    }

    query = applyQuickFilter(query, quickFilterParam ?? undefined, {
      currentProfileId: currentProfileIdParam || undefined
    });

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Transformer les données : Supabase retourne des tableaux pour les relations, on veut des objets uniques
    const transformedTickets = (data || []).map((ticket: any) => ({
      ...ticket,
      created_user: Array.isArray(ticket.created_user) 
        ? ticket.created_user[0] || null 
        : ticket.created_user,
      assigned_user: Array.isArray(ticket.assigned_user) 
        ? ticket.assigned_user[0] || null 
        : ticket.assigned_user,
      product: Array.isArray(ticket.product) 
        ? ticket.product[0] || null 
        : ticket.product,
      module: Array.isArray(ticket.module) 
        ? ticket.module[0] || null 
        : ticket.module
    }));

    return NextResponse.json({
      tickets: transformedTickets,
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

