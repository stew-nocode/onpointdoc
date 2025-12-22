/**
 * Types pour les données mockées du Planning
 * 
 * Ces types seront remplacés par les vrais types de tâches/activités
 * lors de la connexion aux données Supabase
 */

export type PlanningItemType = 'task' | 'activity';

export type MockPlanningTask = {
  id: string;
  type: 'task';
  title: string;
  status: 'A_faire' | 'En_cours' | 'Termine' | 'Annule' | 'Bloque';
  priority: 'Basse' | 'Normale' | 'Haute' | 'Urgente' | null;
  dueDate: string; // ISO date string
  startDate?: string | null; // ISO date string (date de début)
  estimatedDurationHours?: number | null; // Durée estimée en heures
  assignedTo?: {
    id: string;
    fullName: string;
  } | null;
};

export type MockPlanningActivity = {
  id: string;
  type: 'activity';
  title: string;
  activityType: string | null;
  status: string | null;
  plannedStart: string; // ISO date string
  plannedEnd: string | null; // ISO date string
  reportContent?: string | null; // Contenu du compte rendu
  createdBy?: {
    id: string;
    fullName: string;
  } | null;
  participants?: Array<{
    id: string;
    fullName: string;
  }>;
};

export type MockPlanningItem = MockPlanningTask | MockPlanningActivity;

// Alias pour compatibilité avec les composants existants
export type PlanningItem = MockPlanningItem;

