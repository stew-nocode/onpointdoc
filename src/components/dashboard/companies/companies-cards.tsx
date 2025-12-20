'use client';

import { useCallback } from 'react';
import { ChevronLeft, ChevronRight, Building2 } from 'lucide-react';
import { Button } from '@/ui/button';
import { cn } from '@/lib/utils';
import { CompanyCard } from './company-card';
import type { CompaniesCardsStats } from '@/services/dashboard/companies-cards-stats';
import { useDragScroll } from '@/components/dashboard/hooks/use-drag-scroll';

type CompaniesCardsProps = {
  data?: CompaniesCardsStats | null;
  className?: string;
};

/**
 * Widget wrapper: cartes Entreprises (mock pour l'instant).
 * La data sera branchée plus tard (services dashboard).
 */
export function CompaniesCards({ data, className }: CompaniesCardsProps) {
  const { ref: rowRef, props: dragProps, isDragging } = useDragScroll<HTMLDivElement>({ speed: 1 });

  const scrollByCards = useCallback((direction: 'left' | 'right') => {
    const el = rowRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === 'left' ? -480 : 480, behavior: 'smooth' });
  }, [rowRef]);

  const companies = data?.data ?? [];

  return (
    <div className={cn('h-full w-full', className)}>
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 px-1 pb-2">
          <Building2 className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Entreprises
          </span>
        </div>

        <div className="relative w-full overflow-x-hidden">
          {companies.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              Aucune entreprise sur cette période
            </div>
          ) : (
            <>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={() => scrollByCards('left')}
            className={cn(
              'absolute left-0 top-1/2 -translate-y-1/2 z-10',
              'h-8 w-8 rounded-full shadow-sm',
              'bg-white/90 hover:bg-white dark:bg-slate-900/90 dark:hover:bg-slate-900',
              'border border-slate-200 dark:border-slate-800'
            )}
            aria-label="Faire défiler à gauche"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={() => scrollByCards('right')}
            className={cn(
              'absolute right-0 top-1/2 -translate-y-1/2 z-10',
              'h-8 w-8 rounded-full shadow-sm',
              'bg-white/90 hover:bg-white dark:bg-slate-900/90 dark:hover:bg-slate-900',
              'border border-slate-200 dark:border-slate-800'
            )}
            aria-label="Faire défiler à droite"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <div
            ref={rowRef}
            {...dragProps}
            className={cn(
              'agent-cards-row custom-scrollbar px-10 select-none',
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            )}
            style={{ touchAction: 'pan-y' }}
          >
            {companies.map((c) => (
              <CompanyCard
                key={c.companyId}
                name={c.companyName}
                isActive={c.isActive}
                moduleLabels={c.moduleNames}
                totalTickets={c.totalTickets}
                assistanceCount={c.assistanceCount}
                assistanceHours={c.assistanceHours}
                bugsReported={c.bugsReported}
              />
            ))}
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


