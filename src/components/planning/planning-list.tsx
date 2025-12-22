'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';
import { PlanningDayItem } from './planning-day-item';
import { CardHeader, CardTitle } from '@/ui/card';
import { TooltipProvider } from '@/ui/tooltip';
import type { PlanningViewMode } from './planning-calendar';
import type { PlanningItem } from './types';

type PlanningListProps = {
  selectedDate: Date;
  viewMode?: PlanningViewMode;
};

/**
 * Composant Liste des items du jour sélectionné
 * 
 * Affiche les tâches et activités depuis Supabase selon le mode de vue :
 * - "starts" : tâches et activités qui COMMENCENT ce jour
 * - "dueDates" : tâches et activités qui ont une ÉCHÉANCE ce jour
 */
export function PlanningList({ selectedDate, viewMode = 'starts' }: PlanningListProps) {
  const [items, setItems] = useState<PlanningItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Récupérer les items depuis l'API Supabase
  // Utilise AbortController pour annuler les requêtes obsolètes (évite les race conditions)
  useEffect(() => {
    const abortController = new AbortController();

    const fetchItems = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const dateISO = selectedDate.toISOString();
        const response = await fetch(
          `/api/planning/items?date=${encodeURIComponent(dateISO)}&viewMode=${viewMode}`,
          { signal: abortController.signal }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
          throw new Error(errorData.error || `Erreur ${response.status}`);
        }

        const data = await response.json();
        setItems(data.items || []);
      } catch (err) {
        // Ignorer les erreurs d'annulation (changement de date rapide)
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        console.error('Erreur lors de la récupération des items:', err);
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
        setItems([]);
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchItems();

    // Cleanup : annuler la requête si la date change avant la fin
    return () => {
      abortController.abort();
    };
  }, [selectedDate, viewMode]);

  const formattedDate = format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr });
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  // Compter les tâches et activités
  const tasksCount = items.filter((item) => item.type === 'task').length;
  const activitiesCount = items.filter((item) => item.type === 'activity').length;

  return (
    <div className="flex flex-col h-full">
      {/* Header fixe - même hauteur que les autres colonnes */}
      <CardHeader className="px-0 pb-4 flex-shrink-0 border-b border-slate-200 dark:border-slate-800 mb-4">
        <CardTitle className="text-base text-slate-900 dark:text-slate-100">
          {capitalizedDate}
        </CardTitle>
        <p className="text-sm font-normal text-slate-500 dark:text-slate-400">
          {isLoading
            ? 'Chargement...'
            : items.length === 0
              ? viewMode === 'starts'
                ? 'Aucun élément débutant ce jour'
                : 'Aucun élément à échéance ce jour'
              : `${tasksCount} tâche${tasksCount > 1 ? 's' : ''}, ${activitiesCount} activité${activitiesCount > 1 ? 's' : ''}`}
        </p>
      </CardHeader>

      {/* Liste scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <TooltipProvider delayDuration={300}>
          {/* État de chargement */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          )}

          {/* Erreur */}
          {error && !isLoading && (
            <div className="py-12 text-center text-sm text-red-600 dark:text-red-400">
              <p>{error}</p>
            </div>
          )}

          {/* Liste vide */}
          {!isLoading && !error && items.length === 0 && (
            <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
              <p>
                {viewMode === 'starts'
                  ? 'Aucun élément débutant pour cette date.'
                  : 'Aucun élément à échéance pour cette date.'}
              </p>
            </div>
          )}

          {/* Liste des items */}
          {!isLoading && !error && items.length > 0 && (
            <div className="space-y-2 pr-2">
              {items.map((item) => (
                <PlanningDayItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </TooltipProvider>
      </div>
    </div>
  );
}

