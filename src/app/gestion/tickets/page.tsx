import { unstable_noStore as noStore } from 'next/cache';

import { createTicket, listTickets } from '@/services/tickets';
import type { CreateTicketInput } from '@/lib/validators/ticket';
import { TicketForm } from '@/components/forms/ticket-form';
import { Badge } from '@/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';

async function loadTickets() {
  noStore();
  try {
    return await listTickets();
  } catch {
    return [];
  }
}

export default async function TicketsPage() {
  const tickets = await loadTickets();

  async function handleTicketSubmit(values: CreateTicketInput) {
    'use server';
    await createTicket(values);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Tickets récents</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <tr>
                <th className="pb-2">Titre</th>
                <th className="pb-2">Type</th>
                <th className="pb-2">Statut</th>
                <th className="pb-2">Priorité</th>
                <th className="pb-2">Assigné</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {tickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td className="py-3 font-medium">{ticket.title}</td>
                  <td className="py-3 text-slate-600 dark:text-slate-300">{ticket.ticket_type}</td>
                  <td className="py-3">
                    <Badge
                      variant={
                        ticket.status === 'RESOLU'
                          ? 'success'
                          : ticket.status === 'TRANSFERE'
                            ? 'danger'
                            : 'warning'
                      }
                    >
                      {ticket.status.toLowerCase()}
                    </Badge>
                  </td>
                  <td className="py-3 capitalize text-slate-600 dark:text-slate-300">
                    {ticket.priority}
                  </td>
                  <td className="py-3 text-slate-600 dark:text-slate-300">
                    {ticket.assigned_to_id ?? '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!tickets.length && (
            <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Aucun ticket enregistré pour le moment.
            </p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Nouveau ticket</CardTitle>
        </CardHeader>
        <CardContent>
          <TicketForm onSubmit={handleTicketSubmit} />
        </CardContent>
      </Card>
    </div>
  );
}

