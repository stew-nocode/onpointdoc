'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { mainNav } from '@/lib/constants/navigation';
import { cn } from '@/lib/utils';

type SidebarProps = {
  role?: 'agent' | 'manager' | 'it' | 'marketing' | 'direction';
};

export const Sidebar = ({ role = 'agent' }: SidebarProps) => {
  const pathname = usePathname();
  const items = mainNav.filter((item) => item.roles.includes(role));

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

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition',
                    isActive
                      ? 'bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand-foreground'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                  )}
                >
                  {item.label}
                </Link>

                {isTickets && (
                  <ul className="mt-1 space-y-1 pl-5 text-xs font-normal text-slate-600 dark:text-slate-300">
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
            );
          })}
        </ul>
      </div>
    </aside>
  );
};

