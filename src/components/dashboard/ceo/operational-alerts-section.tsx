'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Badge } from '@/ui/badge';
import { ScrollArea } from '@/ui/scroll-area';
import type { OperationalAlert } from '@/types/dashboard';
import { AlertCircle, Clock, UserX, Calendar, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Constantes pour le calcul de la hauteur scrollable
 */
const ALERT_ITEM_HEIGHT = 65; // Hauteur estimée d'un item (padding + contenu) - Réduit
const ITEMS_VISIBLE = 5; // Nombre d'items visibles
const GAP_HEIGHT = 8; // Hauteur du gap entre items (space-y-2) - Réduit

/**
 * Hauteur totale pour afficher exactement 5 items
 */
const SCROLLABLE_HEIGHT = ALERT_ITEM_HEIGHT * ITEMS_VISIBLE + GAP_HEIGHT * (ITEMS_VISIBLE - 1);

import type { Period } from '@/types/dashboard';

type OperationalAlertsSectionProps = {
  alerts: OperationalAlert[];
  period: Period; // Période globale pour cohérence (utilisé par React.memo)
};

/**
 * Section des alertes opérationnelles
 * 
 * @param alerts - Liste des alertes critiques
 */
export function OperationalAlertsSection({ alerts, period: _period }: OperationalAlertsSectionProps) {
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
        <ScrollArea style={{ height: `${SCROLLABLE_HEIGHT}px` }} className="w-full">
          <div className="space-y-2 pr-4">
            {alerts.map((alert) => (
              <AlertItem key={alert.id} alert={alert} />
            ))}
          </div>
        </ScrollArea>
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
        'flex items-start gap-2 p-2 rounded-lg border',
        'border-slate-200 dark:border-slate-700',
        'hover:bg-slate-50 dark:hover:bg-slate-900'
      )}
    >
      <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', priorityColor)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h4 className="text-xs font-medium truncate">{alert.title}</h4>
          <Badge variant={alert.priority === 'high' ? 'danger' : 'outline'} className="text-[10px] px-1.5 py-0 flex-shrink-0">
            {alert.priority.toUpperCase()}
          </Badge>
        </div>
        <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate">{alert.description}</p>
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

