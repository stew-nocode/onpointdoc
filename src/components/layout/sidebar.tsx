'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, Fragment } from 'react';

import { mainNav } from '@/lib/constants/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Ticket,
  CalendarDays,
  ListChecks,
  Building2,
  Users,
  Boxes,
  Puzzle,
  Sparkles
} from 'lucide-react';

type SidebarProps = {
  role?: 'agent' | 'manager' | 'it' | 'marketing' | 'direction' | 'director' | 'admin';
};

export const Sidebar = ({ role = 'agent' }: SidebarProps) => {
  const pathname = usePathname();
  const roleKey = role === 'director' ? 'direction' : role;
  const items =
    role === 'admin' || role === 'director' ? mainNav : mainNav.filter((item) => item.roles.includes(roleKey as any));
  const [ticketsOpen, setTicketsOpen] = useState(false);

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 shrink-0 border-r border-slate-200 bg-white/90 p-6 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-100">
      <div className="w-full">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Navigation
        </p>
        <ul className="mt-4 space-y-2">
          {items.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const isTickets = item.segment === 'tickets';
            const Icon =
              item.segment === 'dashboard'
                ? LayoutDashboard
                : item.segment === 'tickets'
                  ? Ticket
                  : item.segment === 'activites'
                    ? CalendarDays
                    : item.segment === 'taches'
                      ? ListChecks
                      : undefined;

            if (isTickets) {
              const activeTickets = pathname.startsWith(item.href);
              return (
                <Fragment key={`${item.href}-group`}>
                  <li key={item.href}>
                    <div
                      className={cn(
                        'flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition',
                        activeTickets
                          ? 'bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand-foreground'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                      )}
                    >
                      <Link href={item.href} className="flex-1 inline-flex items-center gap-2">
                        {Icon && <Icon className="h-4 w-4 opacity-80" />}
                        <span>{item.label}</span>
                      </Link>
                      <button
                        type="button"
                        aria-expanded={ticketsOpen}
                        aria-controls="submenu-tickets"
                        onClick={() => setTicketsOpen((v) => !v)}
                        className="ml-2 rounded-md px-2 py-1 text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        {ticketsOpen ? '▾' : '▸'}
                      </button>
                    </div>

                    {ticketsOpen && (
                      <ul
                        id="submenu-tickets"
                        className="mt-1 space-y-1 pl-5 text-xs font-normal text-slate-600 dark:text-slate-300"
                      >
                        <li>
                          <Link
                            href="/gestion/tickets?type=BUG"
                            className={cn(
                              'block rounded-md px-3 py-1 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white'
                            )}
                          >
                            BUG
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/gestion/tickets?type=REQ"
                            className={cn(
                              'block rounded-md px-3 py-1 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white'
                            )}
                          >
                            Requêtes
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/gestion/tickets?type=ASSISTANCE"
                            className={cn(
                              'block rounded-md px-3 py-1 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white'
                            )}
                          >
                            Assistance
                          </Link>
                        </li>
                      </ul>
                    )}
                  </li>

                  {/* Lien Contacts au même niveau que les parents */}
                  <li>
                    <Link
                      href="/gestion/contacts"
                      className={cn(
                        'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
                        pathname.startsWith('/gestion/contacts')
                          ? 'bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand-foreground'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                      )}
                    >
                      <Users className="h-4 w-4 opacity-80" />
                      <span>Contacts</span>
                    </Link>
                  </li>
                </Fragment>
              );
            }

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
                    isActive
                      ? 'bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand-foreground'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                  )}
                >
                  {Icon && <Icon className="h-4 w-4 opacity-80" />}
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {(role === 'admin' || role === 'manager' || role === 'director') && (
          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Configuration
            </p>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/config/companies"
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
                    pathname.startsWith('/config/companies')
                      ? 'bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand-foreground'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                  )}
                >
                  <Building2 className="h-4 w-4 opacity-80" />
                  <span>Compagnies</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/config/users"
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
                    pathname.startsWith('/config/users')
                      ? 'bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand-foreground'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                  )}
                >
                  <Users className="h-4 w-4 opacity-80" />
                  <span>Utilisateurs</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/config/modules"
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
                    pathname.startsWith('/config/modules')
                      ? 'bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand-foreground'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                  )}
                >
                  <Boxes className="h-4 w-4 opacity-80" />
                  <span>Modules</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/config/submodules"
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
                    pathname.startsWith('/config/submodules')
                      ? 'bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand-foreground'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                  )}
                >
                  <Puzzle className="h-4 w-4 opacity-80" />
                  <span>Sous-modules</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/config/features"
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
                    pathname.startsWith('/config/features')
                      ? 'bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand-foreground'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                  )}
                >
                  <Sparkles className="h-4 w-4 opacity-80" />
                  <span>Fonctionnalités</span>
                </Link>
              </li>
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
};

