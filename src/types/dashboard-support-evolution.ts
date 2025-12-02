/**
 * Types pour le graphique d'évolution de performance Support
 * 
 * Widget de tendances globales par dimension (BUG, REQ, ASSISTANCE, Temps, etc.)
 */

import type { Period } from './dashboard';

/**
 * Dimension disponible pour le graphique
 */
export type SupportDimension = 'BUG' | 'REQ' | 'ASSISTANCE' | 'assistanceTime' | 'tasks' | 'activities';

/**
 * Point de données d'évolution pour une période
 */
export type SupportEvolutionDataPoint = {
  date: string; // ISO date: "2025-01-15"
  
  // Volumes par type de ticket (tickets créés dans la période)
  bugs: number;           // Nombre de tickets BUG créés
  reqs: number;           // Nombre de tickets REQ créés
  assistances: number;    // Nombre de tickets ASSISTANCE créés
  
  // Temps d'assistance (minutes)
  assistanceTime: number; // Temps d'assistance total en minutes
  
  // Futur : Tâches et Activités
  tasks?: number;         // Nombre de tâches créées (à implémenter)
  activities?: number;    // Nombre d'activités créées (à implémenter)
};

/**
 * Données d'évolution de performance Support
 */
export type SupportEvolutionData = {
  period: Period | string; // Period ou année (ex: "2023", "2024")
  periodStart: string; // ISO date
  periodEnd: string; // ISO date
  selectedAgents?: string[]; // Si undefined = tous les agents Support
  selectedDimensions: SupportDimension[]; // Dimensions sélectionnées à afficher
  data: SupportEvolutionDataPoint[];
  agents: Array<{
    id: string;
    name: string;
  }>;
};

