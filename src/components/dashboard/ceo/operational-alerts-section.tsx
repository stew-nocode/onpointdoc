'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Badge } from '@/ui/badge';
import type { OperationalAlert } from '@/types/dashboard';
import { AlertCircle, Clock, UserX, Calendar, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';

type OperationalAlertsSectionProps = {
  alerts: OperationalAlert[];
};

/**
 * Section des alertes opérationnelles
 * 
 * @param alerts - Liste des alertes critiques
 */
export function OperationalAlertsSection({ alerts }: OperationalAlertsSectionProps) {
  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Alertes Opérationnelles</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">Aucune alerte</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Alertes Opérationnelles</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <AlertItem key={alert.id} alert={alert} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Item d'alerte
 */
function AlertItem({ alert }: { alert: OperationalAlert }) {
  const Icon = getAlertIcon(alert.type);
  const priorityColor = getPriorityColor(alert.priority);

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border',
        'border-slate-200 dark:border-slate-700',
        'hover:bg-slate-50 dark:hover:bg-slate-900'
      )}
    >
      <Icon className={cn('h-5 w-5 mt-0.5', priorityColor)} />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="text-sm font-medium">{alert.title}</h4>
          <Badge variant={alert.priority === 'high' ? 'danger' : 'outline'} className="text-xs">
            {alert.priority}
          </Badge>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">{alert.description}</p>
      </div>
    </div>
  );
}

/**
 * Retourne l'icône selon le type d'alerte
 */
function getAlertIcon(type: OperationalAlert['type']) {
  switch (type) {
    case 'overdue_critical':
      return Clock;
    case 'unassigned_long':
      return UserX;
    case 'upcoming_activity':
      return Calendar;
    case 'blocked_task':
      return Ban;
    default:
      return AlertCircle;
  }
}

/**
 * Retourne la couleur selon la priorité
 */
function getPriorityColor(priority: OperationalAlert['priority']): string {
  switch (priority) {
    case 'high':
      return 'text-red-600 dark:text-red-400';
    case 'medium':
      return 'text-orange-600 dark:text-orange-400';
    case 'low':
      return 'text-blue-600 dark:text-blue-400';
  }
}

