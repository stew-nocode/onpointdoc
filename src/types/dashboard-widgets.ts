/**
 * Type de rôle dashboard
 */
export type DashboardRole = 'direction' | 'manager' | 'agent' | 'admin';

/**
 * Identifiants des widgets disponibles dans le dashboard
 * 
 * Chaque widget est indépendant et peut être activé/désactivé individuellement.
 * Les widgets seront ajoutés section par section selon la documentation de refonte.
 * 
 * @see docs/dashboard/REFONTE-DASHBOARD-SPECIFICATION.md
 * 
 * Sections prévues :
 * - KPIs Statiques (non filtrés, Admin/Direction only)
 * - KPIs Filtrés (selon période)
 * - Charts
 * - Tables
 * - Full-width
 */
export type DashboardWidget = 
  // === SECTION : KPIs STATIQUES (non filtrés, Admin/Direction only) ===
  | 'bug-history'              // Historique des BUGs (temps réel)
  // | 'req-history'           // Historique des REQs (à implémenter)
  // | 'assistance-history'    // Historique des Assistances (à implémenter)
  
  // === SECTION : KPIs FILTRÉS (selon période) ===
  // | 'mttr'                    // Temps moyen de résolution
  // | 'tickets-ouverts'         // Tickets ouverts sur la période
  // | 'tickets-resolus'         // Tickets résolus sur la période
  
  // === SECTION : CHARTS ===
  // | 'mttr-evolution'          // Évolution MTTR
  // | 'tickets-distribution'    // Distribution par type
  
  // === SECTION : TABLES ===
  // | 'top-bugs-modules'        // Top modules avec bugs
  // | 'workload-by-agent'       // Charge par agent
  
  // === SECTION : FULL-WIDTH ===
  // | 'alerts'                  // Alertes opérationnelles
  ;

/**
 * Type de layout pour chaque widget
 * Détermine automatiquement la section de placement
 */
export type WidgetLayoutType = 
  | 'kpi-static'    // KPIs non filtrés (haut, Admin/Direction only)
  | 'kpi'           // KPIs filtrés
  | 'chart'         // Graphiques
  | 'table'         // Tableaux
  | 'full-width';   // Pleine largeur (alertes)

/**
 * Configuration Admin : widgets affectés par rôle
 */
export type DashboardRoleWidgets = {
  role: DashboardRole;
  widgets: DashboardWidget[];
  updatedAt: string;
  updatedBy: string | null;
};

/**
 * Préférences utilisateur : widgets désactivés
 */
export type DashboardUserPreferences = {
  profileId: string;
  hiddenWidgets: DashboardWidget[];
  updatedAt: string;
};

/**
 * Configuration finale calculée pour un utilisateur
 */
export type UserDashboardConfig = {
  role: DashboardRole;
  availableWidgets: DashboardWidget[];  // Widgets affectés au rôle (par admin)
  visibleWidgets: DashboardWidget[];    // Widgets visibles (available - hidden)
  hiddenWidgets: DashboardWidget[];     // Widgets désactivés par l'utilisateur
};
