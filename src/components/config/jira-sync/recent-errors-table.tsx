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
import { AlertTriangle, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import type { SyncError } from '@/services/jira/sync-stats';

type RecentErrorsTableProps = {
  errors: SyncError[];
};

function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
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

export function RecentErrorsTable({ errors }: RecentErrorsTableProps) {
  if (errors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-status-success" />
            Erreurs de synchronisation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Aucune erreur de synchronisation récente.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-status-danger" />
          Erreurs de synchronisation ({errors.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader className="[&_tr]:border-b [&_tr]:border-slate-200 dark:[&_tr]:border-slate-800">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-[10px] font-medium uppercase tracking-normal text-slate-500 dark:text-slate-400 pb-2">Ticket</TableHead>
              <TableHead className="text-[10px] font-medium uppercase tracking-normal text-slate-500 dark:text-slate-400 pb-2">Clé JIRA</TableHead>
              <TableHead className="text-[10px] font-medium uppercase tracking-normal text-slate-500 dark:text-slate-400 pb-2">Erreur</TableHead>
              <TableHead className="text-[10px] font-medium uppercase tracking-normal text-slate-500 dark:text-slate-400 pb-2">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {errors.map((error) => (
              <TableRow key={error.ticketId} className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <TableCell className="py-2.5 pr-4">
                  <Link
                    href={`/gestion/tickets/${error.ticketId}`}
                    className="flex items-center gap-1 text-xs font-medium text-slate-900 dark:text-slate-100 hover:text-brand dark:hover:text-status-info"
                  >
                    {truncateText(error.ticketTitle ?? 'Sans titre', 30)}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </TableCell>
                <TableCell className="py-2.5 pr-4">
                  {error.jiraIssueKey ? (
                    <Badge variant="outline" className="text-[10px] px-2 py-0.5">{error.jiraIssueKey}</Badge>
                  ) : (
                    <span className="text-xs text-slate-400">-</span>
                  )}
                </TableCell>
                <TableCell className="py-2.5 pr-4">
                  <Badge variant="danger" className="text-[10px] px-2 py-0.5">
                    {truncateText(error.error, 50)}
                  </Badge>
                </TableCell>
                <TableCell className="py-2.5 pr-4 text-xs text-slate-600 dark:text-slate-300">
                  {formatDate(error.lastSyncedAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

