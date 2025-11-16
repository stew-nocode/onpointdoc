import { unstable_noStore as noStore } from 'next/cache';
import Link from 'next/link';

import { createTicket, listTickets } from '@/services/tickets';
import { TICKET_STATUSES, countTicketsByStatus } from '@/services/tickets';
import { listProducts, listModules } from '@/services/products';
import type { CreateTicketInput } from '@/lib/validators/ticket';
import { Badge } from '@/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { CreateTicketDialog } from '@/components/tickets/create-ticket-dialog';

type TicketsPageProps = {
  searchParams?: {
    type?: string;
    status?: string;
  };
};

async function loadTickets(typeParam?: string, statusParam?: string) {
  noStore();
  try {
    const normalizedType =
      typeParam === 'BUG' || typeParam === 'REQ' || typeParam === 'ASSISTANCE'
        ? typeParam
        : undefined;

    const normalizedStatus = (TICKET_STATUSES as readonly string[]).includes(statusParam as any)
      ? (statusParam as (typeof TICKET_STATUSES)[number])
      : undefined;

    return await listTickets(normalizedType as any, normalizedStatus);
  } catch {
    return [];
  }
}

async function loadProductsAndModules() {
  noStore();
  try {
    const [products, modules] = await Promise.all([listProducts(), listModules()]);
    return { products, modules };
  } catch {
    return { products: [], modules: [] };
  }
}

export default async function TicketsPage({ searchParams }: TicketsPageProps) {
  const tickets = await loadTickets(searchParams?.type, searchParams?.status);
  const { products, modules } = await loadProductsAndModules();

  let counters:
    | Record<'Nouveau' | 'En_cours' | 'Transfere' | 'Resolue', number>
    | undefined;
  if (searchParams?.type === 'BUG' || searchParams?.type === 'REQ' || searchParams?.type === 'ASSISTANCE') {
    counters = await countTicketsByStatus(searchParams.type as any);
  }

  async function handleTicketSubmit(values: CreateTicketInput) {
    'use server';
    const created = await createTicket(values);
    return created?.id as string;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Tickets
          </p>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Gestion des tickets Support
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Cycle de vie : Nouveau → En cours → Transféré → Résolu
          </p>
        </div>
        <CreateTicketDialog
          products={products}
          modules={modules}
          onSubmit={handleTicketSubmit}
        />
      </div>

      {['BUG', 'REQ', 'ASSISTANCE'].includes(searchParams?.type ?? '') && (
        <div className="overflow-x-auto">
          <div className="flex gap-2">
            {[undefined, ...TICKET_STATUSES].map((statusOption) => {
              const isActive =
                searchParams?.status === statusOption ||
                (!searchParams?.status && statusOption === undefined);
              const href = statusOption
                ? `/gestion/tickets?type=${searchParams?.type}&status=${statusOption}`
                : `/gestion/tickets?type=${searchParams?.type}`;
              return (
                <Link
                  key={(statusOption ?? 'ALL') + (searchParams?.type ?? '')}
                  href={href}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    isActive
                      ? 'bg-brand/20 text-brand dark:bg-brand/30 dark:text-brand-foreground'
                      : 'bg-slate-800/40 text-slate-300 hover:bg-slate-700/50 dark:bg-slate-800/60'
                  }`}
                >
                  <span>
                    {statusOption ? statusOption.replace('_', ' ') : 'Tous'}
                  </span>
                  {statusOption && counters && (
                    <span className="ml-2 rounded-full bg-slate-900/30 px-2 py-0.5 text-[10px] dark:bg-slate-200/20">
                      {counters[statusOption as any] ?? 0}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <Card>
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
                <tr key={ticket.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-3 font-medium">
                    <Link
                      href={`/gestion/tickets/${ticket.id}`}
                      className="text-brand hover:underline"
                    >
                      {ticket.title}
                    </Link>
                  </td>
                  <td className="py-3 text-slate-600 dark:text-slate-300">{ticket.ticket_type}</td>
                  <td className="py-3">
                    <Badge
                      variant={
                        ticket.status === 'Resolue'
                          ? 'success'
                          : ticket.status === 'Transfere'
                            ? 'danger'
                            : 'warning'
                      }
                    >
                      {ticket.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="py-3 capitalize text-slate-600 dark:text-slate-300">
                    {ticket.priority}
                  </td>
                  <td className="py-3 text-slate-600 dark:text-slate-300">
                    {ticket.assigned_to ?? '-'}
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
    </div>
  );
}

