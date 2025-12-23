'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { BarChart3 } from 'lucide-react';
import type { JiraSyncStats } from '@/services/jira/sync-stats';

type SyncTrendsChartProps = {
  stats: JiraSyncStats;
};

export function SyncTrendsChart({ stats }: SyncTrendsChartProps) {
  const maxCount = Math.max(
    ...stats.ticketsByStatus.map((s) => s.count),
    1
  );

  if (stats.ticketsByStatus.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Tickets par statut JIRA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Aucune donnée de statut disponible.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Tickets par statut JIRA
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stats.ticketsByStatus.slice(0, 8).map((item) => (
            <div key={item.status} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{item.status}</span>
                <span className="text-muted-foreground">{item.count}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary transition-all"
                  style={{ width: `${(item.count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

