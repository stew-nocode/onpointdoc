import type { OperationalAlert, DashboardRole } from '@/types/dashboard';

/**
 * Filtre les alertes opérationnelles selon le rôle de l'utilisateur
 * 
 * @param alerts - Liste complète des alertes
 * @param role - Rôle de l'utilisateur
 * @returns Alertes filtrées selon le rôle
 */
export function filterAlertsByRole(
  alerts: OperationalAlert[],
  role: DashboardRole
): OperationalAlert[] {
  switch (role) {
    case 'direction':
      // Direction voit toutes les alertes (triées par priorité)
      return alerts.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

    case 'manager':
      // Manager voit les alertes de son équipe (exclure les personnelles bas niveau)
      return alerts
        .filter((alert) => alert.priority !== 'low' || alert.type !== 'upcoming_activity')
        .sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

    case 'agent':
      // Agent voit uniquement ses alertes personnelles et celles qui le concernent
      return alerts
        .filter((alert) => {
          // Priorité haute toujours visible
          if (alert.priority === 'high') return true;
          // Alertes personnelles (tâches bloquées, activités à venir)
          if (alert.type === 'blocked_task' || alert.type === 'upcoming_activity') return true;
          // Tickets qui lui sont assignés (nécessite relation avec relatedId)
          // Pour l'instant, on garde les alertes de priorité medium+
          return alert.priority === 'medium';
        })
        .sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

    default:
      return alerts;
  }
}


