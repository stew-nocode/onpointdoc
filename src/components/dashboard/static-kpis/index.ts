/**
 * Exports des composants KPIs Statiques (temps réel, non filtrés)
 * 
 * Section visible uniquement pour les rôles Admin et Direction
 * Ces widgets affichent des statistiques historiques complètes,
 * non soumises aux filtres de période du dashboard.
 * 
 * @see docs/dashboard/REFONTE-DASHBOARD-SPECIFICATION.md - Section 3.1
 */

export { BugHistoryCard, BugHistoryCardSkeleton } from './bug-history-card';
export { ReqHistoryCard, ReqHistoryCardSkeleton } from './req-history-card';
export { AssistanceHistoryCard, AssistanceHistoryCardSkeleton } from './assistance-history-card';

