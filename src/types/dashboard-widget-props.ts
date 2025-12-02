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
import type { Period } from './dashboard';

/**
 * Props communes à tous les widgets
 */
type BaseWidgetProps = Record<string, unknown>;

/**
 * Props spécifiques pour chaque type de widget
 * 
 * ⚠️ IMPORTANT : Tous les widgets reçoivent `period` pour uniformiser la réactivité
 */
export type MTTRWidgetProps = {
  data: MTTRData;
  period: Period; // Période globale pour cohérence
};

export type TicketFluxWidgetProps = {
  data: TicketFluxData | null;
  period: Period; // Période globale pour cohérence
};

export type WorkloadWidgetProps = {
  data: WorkloadData | null;
  period: Period; // Période globale pour cohérence
};

export type HealthWidgetProps = {
  data: ProductHealthData | null;
  period: Period; // Période globale pour cohérence
};

export type OperationalAlertsWidgetProps = {
  alerts: OperationalAlert[];
  period: Period; // Période globale pour cohérence
};

export type TopBugsModulesWidgetProps = {
  data: ProductHealthData['topBugModules'];
  period: Period; // Période globale pour cohérence
};

export type WorkloadByAgentWidgetProps = {
  data: WorkloadData['byAgent'];
  period: Period; // Période globale pour cohérence
};

export type SupportEvolutionChartWidgetProps = {
  period: Period; // Période globale (le widget charge ses propres données)
  periodStart?: string; // Date de début personnalisée (ISO string)
  periodEnd?: string; // Date de fin personnalisée (ISO string)
};

/**
 * Type générique pour les props des widgets
 * 
 * Permet d'accepter n'importe quel type de props tout en gardant une référence
 * pour l'auto-complétion dans l'IDE.
 */
export type WidgetProps = BaseWidgetProps;

