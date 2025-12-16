/**
 * Service for exporting tickets to PDF
 * Uses jsPDF for client-side PDF generation
 */

import type { TicketComment } from './comments';
import type { TicketAttachment } from './attachments/crud';

type TicketData = {
  id: string;
  title?: string | null;
  description?: string | null;
  ticket_type?: string | null;
  status?: string | null;
  priority?: string | null;
  canal?: string | null;
  jira_issue_key?: string | null;
  customer_context?: string | null;
  duration_minutes?: number | null;
  product?: { name: string } | null;
  module?: { name: string } | null;
};

/**
 * Generate and download a PDF of the ticket
 *
 * @param ticket - Ticket data
 * @param comments - Ticket comments
 * @param attachments - Ticket attachments
 */
export async function exportTicketToPDF(
  ticket: TicketData,
  comments: TicketComment[],
  attachments: TicketAttachment[]
): Promise<void> {
  // Dynamic import to avoid loading jsPDF unless needed (code splitting)
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF();
  let yPosition = 20;
  const lineHeight = 7;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;

  // Helper to add text with word wrap
  const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
    doc.setFontSize(fontSize);
    if (isBold) doc.setFont('helvetica', 'bold');
    else doc.setFont('helvetica', 'normal');

    const lines = doc.splitTextToSize(text, maxWidth);
    lines.forEach((line: string) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, margin, yPosition);
      yPosition += lineHeight;
    });
  };

  // Title
  addText(`Ticket: ${ticket.title ?? 'Sans titre'}`, 16, true);
  yPosition += 5;

  // Basic info
  addText(`Type: ${ticket.ticket_type ?? 'N/A'}`, 10);
  addText(`Statut: ${ticket.status ?? 'N/A'}`, 10);
  addText(`Priorité: ${ticket.priority ?? 'N/A'}`, 10);
  if (ticket.canal) addText(`Canal: ${ticket.canal}`, 10);
  if (ticket.jira_issue_key) addText(`JIRA: ${ticket.jira_issue_key}`, 10);
  if (ticket.product) addText(`Produit: ${ticket.product.name}`, 10);
  if (ticket.module) addText(`Module: ${ticket.module.name}`, 10);
  yPosition += 5;

  // Description
  if (ticket.description) {
    addText('Description:', 12, true);
    addText(ticket.description, 10);
    yPosition += 5;
  }

  // Customer context
  if (ticket.customer_context) {
    addText('Contexte client:', 12, true);
    addText(ticket.customer_context, 10);
    yPosition += 5;
  }

  // Duration
  if (ticket.duration_minutes) {
    addText(`Durée: ${ticket.duration_minutes} minutes`, 10);
    yPosition += 5;
  }

  // Attachments list
  if (attachments.length > 0) {
    addText(`Pièces jointes (${attachments.length}):`, 12, true);
    attachments.forEach((att) => {
      addText(`- ${att.file_name} (${formatFileSize(att.size_kb)})`, 10);
    });
    yPosition += 5;
  }

  // Comments
  if (comments.length > 0) {
    addText(`Commentaires (${comments.length}):`, 12, true);
    comments.forEach((comment, index) => {
      const author = comment.user?.full_name || 'Utilisateur inconnu';
      const date = new Date(comment.created_at).toLocaleDateString('fr-FR');
      addText(`${index + 1}. ${author} - ${date}`, 10, true);
      if (comment.content) {
        addText(comment.content, 9);
      }
      yPosition += 3;
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Page ${i} sur ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Download
  doc.save(`ticket-${ticket.id}.pdf`);
}

function formatFileSize(sizeKb: number | null): string {
  if (!sizeKb) return '';
  if (sizeKb < 1024) return `${sizeKb} KB`;
  return `${(sizeKb / 1024).toFixed(2)} MB`;
}
