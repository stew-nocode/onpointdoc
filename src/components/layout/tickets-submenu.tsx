'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

type TicketsSubmenuProps = {
  isOpen: boolean;
  onLinkClick: () => void;
};

/**
 * Sous-menu pour les tickets (BUG, REQ, ASSISTANCE)
 *
 * @param isOpen - Si le sous-menu est ouvert
 * @param onLinkClick - Callback appelé lors du clic sur un lien
 */
export function TicketsSubmenu({ isOpen, onLinkClick }: TicketsSubmenuProps) {
  if (!isOpen) return null;

  return (
    <ul id="submenu-tickets" className="mt-1 space-y-1 pl-5 text-xs font-normal text-slate-600 dark:text-slate-300">
      <li>
        <Link
          href="/gestion/tickets?type=BUG"
          onClick={onLinkClick}
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
          onClick={onLinkClick}
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
          onClick={onLinkClick}
          className={cn(
            'block rounded-md px-3 py-1 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white'
          )}
        >
          Assistance
        </Link>
      </li>
    </ul>
  );
}

