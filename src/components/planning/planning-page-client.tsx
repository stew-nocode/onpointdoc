'use client';

import { useState } from 'react';
import { PlanningCalendar, type PlanningViewMode } from './planning-calendar';
import { PlanningList } from './planning-list';
import { GanttChart } from './gantt/gantt-chart';
import { PlanningAvailability } from './availability/planning-availability';
import { Card } from '@/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/ui/tabs';

/**
 * Client Component principal pour la page Planning
 * 
 * Gère l'état de la date sélectionnée et orchestre les composants
 * Calendrier (1/3) + Liste (2/3)
 * 
 * Utilise le même layout que les autres pages (pas de max-w-7xl)
 */
export function PlanningPageClient() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<PlanningViewMode>('starts');

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Planning</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Visualisez vos tâches et activités planifiées
        </p>
      </div>

      <Tabs defaultValue="calendar" className="space-y-6">
        <TabsList className="bg-slate-100 dark:bg-slate-800">
          <TabsTrigger value="calendar">Calendrier</TabsTrigger>
          <TabsTrigger value="gantt">Gantt</TabsTrigger>
        </TabsList>

        {/* Onglet Calendrier */}
        <TabsContent value="calendar" className="space-y-6">
          <div className="flex flex-col lg:flex-row gap-6 lg:items-stretch" style={{ height: 'calc(100vh - 280px)', minHeight: '600px' }}>
            {/* Colonne gauche : Calendrier (largeur auto, seulement l'espace nécessaire) */}
            <div className="flex-shrink-0 flex h-full">
              <Card className="p-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 w-full h-full flex flex-col">
                <PlanningCalendar
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                />
              </Card>
            </div>

            {/* Colonne milieu : Liste (prend le reste de l'espace) */}
            <div className="flex-1 min-w-0 flex h-full">
              <Card className="p-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 w-full h-full flex flex-col">
                <PlanningList selectedDate={selectedDate} viewMode={viewMode} />
              </Card>
            </div>

            {/* Colonne droite : Disponibilité (1/4 fixe) */}
            <div className="w-full lg:w-1/4 flex-shrink-0 flex h-full">
              <PlanningAvailability selectedDate={selectedDate} />
            </div>
          </div>
        </TabsContent>

        {/* Onglet Gantt */}
        <TabsContent value="gantt" className="space-y-6">
          <Card className="p-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
            <GanttChart />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

