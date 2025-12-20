'use client';

import { useCallback } from 'react';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AgentSupportCard } from './agent-support-card';
import type { SupportAgentsStats } from '@/services/dashboard/support-agents-stats';
import { Button } from '@/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useDragScroll } from '@/components/dashboard/hooks/use-drag-scroll';

type AgentsSupportCardsProps = {
  data?: SupportAgentsStats | null;
  className?: string;
};

/**
 * Widget wrapper: cartes agents Support (exemple Edwige).
 * La data sera branchée plus tard (services dashboard).
 */
export function AgentsSupportCards({ data, className }: AgentsSupportCardsProps) {
  const { ref: rowRef, props: dragProps, isDragging } = useDragScroll<HTMLDivElement>({ speed: 1 });

  const avatarSvg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#14B8A6"/>
          <stop offset="1" stop-color="#3B82F6"/>
        </linearGradient>
      </defs>
      <rect width="72" height="72" rx="36" fill="url(#g)"/>
      <circle cx="36" cy="28" r="12" fill="rgba(255,255,255,0.85)"/>
      <path d="M14 62c4-12 16-18 22-18s18 6 22 18" fill="rgba(255,255,255,0.85)"/>
    </svg>`
  );
  const avatarUrl = `data:image/svg+xml;charset=utf-8,${avatarSvg}`;

  const agents = data?.data ?? [];

  const scrollByCards = useCallback((direction: 'left' | 'right') => {
    const el = rowRef.current;
    if (!el) return;
    const delta = direction === 'left' ? -480 : 480; // ~ 460px card + gap
    el.scrollBy({ left: delta, behavior: 'smooth' });
  }, [rowRef]);

  return (
    <div className={cn('h-full w-full', className)}>
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 px-1 pb-2">
          <Users className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Agents Support
          </span>
        </div>

        <div className="relative w-full overflow-x-hidden">
          {/* Bouton gauche */}
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

          {/* Bouton droit */}
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
            {agents.map((agent) => (
              <AgentSupportCard
                key={agent.profileId}
                name={agent.fullName}
                statusLabel="En ligne"
                workloadLabel=""
                scopeLabels={agent.moduleNames}
                totalTicketsCount={agent.totalTicketsCount}
                assistanceHours={agent.assistanceHours}
                inProgressCount={agent.inProgressCount}
                mttrHours={null}
                avatarUrl={avatarUrl}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


