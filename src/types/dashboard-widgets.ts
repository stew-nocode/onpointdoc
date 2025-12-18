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
  // === SECTION : AGENTS (cartes par agent) ===
  | 'agents-support-cards'       // Cartes Agents Support (photo + résumé période)

  // === SECTION : ENTREPRISES (cartes par entreprise) ===
  | 'companies-cards'            // Cartes Entreprises (activité par entreprise)

  // === SECTION : KPIs STATIQUES (non filtrés, Admin/Direction only) ===
  | 'bug-history'              // Historique des BUGs (temps réel)
  | 'req-history'              // Historique des REQs (temps réel)
  | 'assistance-history'       // Historique des Assistances (temps réel)
  
  // === SECTION : KPIs FILTRÉS (selon période) ===
  // | 'mttr'                    // Temps moyen de résolution
  // | 'tickets-ouverts'         // Tickets ouverts sur la période
  // | 'tickets-resolus'         // Tickets résolus sur la période
  
  // === SECTION : CHARTS ===
  | 'tickets-distribution'       // Distribution par type (PieChart Donut)
  | 'tickets-evolution'          // Évolution des tickets (AreaChart)
  | 'tickets-by-company'         // Top entreprises (Horizontal Stacked Bar)
  | 'bugs-by-type'               // Répartition des BUGs par type (PieChart Donut)
  | 'campaigns-results'          // Résultats campagnes emails (Horizontal Bar)
  | 'tickets-by-module'          // Tickets par module (Vertical Grouped Bar)
  | 'bugs-by-type-module'        // BUGs par type et module (Horizontal Stacked)
  | 'assistance-time-by-company' // Temps d'assistance par entreprise (Horizontal Bar)
  | 'assistance-time-evolution'  // Évolution du temps d'assistance (AreaChart dégradé)
  | 'support-agents-radar'       // Radar agents Support (comparaison dimensions)
  // | 'mttr-evolution'          // Évolution MTTR
  
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
  | 'agents'        // Cartes agents (photo + résumé activité) - au-dessus des KPIs statiques
  | 'companies'     // Cartes entreprises (activité par entreprise) - sous la section agents
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
