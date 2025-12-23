'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ACTIVE_GRADIENT, INACTIVE_HOVER_STYLES } from '@/lib/constants/gradient-styles';
import {
  Building2,
  Users,
  Boxes,
  Puzzle,
  Sparkles,
  Building,
  RefreshCw
} from 'lucide-react';

type ConfigurationMenuProps = {
  role: 'agent' | 'manager' | 'it' | 'marketing' | 'direction' | 'director' | 'admin';
  onLinkClick: () => void;
};

/**
 * Menu de configuration (réservé aux managers/admin/director)
 *
 * Affiche les liens vers les pages de configuration
 */
export function ConfigurationMenu({ role, onLinkClick }: ConfigurationMenuProps) {
  const pathname = usePathname();

  if (role !== 'admin' && role !== 'manager' && role !== 'director') {
    return null;
  }

  return (
    <div className="mt-8">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
        Configuration
      </p>
      <ul className="mt-3 space-y-2">
        <li>
          <Link
            href="/config/companies"
            onClick={onLinkClick}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
              pathname.startsWith('/config/companies')
                ? ACTIVE_GRADIENT
                : INACTIVE_HOVER_STYLES
            )}
          >
            <Building2 className="h-4 w-4 opacity-80" />
            <span>Compagnies</span>
          </Link>
        </li>
        <li>
          <Link
            href="/config/users"
            onClick={onLinkClick}
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
            onClick={onLinkClick}
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
            onClick={onLinkClick}
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
            onClick={onLinkClick}
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
        <li>
          <Link
            href="/config/departments"
            onClick={onLinkClick}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
              pathname.startsWith('/config/departments')
                ? 'bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand-foreground'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
            )}
          >
            <Building className="h-4 w-4 opacity-80" />
            <span>Départements</span>
          </Link>
        </li>
        <li>
          <Link
            href="/config/jira-sync"
            onClick={onLinkClick}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
              pathname.startsWith('/config/jira-sync')
                ? 'bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand-foreground'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
            )}
          >
            <RefreshCw className="h-4 w-4 opacity-80" />
            <span>Sync JIRA</span>
          </Link>
        </li>
        {role === 'admin' && (
          <li>
            <Link
              href="/config/dashboard"
              onClick={onLinkClick}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
                pathname.startsWith('/config/dashboard')
                  ? 'bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand-foreground'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
              )}
            >
              <Sparkles className="h-4 w-4 opacity-80" />
              <span>Dashboard</span>
            </Link>
          </li>
        )}
      </ul>
    </div>
  );
}


