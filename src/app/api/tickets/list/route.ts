import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { applyQuickFilter } from '@/services/tickets';
import type { QuickFilter } from '@/types/ticket-filters';
import type { TicketWithRelations, SupabaseTicketRaw } from '@/types/ticket-with-relations';
import { transformRelation } from '@/types/ticket-with-relations';
import { ticketsListParamsSchema } from '@/lib/validators/api-params';
import { handleApiError } from '@/lib/errors/handlers';
import { createError } from '@/lib/errors/types';

export type TicketTypeFilter = 'BUG' | 'REQ' | 'ASSISTANCE';
export type TicketStatusFilter = string; // Accepte tous les statuts (JIRA ou locaux)

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Extraire et valider les paramètres avec Zod
    const searchParams = request.nextUrl.searchParams;
    const rawParams = {
      type: searchParams.get('type') || undefined,
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
      quick: searchParams.get('quick') || undefined,
      currentProfileId: searchParams.get('currentProfileId') || undefined,
      offset: searchParams.get('offset') || '0',
      limit: searchParams.get('limit') || '25'
    };

    // Valider avec Zod
    const validationResult = ticketsListParamsSchema.safeParse(rawParams);
    if (!validationResult.success) {
      return handleApiError(
        createError.validationError('Paramètres invalides', {
          issues: validationResult.error.issues
        })
      );
    }

    const params = validationResult.data;
    const type = params.type as TicketTypeFilter | undefined;
    const status = params.status as TicketStatusFilter | undefined;
    const search = params.search || null;
    const quickFilterParam = params.quick as QuickFilter | undefined;
    const currentProfileIdParam = params.currentProfileId || null;
    const offset = params.offset;
    const limit = params.limit;

    // Utiliser le service role key pour contourner RLS dans l'API
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return handleApiError(
        createError.internalError('Configuration Supabase manquante', undefined, {
          missing: !supabaseUrl ? 'NEXT_PUBLIC_SUPABASE_URL' : 'SUPABASE_SERVICE_ROLE_KEY'
        })
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
      return handleApiError(createError.supabaseError('Erreur lors de la récupération des tickets', error));
    }

    // Transformer les données : Supabase retourne des tableaux pour les relations, on veut des objets uniques
    const transformedTickets: TicketWithRelations[] = (data || []).map((ticket: SupabaseTicketRaw) => ({
      ...ticket,
      created_user: transformRelation(ticket.created_user),
      assigned_user: transformRelation(ticket.assigned_user),
      contact_user: transformRelation(ticket.contact_user),
      product: transformRelation(ticket.product),
      module: transformRelation(ticket.module)
    }));

    return NextResponse.json({
      tickets: transformedTickets,
      hasMore: count ? offset + limit < count : false,
      total: count || 0
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

