'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type TicketNavigationLinkProps = {
  href: string;
  disabled: boolean;
  direction: 'previous' | 'next';
  ariaLabel: string;
};

export function TicketNavigationLink({
  href,
  disabled,
  direction,
  ariaLabel
}: TicketNavigationLinkProps) {
  const Icon = direction === 'previous' ? ChevronLeft : ChevronRight;

  if (disabled) {
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-md text-sm font-medium h-10 w-10',
          'opacity-50 cursor-not-allowed text-slate-400'
        )}
        aria-label={ariaLabel}
        aria-disabled={true}
      >
        <Icon className="h-5 w-5" />
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center justify-center rounded-md text-sm font-medium h-10 w-10',
        'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100'
      )}
      aria-label={ariaLabel}
    >
      <Icon className="h-5 w-5" />
    </Link>
  );
}


