import { unstable_noStore as noStore } from 'next/cache';
import { notFound } from 'next/navigation';
import Link from 'next/link';

import { getTicketById, transferTicketToJira } from '@/services/tickets/jira-transfer';
import { Badge } from '@/ui/badge';
import { Button } from '@/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { TransferTicketButton } from '@/components/tickets/transfer-ticket-button';
import { TicketDescription } from '@/components/tickets/ticket-description';
import { getStatusBadgeVariant } from '@/lib/utils/ticket-status';

async function loadTicket(id: string) {
  noStore();
  try {
    return await getTicketById(id);
  } catch (error) {
    console.error('Erreur lors du chargement du ticket:', error);
    return null;
  }
}

export default async function TicketDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ticket = await loadTicket(id);

  if (!ticket) {
    notFound();
  }

  async function handleTransfer() {
    'use server';
    try {
      await transferTicketToJira(id);
    } catch (error) {
      throw error;
    }
  }

  const canTransfer =
    ticket.ticket_type === 'ASSISTANCE' && ticket.status === 'En_cours';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/gestion/tickets"
            className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            ← Retour à la liste
          </Link>
          <h1 className="mt-2 text-2xl font-bold">{ticket.title}</h1>
        </div>
        {canTransfer && (
          <TransferTicketButton onTransfer={handleTransfer} ticketId={id} />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Détails du ticket</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Description
              </label>
              <TicketDescription description={ticket.description} />
            </div>

            {ticket.customer_context && (
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Contexte client
                </label>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {ticket.customer_context}
                </p>
              </div>
            )}

            {ticket.duration_minutes && (
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Durée de l&apos;assistance
                </label>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {ticket.duration_minutes} minutes
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Type
              </label>
              <div className="mt-1">
                <Badge variant="info">{ticket.ticket_type}</Badge>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Statut
              </label>
              <div className="mt-1">
                <Badge
                  variant={getStatusBadgeVariant(ticket.status)}
                >
                  {ticket.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Priorité
              </label>
              <div className="mt-1">
                <Badge variant={ticket.priority === 'High' ? 'danger' : 'info'}>
                  {ticket.priority}
                </Badge>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Canal
              </label>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {ticket.canal}
              </p>
            </div>

            {ticket.product && (
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Produit
                </label>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {ticket.product.name}
                </p>
              </div>
            )}

            {ticket.module && (
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Module
                </label>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {ticket.module.name}
                </p>
              </div>
            )}

            {ticket.jira_issue_key && (
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Ticket JIRA
                </label>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {ticket.jira_issue_key}
                </p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Créé le
              </label>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {new Date(ticket.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}




