'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks';
import { Button } from '@/ui/button';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/ui/alert';
import {
  SyncStatsCards,
  RecentErrorsTable,
  RecentSyncsTable,
  SyncTrendsChart,
} from '@/components/config/jira-sync';
import type { JiraSyncStats, SyncError, RecentSync } from '@/services/jira/sync-stats';

type DashboardData = {
  stats: JiraSyncStats;
  errors: SyncError[];
  recentSyncs: RecentSync[];
};

const ALLOWED_ROLES = ['admin', 'manager', 'director'];

export function JiraSyncDashboard() {
  const { role, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/jira/sync-stats');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur ${response.status}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && role && ALLOWED_ROLES.includes(role)) {
      fetchData();
    }
  }, [authLoading, role, fetchData]);

  // Vérification des autorisations
  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!role || !ALLOWED_ROLES.includes(role)) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Accès refusé</AlertTitle>
        <AlertDescription>
          Cette page est réservée aux administrateurs, managers et directeurs.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erreur</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={fetchData}
          disabled={isLoading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Stats Cards */}
      <SyncStatsCards stats={data.stats} />

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Erreurs */}
        <RecentErrorsTable errors={data.errors} />

        {/* Graphique des statuts */}
        <SyncTrendsChart stats={data.stats} />
      </div>

      {/* Synchronisations récentes */}
      <RecentSyncsTable syncs={data.recentSyncs} />
    </div>
  );
}

