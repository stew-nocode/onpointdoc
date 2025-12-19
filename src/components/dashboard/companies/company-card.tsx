'use client';

import { Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Badge } from '@/ui/badge';
import { cn } from '@/lib/utils';

export type CompanyCardProps = {
  name: string;
  isActive: boolean;
  moduleLabels: string[];
  totalTickets: number;
  assistanceCount: number;
  assistanceHours: number;
  bugsReported: number; // placeholder (sera branché plus tard)
  className?: string;
};

export function CompanyCard({
  name,
  isActive,
  moduleLabels,
  totalTickets,
  assistanceCount,
  assistanceHours,
  bugsReported,
  className,
}: CompanyCardProps) {
  const primaryModules = moduleLabels.slice(0, 2);
  const moreModules = Math.max(0, moduleLabels.length - primaryModules.length);

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
            <div className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
              <Building2 className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-[10px] font-normal text-slate-900 dark:text-slate-100 truncate">
                {name}
              </CardTitle>
              <div className="mt-0 flex items-center gap-0.5">
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full ring-1',
                    isActive
                      ? 'bg-emerald-500 ring-emerald-600/30 dark:bg-emerald-400 dark:ring-emerald-300/30'
                      : 'bg-slate-300 ring-slate-400/30 dark:bg-slate-600 dark:ring-slate-500/30'
                  )}
                  aria-label={isActive ? 'Actif' : 'Inactif'}
                  title={isActive ? 'Actif' : 'Inactif'}
                />
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {isActive ? 'actif' : 'inactif'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-nowrap justify-end gap-1 overflow-hidden">
            {primaryModules.map((label) => (
              <Badge
                key={label}
                variant="default"
                className="h-5 px-1.5 text-[9px] leading-none max-w-[140px] truncate"
                title={label}
              >
                {label}
              </Badge>
            ))}
            {moreModules > 0 && (
              <Badge variant="default" className="h-5 px-1.5 text-[9px] leading-none">
                +{moreModules}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <Metric label="Total tickets" value={totalTickets.toLocaleString('fr-FR')} />
          <Metric label="Assistances" value={assistanceCount.toLocaleString('fr-FR')} />
          <Metric label="Temps assistance" value={`${assistanceHours.toFixed(1)}h`} />
          <Metric label="BUGs signalés" value={bugsReported.toLocaleString('fr-FR')} />
        </div>
      </CardContent>
    </Card>
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


