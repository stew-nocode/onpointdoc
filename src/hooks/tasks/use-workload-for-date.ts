/**
 * Hook pour récupérer la charge de travail d'une date
 * 
 * Principe Clean Code :
 * - Hook personnalisé pour isoler la logique
 * - Utilise useMemo pour optimiser les recalculs
 * - Gestion d'erreur propre
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { getWorkloadForDate, type WorkloadForDateResult } from '@/services/tasks/get-workload-for-date';
import { calculateWorkload, type WorkloadResult } from '@/services/tasks/workload-calculation';

type UseWorkloadForDateOptions = {
  date: Date | undefined;
  newTaskDuration: number;
  assignedTo?: string;
  excludeTaskId?: string;
};

type UseWorkloadForDateResult = {
  workload: WorkloadResult | null;
  isLoading: boolean;
  error: Error | null;
  existingTasks: WorkloadForDateResult['tasks'];
};

/**
 * Hook pour calculer la charge de travail d'une date
 * 
 * @param options - Options de calcul (date, durée nouvelle tâche, etc.)
 * @returns État de la charge de travail
 */
export function useWorkloadForDate({
  date,
  newTaskDuration,
  assignedTo,
  excludeTaskId
}: UseWorkloadForDateOptions): UseWorkloadForDateResult {
  const [existingWorkload, setExistingWorkload] = useState<WorkloadForDateResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Récupérer la charge existante quand la date change
  useEffect(() => {
    if (!date) {
      // Utiliser requestAnimationFrame pour éviter les cascades de renders
      requestAnimationFrame(() => {
        setExistingWorkload(null);
        setError(null);
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    getWorkloadForDate(supabase, date, assignedTo, excludeTaskId)
      .then(result => {
        setExistingWorkload(result);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err);
        setIsLoading(false);
        setExistingWorkload(null);
      });
  }, [date, assignedTo, excludeTaskId]);

  // Calculer la charge totale avec useMemo
  const workload = useMemo(() => {
    if (!existingWorkload) {
      return null;
    }

    return calculateWorkload(existingWorkload.totalHours, newTaskDuration || 0);
  }, [existingWorkload, newTaskDuration]);

  return {
    workload,
    isLoading,
    error,
    existingTasks: existingWorkload?.tasks || []
  };
}

