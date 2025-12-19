/**
 * Types pour les métriques de performance du département Support
 */

import type { Period } from './dashboard';

/**
 * Métriques de performance d'un agent Support
 */
export type SupportAgentMetrics = {
  agentId: string;
  agentName: string;
  period: {
    start: string; // ISO date
    end: string; // ISO date
  };
  metrics: {
    // Volume de tickets
    ticketsResolved: number;
    ticketsAssigned: number;
    ticketsActive: number;
    ticketsOverdue: number;
    
    // Temps de résolution
    mttr: number; // en jours
    averageFirstResponseTime?: number; // en heures (futur)
    
    // Taux de performance
    resolutionRate: number; // (résolus / assignés) * 100
    
    // Répartition par type
    byType: {
      BUG: {
        resolved: number;
        mttr: number;
      };
      REQ: {
        resolved: number;
        mttr: number;
      };
      ASSISTANCE: {
        resolved: number;
        mttr: number;
      };
    };
  };
  
  // Tendance vs période précédente
  trend: {
    ticketsResolvedTrend: number; // %
    mttrTrend: number; // % (négatif = amélioration)
    resolutionRateTrend: number; // %
  };
  
  // Évolution temporelle (7/30 jours)
  evolution: {
    date: string; // ISO date
    resolved: number;
    mttr: number;
  }[];
};

/**
 * Métriques globales de l'équipe Support
 */
export type SupportTeamPerformance = {
  department: 'support';
  period: Period;
  periodStart: string; // ISO date
  periodEnd: string; // ISO date
  
  // Métriques globales équipe
  teamMetrics: {
    totalResolved: number;
    totalAssigned: number;
    totalActive: number;
    totalOverdue: number;
    averageMTTR: number;
    averageResolutionRate: number;
    
    // Par type de ticket
    byType: {
      BUG: { resolved: number; averageMTTR: number };
      REQ: { resolved: number; averageMTTR: number };
      ASSISTANCE: { resolved: number; averageMTTR: number };
    };
  };
  
  // Métriques par agent
  agents: SupportAgentMetrics[];
  
  // Tendance équipe vs période précédente
  teamTrend: {
    totalResolvedTrend: number;
    averageMTTRTrend: number;
    averageResolutionRateTrend: number;
  };
  
  // Évolution temporelle équipe
  teamEvolution: {
    date: string;
    resolved: number;
    mttr: number;
    active: number;
  }[];
};


