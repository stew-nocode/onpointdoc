'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { User, Clock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Separator } from '@/ui/separator';
import { cn } from '@/lib/utils';
import type { PersonAvailability } from './types';

type PlanningAvailabilityProps = {
  selectedDate: Date;
};

/**
 * Colonne de disponibilité des personnes
 * 
 * Affiche la liste des personnes avec leur charge de travail
 * pour la date sélectionnée, basée sur la durée estimée depuis Supabase
 */
export function PlanningAvailability({ selectedDate }: PlanningAvailabilityProps) {
  const [availability, setAvailability] = useState<PersonAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Utilise AbortController pour annuler les requêtes obsolètes (évite les race conditions)
  useEffect(() => {
    const abortController = new AbortController();

    const fetchAvailability = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const dateISO = selectedDate.toISOString();
        const response = await fetch(
          `/api/planning/availability?date=${encodeURIComponent(dateISO)}`,
          { signal: abortController.signal }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
          throw new Error(errorData.error || `Erreur ${response.status}`);
        }

        const data = await response.json();
        setAvailability(data.availability || []);
      } catch (err) {
        // Ignorer les erreurs d'annulation (changement de date rapide)
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        console.error('Erreur lors de la récupération de la disponibilité:', err);
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
        setAvailability([]);
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchAvailability();

    // Cleanup : annuler la requête si la date change avant la fin
    return () => {
      abortController.abort();
    };
  }, [selectedDate]);

  // Séparer les personnes par statut
  const available = availability.filter((p) => p.status === 'available');
  const busy = availability.filter((p) => p.status === 'busy');
  const overloaded = availability.filter((p) => p.status === 'overloaded');

  const getStatusIcon = (status: PersonAvailability['status']) => {
    switch (status) {
      case 'available':
        return (
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
        );
      case 'busy':
        return (
          <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        );
      case 'overloaded':
        return (
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
        );
    }
  };

  const getUtilizationColor = (rate: number) => {
    if (rate === 0) return 'text-green-600 dark:text-green-400';
    if (rate <= 100) return 'text-blue-600 dark:text-blue-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <Card className="h-full w-full flex flex-col border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
      <CardHeader className="flex-shrink-0 pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
        <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Disponibilité
        </CardTitle>
        <p className="text-base font-normal text-slate-500 dark:text-slate-400">
          {format(selectedDate, 'EEEE d MMMM', { locale: fr })}
        </p>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto min-h-0 space-y-4">
        {/* État de chargement */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        )}

        {/* Erreur */}
        {error && !isLoading && (
          <div className="text-center py-8 text-sm text-red-600 dark:text-red-400">
            <p>{error}</p>
          </div>
        )}

        {/* Contenu principal */}
        {!isLoading && !error && (
          <>
            {/* Statistiques rapides */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center p-2 rounded bg-green-50 dark:bg-green-900/20">
                <div className="font-semibold text-green-700 dark:text-green-300">{available.length}</div>
                <div className="text-green-600 dark:text-green-400">Disponibles</div>
              </div>
              <div className="text-center p-2 rounded bg-blue-50 dark:bg-blue-900/20">
                <div className="font-semibold text-blue-700 dark:text-blue-300">{busy.length}</div>
                <div className="text-blue-600 dark:text-blue-400">Occupés</div>
              </div>
              <div className="text-center p-2 rounded bg-red-50 dark:bg-red-900/20">
                <div className="font-semibold text-red-700 dark:text-red-300">{overloaded.length}</div>
                <div className="text-red-600 dark:text-red-400">Surchargés</div>
              </div>
            </div>

            <Separator />
          </>
        )}

        {/* Liste des personnes */}
        {!isLoading && !error && (
          <div className="space-y-3">
          {/* Surchargés */}
          {overloaded.length > 0 && (
            <div className="space-y-2">
              {overloaded.map((person) => (
                <div
                  key={person.id}
                  className="p-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <User className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
                          {person.fullName}
                        </div>
                        {person.department && (
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {person.department}
                          </div>
                        )}
                      </div>
                    </div>
                    {getStatusIcon(person.status)}
                  </div>

                  {/* Charge */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400">Charge</span>
                      <span className={cn('font-semibold', getUtilizationColor(person.utilizationRate))}>
                        {person.totalHours.toFixed(1)}h / {person.capacity}h
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                      <div
                        className="bg-red-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${Math.min(person.utilizationRate, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Items */}
                  {(person.items.tasks.length > 0 || person.items.activities.length > 0) && (
                    <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-800 space-y-1">
                      {person.items.tasks.map((task) => (
                        <div key={task.id} className="text-xs text-slate-600 dark:text-slate-400">
                          <span className="text-blue-600 dark:text-blue-400">•</span> {task.title}{' '}
                          <span className="text-slate-400">({task.estimatedHours}h)</span>
                        </div>
                      ))}
                      {person.items.activities.map((activity) => (
                        <div key={activity.id} className="text-xs text-slate-600 dark:text-slate-400">
                          <span className="text-purple-600 dark:text-purple-400">•</span> {activity.title}{' '}
                          <span className="text-slate-400">({activity.estimatedHours}h)</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Occupés */}
          {busy.length > 0 && (
            <div className="space-y-2">
              {busy.map((person) => (
                <div
                  key={person.id}
                  className="p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-900/5"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <User className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
                          {person.fullName}
                        </div>
                        {person.department && (
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {person.department}
                          </div>
                        )}
                      </div>
                    </div>
                    {getStatusIcon(person.status)}
                  </div>

                  {/* Charge */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400">Charge</span>
                      <span className={cn('font-semibold', getUtilizationColor(person.utilizationRate))}>
                        {person.totalHours.toFixed(1)}h / {person.capacity}h
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${person.utilizationRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Disponibles */}
          {available.length > 0 && (
            <div className="space-y-2">
              {available.map((person) => (
                <div
                  key={person.id}
                  className="p-3 rounded-lg border border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-900/5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <User className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
                          {person.fullName}
                        </div>
                        {person.department && (
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {person.department}
                          </div>
                        )}
                      </div>
                    </div>
                    {getStatusIcon(person.status)}
                  </div>
                </div>
              ))}
            </div>
          )}

            {/* Aucune personne */}
            {availability.length === 0 && (
              <div className="text-center py-8 text-sm text-slate-500 dark:text-slate-400">
                <p>Aucune personne trouvée</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

