/**
 * Types pour les données du Planning (connecté à Supabase)
 */

export type PlanningItemType = 'task' | 'activity';

export type PlanningTaskItem = {
  id: string;
  type: 'task';
  title: string;
  status: 'A_faire' | 'En_cours' | 'Termine' | 'Annule' | 'Bloque';
  priority: 'Basse' | 'Normale' | 'Haute' | 'Urgente' | null;
  startDate: string; // ISO date string (date de début)
  assignedTo?: {
    id: string;
    fullName: string;
  } | null;
};

export type PlanningActivityItem = {
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

export type PlanningItem = PlanningTaskItem | PlanningActivityItem;

