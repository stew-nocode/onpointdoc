import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticketIds, format = 'csv' } = body;

    if (!Array.isArray(ticketIds) || ticketIds.length === 0) {
      return NextResponse.json(
        { error: 'ticketIds doit être un tableau non vide' },
        { status: 400 }
      );
    }

    if (!['csv', 'excel'].includes(format)) {
      return NextResponse.json(
        { error: 'Format invalide (csv ou excel)' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Récupérer les tickets avec leurs relations
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select(`
        id,
        title,
        ticket_type,
        status,
        priority,
        canal,
        jira_issue_key,
        created_at,
        assigned_user:profiles!tickets_assigned_to_fkey(full_name),
        product:products(name),
        module:modules(name)
      `)
      .in('id', ticketIds)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!tickets || tickets.length === 0) {
      return NextResponse.json(
        { error: 'Aucun ticket trouvé' },
        { status: 404 }
      );
    }

    // Générer le CSV
    const headers = [
      'ID',
      'Titre',
      'Type',
      'Statut',
      'Priorité',
      'Canal',
      'Jira',
      'Produit',
      'Module',
      'Assigné',
      'Créé le'
    ];

    const rows = tickets.map(ticket => [
      ticket.id,
      ticket.title || '',
      ticket.ticket_type || '',
      ticket.status || '',
      ticket.priority || '',
      ticket.canal || '',
      ticket.jira_issue_key || '',
      (ticket.product as any)?.name || '',
      (ticket.module as any)?.name || '',
      (ticket.assigned_user as any)?.full_name || '',
      ticket.created_at ? new Date(ticket.created_at).toLocaleDateString('fr-FR') : ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Ajouter BOM pour Excel UTF-8
    const bom = '\uFEFF';
    const content = format === 'excel' ? bom + csvContent : csvContent;

    return new NextResponse(content, {
      headers: {
        'Content-Type': format === 'excel' ? 'application/vnd.ms-excel' : 'text/csv',
        'Content-Disposition': `attachment; filename="tickets-export-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'csv' : 'csv'}"`
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'export' },
      { status: 500 }
    );
  }
}

