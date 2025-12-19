/**
 * Types pour la vue Gantt
 */

export type GanttItem = {
  id: string;
  title: string;
  type: 'task' | 'activity';
  startDate: Date;
  endDate: Date;
  progress: number; // 0-100
  status: string;
  assignedTo?: {
    id: string;
    fullName: string;
  } | null;
  color?: string; // Couleur spécifique pour le type
};

export type GanttRow = {
  id: string;
  label: string; // Nom de la personne ou catégorie
  items: GanttItem[];
};

