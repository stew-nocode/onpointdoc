import type { DashboardSectionKey, DashboardConfig } from '@/types/dashboard';

/**
 * Convertit visibleSections en sections format DB
 * 
 * @param visibleSections - Sections visibles depuis DashboardConfig
 * @returns Sections au format Record<DashboardSectionKey, boolean>
 */
export function visibleSectionsToSections(
  visibleSections: DashboardConfig['visibleSections']
): Record<DashboardSectionKey, boolean> {
  return {
    strategicKPIs: visibleSections.strategicKPIs,
    teamKPIs: visibleSections.teamKPIs,
    personalKPIs: visibleSections.personalKPIs,
    strategicCharts: visibleSections.strategicCharts,
    teamCharts: visibleSections.teamCharts,
    personalCharts: visibleSections.personalCharts,
    strategicTables: visibleSections.strategicTables,
    teamTables: visibleSections.teamTables,
    alerts: visibleSections.alerts,
  };
}

/**
 * Fusionne les sections avec priorité: nouvelles > existantes > defaults
 * 
 * @param newSections - Nouvelles valeurs (peuvent être partielles)
 * @param existingSections - Sections existantes (optionnel)
 * @param defaultSections - Sections par défaut
 * @returns Sections fusionnées
 */
export function mergeDashboardSections(
  newSections: Partial<Record<DashboardSectionKey, boolean>>,
  existingSections: Record<DashboardSectionKey, boolean> | undefined,
  defaultSections: DashboardConfig['visibleSections']
): Record<DashboardSectionKey, boolean> {
  return {
    strategicKPIs: newSections.strategicKPIs ?? existingSections?.strategicKPIs ?? defaultSections.strategicKPIs,
    teamKPIs: newSections.teamKPIs ?? existingSections?.teamKPIs ?? defaultSections.teamKPIs,
    personalKPIs: newSections.personalKPIs ?? existingSections?.personalKPIs ?? defaultSections.personalKPIs,
    strategicCharts: newSections.strategicCharts ?? existingSections?.strategicCharts ?? defaultSections.strategicCharts,
    teamCharts: newSections.teamCharts ?? existingSections?.teamCharts ?? defaultSections.teamCharts,
    personalCharts: newSections.personalCharts ?? existingSections?.personalCharts ?? defaultSections.personalCharts,
    strategicTables: newSections.strategicTables ?? existingSections?.strategicTables ?? defaultSections.strategicTables,
    teamTables: newSections.teamTables ?? existingSections?.teamTables ?? defaultSections.teamTables,
    alerts: newSections.alerts ?? existingSections?.alerts ?? defaultSections.alerts,
  };
}

/**
 * Initialise les sections depuis visibleSections (pour initialisation d'état)
 * 
 * @param visibleSections - Sections visibles depuis DashboardConfig
 * @returns Sections au format Record<DashboardSectionKey, boolean>
 */
export function initializeSectionsFromVisibleSections(
  visibleSections: DashboardConfig['visibleSections']
): Record<DashboardSectionKey, boolean> {
  return visibleSectionsToSections(visibleSections);
}
