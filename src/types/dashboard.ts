/**
 * Types pour le dashboard CEO/DAF
 */

export type Period = 'week' | 'month' | 'quarter' | 'year';

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
    productName: string;
    bugCount: number;
    bugRate: number;
    trend: number;
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

