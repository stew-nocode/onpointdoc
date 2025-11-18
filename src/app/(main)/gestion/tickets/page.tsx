import { unstable_noStore as noStore } from 'next/cache';
import Link from 'next/link';
import { Eye } from 'lucide-react';

import { createTicket, listTickets } from '@/services/tickets';
import { TICKET_STATUSES, countTicketsByStatus } from '@/services/tickets';
import {
  listProducts,
  listModules,
  listSubmodules,
  listFeatures,
  listModulesForCurrentUser
} from '@/services/products';
import { listBasicProfiles } from '@/services/users/server';
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
    const [products, allModules, submodules, features, contacts, allowedModules] = await Promise.all([
      listProducts(),
      listModules(),
      listSubmodules(),
      listFeatures(),
      listBasicProfiles(),
      listModulesForCurrentUser()
    ]);

    // Si l'utilisateur a des modules affectés, filtrer la liste
    const modules =
      allowedModules && allowedModules.length
        ? allModules.filter((m) => allowedModules.some((am) => am.id === m.id))
        : allModules;

    return { products, modules, submodules, features, contacts };
  } catch {
    return { products: [], modules: [], submodules: [], features: [], contacts: [] };
  }
}

export default async function TicketsPage({ searchParams }: TicketsPageProps) {
  noStore(); // S'assurer que la page n'est pas mise en cache
  
  try {
    // Charger les données en parallèle
    const [tickets, productsData] = await Promise.all([
      loadTickets(searchParams?.type, searchParams?.status),
      loadProductsAndModules()
    ]);
    const { products, modules, submodules, features, contacts } = productsData;

    let counters:
      | Record<'Nouveau' | 'En_cours' | 'Transfere' | 'Resolue', number>
      | undefined;
    
    if (searchParams?.type === 'BUG' || searchParams?.type === 'REQ' || searchParams?.type === 'ASSISTANCE') {
      try {
        counters = await countTicketsByStatus(searchParams.type as any);
      } catch (error) {
        console.error('Erreur lors du calcul des compteurs:', error);
        counters = undefined;
      }
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
          submodules={submodules}
          features={features}
          contacts={contacts}
          onSubmit={handleTicketSubmit}
        />
      </div>

      <div className="overflow-x-auto">
        <div className="flex gap-2">
          {[undefined, ...TICKET_STATUSES].map((statusOption) => {
            const isActive =
              searchParams?.status === statusOption ||
              (!searchParams?.status && statusOption === undefined);
            
            // Construire l'URL en préservant le type s'il existe
            const params = new URLSearchParams();
            if (searchParams?.type) {
              params.set('type', searchParams.type);
            }
            if (statusOption) {
              params.set('status', statusOption);
            }
            const href = params.toString() 
              ? `/gestion/tickets?${params.toString()}`
              : '/gestion/tickets';
            
            return (
              <Link
                key={(statusOption ?? 'ALL') + (searchParams?.type ?? 'ALL')}
                href={href}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  isActive
                    ? 'bg-brand text-white dark:bg-brand dark:text-white'
                    : 'bg-slate-800/40 text-slate-300 hover:bg-slate-700/50 dark:bg-slate-800/60 dark:text-slate-300'
                }`}
              >
                <span>
                  {statusOption ? statusOption.replace('_', ' ') : 'Tous'}
                </span>
                {statusOption && counters && (
                  <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] ${
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : 'bg-slate-900/30 text-slate-300 dark:bg-slate-200/20 dark:text-slate-400'
                  }`}>
                    {counters[statusOption as (typeof TICKET_STATUSES)[number]] ?? 0}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tickets récents</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <tr>
                <th className="pb-2">Titre</th>
                <th className="pb-2">Type</th>
                <th className="pb-2">Statut</th>
                <th className="pb-2">Priorité</th>
                <th className="pb-2">Assigné</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-3 text-xs font-medium">
                    <Link
                      href={`/gestion/tickets/${ticket.id}`}
                      className="text-brand hover:underline dark:text-status-info dark:hover:text-status-info/80"
                    >
                      {ticket.title}
                    </Link>
                  </td>
                  <td className="py-3 text-xs text-slate-600 dark:text-slate-300">{ticket.ticket_type}</td>
                  <td className="py-3 text-xs">
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
                  <td className="py-3 text-xs capitalize text-slate-600 dark:text-slate-300">
                    {ticket.priority}
                  </td>
                  <td className="py-3 text-xs text-slate-600 dark:text-slate-300">
                    {ticket.assigned_to ?? '-'}
                  </td>
                  <td className="py-3 text-right text-xs">
                    <div className="flex justify-end gap-1.5">
                      <Link
                        href={`/gestion/tickets/${ticket.id}`}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md p-0 text-slate-600 hover:bg-slate-600/10 dark:text-slate-200 dark:hover:bg-slate-200/10"
                        aria-label="Voir le ticket"
                      >
                        <Eye className="h-3 w-3" />
                      </Link>
                    </div>
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
  } catch (error: any) {
    console.error('Erreur lors du chargement de la page des tickets:', error);
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-status-danger bg-status-danger/10 p-4 text-status-danger">
          <p className="font-semibold">Erreur lors du chargement</p>
          <p className="text-sm">
            {error?.message || 'Une erreur est survenue lors du chargement des tickets. Veuillez réessayer.'}
          </p>
        </div>
      </div>
    );
  }
}

