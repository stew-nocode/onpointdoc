import type { DashboardRole, DashboardConfig } from '@/types/dashboard';

/**
 * Retourne la configuration par défaut du dashboard selon le rôle
 * 
 * Ces valeurs sont utilisées si aucune configuration custom n'existe en DB
 * 
 * @param role - Rôle de l'utilisateur
 * @param teamId - ID de l'équipe (pour les managers)
 * @param agentId - ID de l'agent (pour les agents)
 * @returns Configuration par défaut
 */
export function getDefaultDashboardConfig(
  role: DashboardRole,
  teamId?: string,
  agentId?: string
): DashboardConfig {
  switch (role) {
    case 'direction':
      return {
        role: 'direction',
        visibleSections: {
          strategicKPIs: true, // KPIs stratégiques globaux
          teamKPIs: false,
          personalKPIs: false,
          strategicCharts: true, // Graphiques stratégiques globaux
          teamCharts: true, // Direction voit aussi les équipes
          personalCharts: false,
          strategicTables: true, // Tables stratégiques globales
          teamTables: true, // Direction voit aussi les équipes
          alerts: true, // Toutes les alertes
        },
        filters: {
          scope: 'global',
        },
      };

    case 'manager':
      return {
        role: 'manager',
        visibleSections: {
          strategicKPIs: false,
          teamKPIs: true, // KPIs de l'équipe
          personalKPIs: false,
          strategicCharts: false,
          teamCharts: true, // Graphiques de l'équipe
          personalCharts: false,
          strategicTables: false,
          teamTables: true, // Tables de l'équipe
          alerts: true, // Alertes de l'équipe
        },
        filters: {
          scope: 'team',
          teamId,
        },
      };

    case 'agent':
      return {
        role: 'agent',
        visibleSections: {
          strategicKPIs: false,
          teamKPIs: false,
          personalKPIs: true, // KPIs personnels
          strategicCharts: false,
          teamCharts: false,
          personalCharts: true, // Graphiques personnels
          strategicTables: false,
          teamTables: false,
          alerts: true, // Alertes personnelles
        },
        filters: {
          scope: 'personal',
          agentId,
        },
      };

    case 'admin':
      // Admin : accès complet par défaut (comme direction mais avec toutes les sections)
      return {
        role: 'admin',
        visibleSections: {
          strategicKPIs: true, // KPIs stratégiques globaux
          teamKPIs: true, // KPIs équipe (pour tester)
          personalKPIs: true, // KPIs personnels (pour tester)
          strategicCharts: true, // Graphiques stratégiques globaux
          teamCharts: true, // Graphiques équipe
          personalCharts: true, // Graphiques personnels (pour tester)
          strategicTables: true, // Tables stratégiques globales
          teamTables: true, // Tables équipe
          alerts: true, // Toutes les alertes
        },
        filters: {
          scope: 'global', // Admin voit tout
        },
      };

    default:
      // Fallback : agent par défaut
      return {
        role: 'agent',
        visibleSections: {
          strategicKPIs: false,
          teamKPIs: false,
          personalKPIs: true,
          strategicCharts: false,
          teamCharts: false,
          personalCharts: true,
          strategicTables: false,
          teamTables: false,
          alerts: true,
        },
        filters: {
          scope: 'personal',
          agentId,
        },
      };
  }
}

