'use client';

import { useState } from 'react';
import { PlanningCalendar, type PlanningViewMode } from './planning-calendar';
import { PlanningList } from './planning-list';
import { Card } from '@/ui/card';

/**
 * Client Component principal pour la page Planning
 * 
 * Gère l'état de la date sélectionnée et orchestre les composants
 * Calendrier (1/3) + Liste (2/3)
 */
export function PlanningPageClient() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<PlanningViewMode>('starts');

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Planning</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Visualisez vos tâches et activités planifiées
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Colonne gauche : Calendrier (1/3) */}
        <div className="lg:col-span-1">
          <Card className="p-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
            <PlanningCalendar
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          </Card>
        </div>

        {/* Colonne droite : Liste (2/3) */}
        <div className="lg:col-span-2">
          <Card className="p-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
            <PlanningList selectedDate={selectedDate} viewMode={viewMode} />
          </Card>
        </div>
      </div>
    </div>
  );
}

