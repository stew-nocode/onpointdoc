'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Badge } from '@/ui/badge';
import { cn } from '@/lib/utils';

export type AgentSupportCardProps = {
  name: string;
  statusLabel: string;
  workloadLabel: string;
  scopeLabels: string[];
  totalTicketsCount: number;
  assistanceHours: number;
  inProgressCount: number;
  /** Placeholder UI: on branchera le calcul plus tard */
  mttrHours: number | null;
  /** Optionnel: photo plus tard. Si absent, on réserve l'espace avec un placeholder. */
  avatarUrl?: string | null;
  className?: string;
};

export function AgentSupportCard({
  name,
  statusLabel,
  workloadLabel,
  scopeLabels,
  totalTicketsCount,
  assistanceHours,
  inProgressCount,
  mttrHours,
  avatarUrl,
  className,
}: AgentSupportCardProps) {
  const primaryScopes = scopeLabels.slice(0, 2);
  const moreScopes = Math.max(0, scopeLabels.length - primaryScopes.length);

  return (
    <Card
      className={cn(
        'h-full w-full border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950',
        'hover:shadow-md transition-shadow',
        className
      )}
    >
      <CardHeader className="pb-1 pt-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex items-start gap-2">
            <AvatarSlot name={name} avatarUrl={avatarUrl} />
            <div className="min-w-0">
              <CardTitle className="text-[10px] font-normal text-slate-900 dark:text-slate-100 truncate">
                {name}
              </CardTitle>
              <div className="mt-0 flex flex-col gap-0">
                <div className="flex items-center gap-0.5">
                  <StatusDot label={statusLabel} />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    en ligne
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-nowrap justify-end gap-1 overflow-hidden">
            {primaryScopes.map((label) => (
              <Badge
                key={label}
                variant="secondary"
                className="h-5 px-1.5 text-[9px] leading-none max-w-[120px] truncate"
                title={label}
              >
                {label}
              </Badge>
            ))}
            {moreScopes > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[9px] leading-none">
                +{moreScopes}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <Metric label="Total tickets" value={totalTicketsCount.toLocaleString('fr-FR')} />
          <Metric label="En cours" value={inProgressCount.toLocaleString('fr-FR')} />
          <Metric label="Temps assistance" value={`${assistanceHours.toFixed(1)}h`} />
          <Metric label="MTTR" value={mttrHours === null ? '—' : `${mttrHours.toFixed(1)}h`} />
        </div>
      </CardContent>
    </Card>
  );
}

function AvatarSlot({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  // Placeholder (initiales) en attendant le branchement des vraies photos.
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  return (
    <div
      className={cn(
        'h-9 w-9 rounded-full flex-shrink-0 overflow-hidden',
        'border border-slate-200 dark:border-slate-800',
        'bg-slate-100 dark:bg-slate-900'
      )}
      title={name}
      aria-label={`Photo de ${name}`}
    >
      {avatarUrl ? (
        // Placeholder image (fictive) — on branchera les vraies photos plus tard.
        <img
          src={avatarUrl}
          alt={`Avatar de ${name}`}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="h-full w-full flex items-center justify-center text-slate-600 dark:text-slate-300">
          <span className="text-[10px] font-semibold">{initials || '—'}</span>
        </div>
      )}
    </div>
  );
}

function StatusDot({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center gap-0.5">
      <span
        className="h-1.5 w-1.5 rounded-full bg-emerald-500 ring-1 ring-emerald-600/30 dark:bg-emerald-400 dark:ring-emerald-300/30"
        title={label}
        aria-label={label}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50 px-2 py-1.5 dark:border-slate-800 dark:bg-slate-900">
      <div className="text-[10px] text-slate-500 dark:text-slate-400">{label}</div>
      <div className="font-mono font-semibold text-slate-900 dark:text-slate-100">{value}</div>
    </div>
  );
}


