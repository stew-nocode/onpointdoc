'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/table';
import { Badge } from '@/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { CheckCircle2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import type { RecentSync } from '@/services/jira/sync-stats';

type RecentSyncsTableProps = {
  syncs: RecentSync[];
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

function getOriginVariant(origin: string | null): 'info' | 'warning' {
  return origin === 'jira' ? 'warning' : 'info';
}

function getOriginLabel(origin: string | null): string {
  if (origin === 'jira') return 'JIRA → Supabase';
  return 'Supabase → JIRA';
}

export function RecentSyncsTable({ syncs }: RecentSyncsTableProps) {
  if (syncs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
            Synchronisations récentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Aucune synchronisation récente.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-status-success" />
          Synchronisations récentes ({syncs.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader className="[&_tr]:border-b [&_tr]:border-slate-200 dark:[&_tr]:border-slate-800">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-[10px] font-medium uppercase tracking-normal text-slate-500 dark:text-slate-400 pb-2">Ticket</TableHead>
              <TableHead className="text-[10px] font-medium uppercase tracking-normal text-slate-500 dark:text-slate-400 pb-2">Clé JIRA</TableHead>
              <TableHead className="text-[10px] font-medium uppercase tracking-normal text-slate-500 dark:text-slate-400 pb-2">Direction</TableHead>
              <TableHead className="text-[10px] font-medium uppercase tracking-normal text-slate-500 dark:text-slate-400 pb-2">Statut JIRA</TableHead>
              <TableHead className="text-[10px] font-medium uppercase tracking-normal text-slate-500 dark:text-slate-400 pb-2">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {syncs.map((sync) => (
              <TableRow key={sync.ticketId} className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <TableCell className="py-2.5 pr-4">
                  <Link
                    href={`/gestion/tickets/${sync.ticketId}`}
                    className="flex items-center gap-1 text-xs font-medium text-slate-900 dark:text-slate-100 hover:text-brand dark:hover:text-status-info"
                  >
                    {truncateText(sync.ticketTitle ?? 'Sans titre', 30)}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </TableCell>
                <TableCell className="py-2.5 pr-4">
                  {sync.jiraIssueKey ? (
                    <Badge variant="outline" className="text-[10px] px-2 py-0.5">{sync.jiraIssueKey}</Badge>
                  ) : (
                    <span className="text-xs text-slate-400">-</span>
                  )}
                </TableCell>
                <TableCell className="py-2.5 pr-4">
                  <Badge variant={getOriginVariant(sync.origin)} className="text-[10px] px-2 py-0.5">
                    {getOriginLabel(sync.origin)}
                  </Badge>
                </TableCell>
                <TableCell className="py-2.5 pr-4">
                  {sync.jiraStatus ? (
                    <Badge variant="default" className="text-[10px] px-2 py-0.5">{sync.jiraStatus}</Badge>
                  ) : (
                    <span className="text-xs text-slate-400">-</span>
                  )}
                </TableCell>
                <TableCell className="py-2.5 pr-4 text-xs text-slate-600 dark:text-slate-300">
                  {formatDate(sync.lastSyncedAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

