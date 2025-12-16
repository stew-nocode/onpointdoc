/**
 * Types pour le dashboard unifié (Direction, Manager, Agent)
 */

export type Period = 'week' | 'month' | 'quarter' | 'year';

/**
 * Rôle pour le dashboard (simplifié)
 */
export type DashboardRole = 'direction' | 'manager' | 'agent' | 'admin';

/**
 * Clés des sections du dashboard
 */
export type DashboardSectionKey =
  | 'strategicKPIs'
  | 'teamKPIs'
  | 'personalKPIs'
  | 'strategicCharts'
  | 'teamCharts'
  | 'personalCharts'
  | 'strategicTables'
  | 'teamTables'
  | 'alerts';

/**
 * Configuration de visibilité des sections par rôle
 */
export type DashboardConfig = {
  role: DashboardRole;
  visibleSections: {
    strategicKPIs: boolean;
    teamKPIs: boolean;
    personalKPIs: boolean;
    strategicCharts: boolean;
    teamCharts: boolean;
    personalCharts: boolean;
    strategicTables: boolean;
    teamTables: boolean;
    alerts: boolean;
  };
  filters: {
    scope: 'global' | 'team' | 'personal';
    teamId?: string;
    agentId?: string;
  };
};

/**
 * Configuration stockée en base de données
 */
export type DashboardConfigurationDB = {
  id: string;
  role: DashboardRole;
  sections: Record<DashboardSectionKey, boolean>;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
};

/**
 * Configuration pour l'API (input/output)
 */
export type DashboardConfigurationInput = {
  role: DashboardRole;
  sections: Partial<Record<DashboardSectionKey, boolean>>;
};

/**
 * Configuration complète avec métadonnées
 */
export type DashboardConfigurationWithMeta = {
  role: DashboardRole;
  sections: Record<DashboardSectionKey, boolean>;
  updatedAt: string;
  updatedBy: string | null;
};

export type MTTRData = {
  global: number; // En jours
  byProduct: {
    productId: string;
    productName: string;
    mttr: number;
  }[];
  byType: {
    type: 'BUG' | 'REQ' | 'ASSISTANCE';
    mttr: number;
  }[];
  trend: number; // Pourcentage vs période précédente
};

export type TicketFluxData = {
  opened: number;
  resolved: number;
  resolutionRate: number; // Pourcentage
  byProduct: {
    productId: string;
    productName: string;
    opened: number;
    resolved: number;
  }[];
  trend: {
    openedTrend: number;
    resolvedTrend: number;
  };
};

export type WorkloadData = {
  byTeam: {
    team: 'support' | 'it' | 'marketing';
    activeTickets: number;
    resolvedThisPeriod: number;
  }[];
  byAgent: {
    agentId: string;
    agentName: string;
    team: string;
    activeTickets: number;
    resolvedThisPeriod: number;
    workloadPercent: number; // Pourcentage de charge
  }[];
  totalActive: number;
};

export type ProductHealthData = {
  byProduct: {
    productId: string;
    productName: string;
    bugRate: number; // Pourcentage de BUGs / total tickets
    totalTickets: number;
    totalBugs: number;
    healthStatus: 'good' | 'warning' | 'critical';
  }[];
  topBugModules: {
    moduleId: string;
    moduleName: string;
    productName: string; // Gardé pour compatibilité, mais vide dans le nouveau format
    bugCount: number; // Gardé pour compatibilité = bugsSignales
    bugRate: number; // Gardé pour compatibilité = resolutionRate
    trend: number; // Gardé pour compatibilité = trends.bugsSignales
    // Nouvelles métriques
    bugsSignales: number;
    bugsCritiques: number;
    criticalRate: number; // % Critique
    bugsOuverts: number;
    bugsResolus: number;
    resolutionRate: number;
    trends: {
      bugsSignales: number;
      criticalRate: number;
      bugsOuverts: number;
      bugsResolus: number;
      resolutionRate: number;
    };
  }[];
};

export type OperationalAlert = {
  id: string;
  type: 'overdue_critical' | 'unassigned_long' | 'upcoming_activity' | 'blocked_task';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  relatedId?: string; // ID du ticket/activité/tâche
};

/**
 * Données du dashboard CEO/Direction (vue stratégique globale)
 */
export type CEODashboardData = {
  mttr: MTTRData;
  flux: TicketFluxData;
  workload: WorkloadData;
  health: ProductHealthData;
  alerts: OperationalAlert[];
  period: Period;
  periodStart: string;
  periodEnd: string;
};

/**
 * Données du dashboard Manager (vue équipe)
 */
export type TeamDashboardData = {
  teamId: string;
  teamName: string;
  mttr: MTTRData;
  flux: TicketFluxData;
  workload: WorkloadData;
  health: ProductHealthData;
  alerts: OperationalAlert[];
  period: Period;
  periodStart: string;
  periodEnd: string;
};

/**
 * Données du dashboard Agent (vue personnelle)
 */
export type AgentDashboardData = {
  agentId: string;
  agentName: string;
  myTickets: {
    active: number;
    resolved: number;
    pending: number;
  };
  myTasks: {
    todo: number;
    inProgress: number;
    done: number;
    blocked: number;
  };
  myActivities: {
    upcoming: number;
    completed: number;
  };
  alerts: OperationalAlert[];
  period: Period;
  periodStart: string;
  periodEnd: string;
};

// === Types pour KPIs Statiques (temps réel, non filtrés) ===
import type { BugHistoryStats } from '@/services/dashboard/bug-history-stats';

export type { BugHistoryStats };

/**
 * Données unifiées du dashboard (chargées selon le rôle)
 */
export type UnifiedDashboardData = {
  role: DashboardRole;
  strategic?: CEODashboardData; // Direction uniquement
  team?: TeamDashboardData; // Manager uniquement
  personal?: AgentDashboardData; // Agent uniquement
  alerts: OperationalAlert[]; // Tous les rôles (filtrés selon le rôle)
  config?: DashboardConfig; // Configuration de visibilité (chargée depuis DB)
  period: Period;
  periodStart: string;
  periodEnd: string;
  // === KPIs Statiques (temps réel, non filtrés - Admin/Direction) ===
  bugHistoryStats?: BugHistoryStats;
  // reqHistoryStats?: ReqHistoryStats;      // À implémenter
  // assistanceHistoryStats?: AssistanceHistoryStats; // À implémenter
};
