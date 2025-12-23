'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Badge } from '@/ui/badge';
import { RefreshCw, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import type { JiraSyncStats } from '@/services/jira/sync-stats';
import type { VariantProps } from 'class-variance-authority';
import { badgeVariants } from '@/ui/badge';

type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];

type SyncStatsCardsProps = {
  stats: JiraSyncStats;
};

function formatDate(dateString: string | null): string {
  if (!dateString) return 'Jamais';
  const date = new Date(dateString);
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SyncStatsCards({ stats }: SyncStatsCardsProps) {
  const cards = [
    {
      title: 'Total synchronisés',
      value: stats.totalSyncedTickets,
      icon: RefreshCw,
      description: 'Tickets liés à JIRA',
      variant: 'default' as const,
    },
    {
      title: 'Aujourd&apos;hui',
      value: stats.syncedToday,
      icon: Clock,
      description: 'Synchronisations du jour',
      variant: 'info' as const,
    },
    {
      title: 'Cette semaine',
      value: stats.syncedThisWeek,
      icon: CheckCircle2,
      description: '7 derniers jours',
      variant: 'success' as const,
    },
    {
      title: 'Erreurs',
      value: stats.syncErrors,
      icon: AlertTriangle,
      description: 'Tickets en erreur',
      variant: (stats.syncErrors > 0 ? 'danger' : 'success') as BadgeVariant,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{card.value}</div>
              <Badge variant={card.variant}>{card.description}</Badge>
            </div>
          </CardContent>
        </Card>
      ))}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Dernière synchronisation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold">
            {formatDate(stats.lastSyncTime)}
          </p>
          <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
            <span>
              <strong>{stats.ticketsByOrigin.supabase}</strong> depuis Supabase
            </span>
            <span>
              <strong>{stats.ticketsByOrigin.jira}</strong> depuis JIRA
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

