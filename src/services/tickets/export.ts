import type { TicketWithRelations } from '@/types/ticket-with-relations';

/**
 * Convertit des tickets en format CSV
 * 
 * @param tickets - Liste des tickets à exporter
 * @returns Chaîne CSV
 */
export const exportTicketsToCSV = (tickets: TicketWithRelations[]): string => {
  // En-têtes CSV
  const headers = [
    'ID',
    'Titre',
    'Type',
    'Statut',
    'Priorité',
    'Canal',
    'Produit',
    'Module',
    'JIRA',
    'Créé le',
    'Rapporteur',
    'Assigné à'
  ];

  // Lignes de données
  const rows = tickets.map((ticket) => {
    const description = ticket.description
      ? String(ticket.description).replace(/\n/g, ' ').replace(/"/g, '""')
      : '';
    
    return [
      ticket.id,
      `"${ticket.title.replace(/"/g, '""')}"`,
      ticket.ticket_type,
      ticket.status,
      ticket.priority,
      ticket.canal || '',
      ticket.product?.name || '',
      ticket.module?.name || '',
      ticket.jira_issue_key || '',
      ticket.created_at ? new Date(ticket.created_at).toLocaleDateString('fr-FR') : '',
      ticket.created_user?.full_name || '',
      ticket.assigned_user?.full_name || ''
    ].join(',');
  });

  // Combiner en-têtes et lignes
  return [headers.join(','), ...rows].join('\n');
};

/**
 * Convertit des tickets en format Excel (JSON pour conversion côté client)
 * 
 * @param tickets - Liste des tickets à exporter
 * @returns Données formatées pour Excel
 */
export const exportTicketsToExcel = (tickets: TicketWithRelations[]): Array<Record<string, string>> => {
  return tickets.map((ticket) => ({
    ID: ticket.id,
    Titre: ticket.title,
    Description: ticket.description ? String(ticket.description).replace(/\n/g, ' ') : '',
    Type: ticket.ticket_type,
    Statut: ticket.status,
    Priorité: ticket.priority,
    Canal: ticket.canal || '',
    Produit: ticket.product?.name || '',
    Module: ticket.module?.name || '',
    JIRA: ticket.jira_issue_key || '',
    'Créé le': ticket.created_at ? new Date(ticket.created_at).toLocaleDateString('fr-FR') : '',
    Rapporteur: ticket.created_user?.full_name || '',
    'Assigné à': ticket.assigned_user?.full_name || ''
  }));
};

