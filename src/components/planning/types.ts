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
  participants?: Array<{
    id: string;
    fullName: string;
  }>;
};

export type MockPlanningItem = MockPlanningTask | MockPlanningActivity;

