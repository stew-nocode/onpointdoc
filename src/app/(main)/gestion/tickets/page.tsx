import { unstable_noStore as noStore } from 'next/cache';
import Link from 'next/link';

import { createTicket, listTicketsPaginated } from '@/services/tickets';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { CreateTicketDialog } from '@/components/tickets/create-ticket-dialog';
import { TicketsInfiniteScroll } from '@/components/tickets/tickets-infinite-scroll';
import { TicketsSearchBar } from '@/components/tickets/tickets-search-bar';

type TicketsPageProps = {
  searchParams?: Promise<{
    type?: string;
    status?: string;
    search?: string;
  }>;
};

async function loadInitialTickets(typeParam?: string, statusParam?: string, searchParam?: string) {
  noStore();
  try {
    const normalizedType =
      typeParam === 'BUG' || typeParam === 'REQ' || typeParam === 'ASSISTANCE'
        ? typeParam
        : undefined;

    const normalizedStatus = (TICKET_STATUSES as readonly string[]).includes(statusParam as any)
      ? (statusParam as (typeof TICKET_STATUSES)[number])
      : undefined;

    return await listTicketsPaginated(normalizedType as any, normalizedStatus, 0, 25, searchParam);
  } catch {
    return { tickets: [], hasMore: false, total: 0 };
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
  
  // Résoudre la Promise searchParams (Next.js 15)
  const params = await searchParams;
  
  try {
    // Charger les données en parallèle
    const [initialTicketsData, productsData] = await Promise.all([
      loadInitialTickets(params?.type, params?.status, params?.search),
      loadProductsAndModules()
    ]);
    const { products, modules, submodules, features, contacts } = productsData;

    let counters:
      | Record<'Nouveau' | 'En_cours' | 'Transfere' | 'Resolue', number>
      | undefined;
    
    if (params?.type === 'BUG' || params?.type === 'REQ' || params?.type === 'ASSISTANCE') {
      try {
        counters = await countTicketsByStatus(params.type as any);
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
              params?.status === statusOption ||
              (!params?.status && statusOption === undefined);
            
            // Construire l'URL en préservant le type s'il existe
            const urlParams = new URLSearchParams();
            if (params?.type) {
              urlParams.set('type', params.type);
            }
            if (statusOption) {
              urlParams.set('status', statusOption);
            }
            const href = urlParams.toString() 
              ? `/gestion/tickets?${urlParams.toString()}`
              : '/gestion/tickets';
            
            return (
              <Link
                key={(statusOption ?? 'ALL') + (params?.type ?? 'ALL')}
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>
              Tickets récents
              {initialTicketsData.total > 0 && (
                <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
                  ({initialTicketsData.total} au total)
                </span>
              )}
            </CardTitle>
            <TicketsSearchBar initialSearch={params?.search} />
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <TicketsInfiniteScroll
            initialTickets={initialTicketsData.tickets}
            initialHasMore={initialTicketsData.hasMore}
            initialTotal={initialTicketsData.total}
            type={params?.type}
            status={params?.status}
            search={params?.search}
          />
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

