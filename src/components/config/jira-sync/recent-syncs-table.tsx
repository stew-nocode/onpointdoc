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
          <TableHeader>
            <TableRow>
              <TableHead>Ticket</TableHead>
              <TableHead>Clé JIRA</TableHead>
              <TableHead>Direction</TableHead>
              <TableHead>Statut JIRA</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {syncs.map((sync) => (
              <TableRow key={sync.ticketId}>
                <TableCell>
                  <Link
                    href={`/gestion/tickets/${sync.ticketId}`}
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    {truncateText(sync.ticketTitle ?? 'Sans titre', 30)}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </TableCell>
                <TableCell>
                  {sync.jiraIssueKey ? (
                    <Badge variant="outline">{sync.jiraIssueKey}</Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={getOriginVariant(sync.origin)}>
                    {getOriginLabel(sync.origin)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {sync.jiraStatus ? (
                    <Badge variant="default">{sync.jiraStatus}</Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
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

