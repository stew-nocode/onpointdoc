import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { exportTicketsToCSV, exportTicketsToExcel } from '@/services/tickets/export';
import { bulkActionBaseSchema } from '@/lib/validators/bulk-actions';
import { handleApiError } from '@/lib/errors/handlers';
import { createError } from '@/lib/errors/types';
import type { TicketWithRelations, SupabaseTicketRaw } from '@/types/ticket-with-relations';
import { transformRelation } from '@/types/ticket-with-relations';

/**
 * POST /api/tickets/bulk/export
 * Exporte plusieurs tickets en CSV ou Excel
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    // Valider les IDs de tickets
    const idsValidation = bulkActionBaseSchema.safeParse(body);
    if (!idsValidation.success) {
      return handleApiError(
        createError.validationError('Paramètres invalides', {
          issues: idsValidation.error.issues
        })
      );
    }

    const { ticketIds } = idsValidation.data;
    const format = (body.format || 'csv') as 'csv' | 'excel';

    // Récupérer les tickets depuis la base de données
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
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
        created_at,
        created_user:profiles!tickets_created_by_fkey(id, full_name),
        assigned_to,
        assigned_user:profiles!tickets_assigned_to_fkey(id, full_name),
        product:products(id, name),
        module:modules(id, name)
      `)
      .in('id', ticketIds);

    if (error) {
      return handleApiError(
        createError.supabaseError('Erreur lors de la récupération des tickets', error)
      );
    }

    if (!data || data.length === 0) {
      return handleApiError(
        createError.notFound('Aucun ticket trouvé')
      );
    }

    // Transformer les relations
    const tickets: TicketWithRelations[] = (data || []).map((ticket: SupabaseTicketRaw) => ({
      ...ticket,
      created_user: transformRelation(ticket.created_user),
      assigned_user: transformRelation(ticket.assigned_user),
      contact_user: transformRelation(ticket.contact_user),
      product: transformRelation(ticket.product),
      module: transformRelation(ticket.module)
    }));

    // Exporter selon le format
    if (format === 'csv') {
      const csv = exportTicketsToCSV(tickets);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="tickets-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    } else {
      // Excel (JSON pour conversion côté client)
      const excelData = exportTicketsToExcel(tickets);
      return NextResponse.json(excelData, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="tickets-${new Date().toISOString().split('T')[0]}.json"`
        }
      });
    }
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

