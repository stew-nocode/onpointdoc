/**
 * Types pour les props des widgets du dashboard
 * 
 * Chaque widget reçoit des props spécifiques selon son type.
 * Ces types permettent d'éliminer les `any` et d'avoir une sécurité de type complète.
 */

import type {
  MTTRData,
  TicketFluxData,
  WorkloadData,
  ProductHealthData,
  OperationalAlert,
} from './dashboard';

/**
 * Props communes à tous les widgets
 */
type BaseWidgetProps = Record<string, unknown>;

/**
 * Props spécifiques pour chaque type de widget
 */
export type MTTRWidgetProps = {
  data: MTTRData;
};

export type TicketFluxWidgetProps = {
  data: TicketFluxData | null;
};

export type WorkloadWidgetProps = {
  data: WorkloadData | null;
};

export type HealthWidgetProps = {
  data: ProductHealthData | null;
};

export type OperationalAlertsWidgetProps = {
  alerts: OperationalAlert[];
};

export type TopBugsModulesWidgetProps = {
  data: ProductHealthData['topBugModules'];
};

export type WorkloadByAgentWidgetProps = {
  data: WorkloadData['byAgent'];
};

/**
 * Type générique pour les props des widgets
 * 
 * Permet d'accepter n'importe quel type de props tout en gardant une référence
 * pour l'auto-complétion dans l'IDE.
 */
export type WidgetProps = BaseWidgetProps;

