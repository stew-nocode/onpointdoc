'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment } from 'react';
import { cn } from '@/lib/utils';
import { mainNav } from '@/lib/constants/navigation';
import { ACTIVE_GRADIENT, INACTIVE_HOVER_STYLES } from '@/lib/constants/gradient-styles';
import {
  LayoutDashboard,
  Ticket,
  CalendarDays,
  ListChecks,
  Users
} from 'lucide-react';
import { TicketsSubmenu } from './tickets-submenu';

type NavigationMenuProps = {
  role: 'agent' | 'manager' | 'it' | 'marketing' | 'direction' | 'director' | 'admin';
  ticketsOpen: boolean;
  onTicketsToggle: () => void;
  onLinkClick: () => void;
};

/**
 * Menu de navigation principal
 *
 * Affiche les items de navigation selon le rôle de l'utilisateur
 */
export function NavigationMenu({
  role,
  ticketsOpen,
  onTicketsToggle,
  onLinkClick
}: NavigationMenuProps) {
  const pathname = usePathname();
  const roleKey = role === 'director' ? 'direction' : role;
  const items =
    role === 'admin' || role === 'director'
      ? mainNav
      : mainNav.filter((item) => item.roles.includes(roleKey as any));

  return (
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
                    'flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                    activeTickets
                      ? ACTIVE_GRADIENT
                      : INACTIVE_HOVER_STYLES
                  )}
                >
                  <Link
                    href={item.href}
                    onClick={onLinkClick}
                    className="flex-1 inline-flex items-center gap-2"
                  >
                    {Icon && <Icon className="h-4 w-4 opacity-80" />}
                    <span>{item.label}</span>
                  </Link>
                  <button
                    type="button"
                    aria-expanded={ticketsOpen}
                    aria-controls="submenu-tickets"
                    onClick={onTicketsToggle}
                    className="ml-2 rounded-md px-2 py-1 text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    {ticketsOpen ? '▾' : '▸'}
                  </button>
                </div>
              </li>

              <TicketsSubmenu isOpen={ticketsOpen} onLinkClick={onLinkClick} />

              <li>
                <Link
                  href="/gestion/contacts"
                  onClick={onLinkClick}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                    pathname.startsWith('/gestion/contacts')
                      ? ACTIVE_GRADIENT
                      : INACTIVE_HOVER_STYLES
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
              onClick={onLinkClick}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                isActive
                  ? ACTIVE_GRADIENT
                  : INACTIVE_HOVER_STYLES
              )}
            >
              {Icon && <Icon className="h-4 w-4 opacity-80" />}
              <span>{item.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

