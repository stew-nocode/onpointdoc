/**
 * Type de rôle dashboard (identique à DashboardRole de dashboard.ts mais isolé pour éviter les dépendances circulaires)
 */
export type DashboardRole = 'direction' | 'manager' | 'agent' | 'admin';

/**
 * Identifiants des widgets disponibles dans le dashboard
 */
export type DashboardWidget = 
  | 'mttr'              // Temps moyen de résolution (KPI)
  | 'flux'              // Flux d'ouverture/résolution (KPI)
  | 'workload'          // Charge de travail (KPI)
  | 'health'            // Santé des produits (KPI)
  | 'alerts'            // Alertes opérationnelles (full-width)
  | 'mttrEvolution'     // Évolution MTTR dans le temps (Chart)
  | 'ticketsDistribution' // Distribution tickets par type (Chart)
  | 'topBugsModules'    // Top modules avec bugs (Table)
  | 'workloadByAgent';  // Charge par agent (Table)

/**
 * Type de layout pour chaque widget
 */
export type WidgetLayoutType = 
  | 'kpi'           // 1 colonne (petit)
  | 'chart'         // 2 colonnes (moyen)
  | 'table'         // 2 colonnes (moyen)
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

