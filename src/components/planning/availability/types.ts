/**
 * Types pour la colonne de disponibilité
 */

export type PersonAvailability = {
  id: string;
  fullName: string;
  department?: string;
  role?: string;
  totalHours: number; // Heures totales occupées le jour sélectionné
  capacity: number; // Capacité en heures (ex: 8h/jour)
  utilizationRate: number; // Pourcentage d'utilisation (0-100)
  status: 'available' | 'busy' | 'overloaded';
  items: {
    tasks: Array<{
      id: string;
      title: string;
      estimatedHours: number;
    }>;
    activities: Array<{
      id: string;
      title: string;
      estimatedHours: number;
    }>;
  };
};

