import { unstable_noStore as noStore } from 'next/cache';
import { PlanningPageClient } from '@/components/planning/planning-page-client';

/**
 * Page Planning - Vue calendrier des tâches et activités
 * 
 * Server Component qui charge les données initiales et passe au Client Component
 * pour l'interactivité (sélection de date, navigation mois)
 */
export default function PlanningPage() {
  // Force dynamic rendering pour cette page
  noStore();

  return <PlanningPageClient />;
}

