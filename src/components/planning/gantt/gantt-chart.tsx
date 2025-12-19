'use client';

import { useMemo, useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, differenceInDays, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/ui/button';
import { generateMockGanttItems, organizeGanttByPerson } from './mock-data';
import type { GanttRow } from './types';
import { cn } from '@/lib/utils';

export type GanttFilterMode = 'all' | 'tasks' | 'activities';

type GanttChartProps = {
  year?: number;
  month?: number;
};

/**
 * Composant Gantt Chart custom avec SVG
 * 
 * Affiche les tâches et activités sur une timeline
 * Organisé par personne assignée
 */
export function GanttChart({ year, month }: GanttChartProps = {}) {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState<Date>(
    year && month ? new Date(year, month) : now
  );
  const [filterMode, setFilterMode] = useState<GanttFilterMode>('all');

  // Générer les données mockées
  const allItems = useMemo(() => {
    return generateMockGanttItems(
      currentMonth.getFullYear(),
      currentMonth.getMonth()
    );
  }, [currentMonth]);

  // Filtrer selon le mode
  const items = useMemo(() => {
    if (filterMode === 'all') {
      return allItems;
    } else if (filterMode === 'tasks') {
      return allItems.filter((item) => item.type === 'task');
    } else {
      return allItems.filter((item) => item.type === 'activity');
    }
  }, [allItems, filterMode]);

  const rows = useMemo(() => {
    return organizeGanttByPerson(items);
  }, [items]);

  // Calculer les dates du mois
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const totalDays = differenceInDays(monthEnd, monthStart) + 1;

  // Dimensions
  const rowHeight = 50;
  const headerHeight = 60;
  const sidebarWidth = 200;
  const dayWidth = 40;
  const chartWidth = totalDays * dayWidth;
  const chartHeight = rows.length * rowHeight + headerHeight;

  // Navigation
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const goToCurrentMonth = () => {
    setCurrentMonth(now);
  };

  // Calculer la position et largeur d'un item
  const getItemPosition = (startDate: Date, endDate: Date) => {
    const startOffset = differenceInDays(startDate, monthStart);
    const duration = differenceInDays(endDate, startDate) + 1;
    
    return {
      x: startOffset * dayWidth,
      width: duration * dayWidth
    };
  };

  return (
    <div className="space-y-4">
      {/* Filtres : Tous / Tâches / Activités */}
      <div className="flex items-center justify-center gap-2">
        <Button
          type="button"
          variant={filterMode === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterMode('all')}
          className={cn(
            'text-xs transition-all',
            filterMode === 'all'
              ? 'bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-800 text-white dark:from-blue-700 dark:via-indigo-800 dark:to-purple-900'
              : 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
          )}
        >
          Tous
        </Button>
        <Button
          type="button"
          variant={filterMode === 'tasks' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterMode('tasks')}
          className={cn(
            'text-xs transition-all',
            filterMode === 'tasks'
              ? 'bg-blue-600 text-white dark:bg-blue-700'
              : 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
          )}
        >
          Tâches
        </Button>
        <Button
          type="button"
          variant={filterMode === 'activities' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterMode('activities')}
          className={cn(
            'text-xs transition-all',
            filterMode === 'activities'
              ? 'bg-purple-600 text-white dark:bg-purple-700'
              : 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
          )}
        >
          Activités
        </Button>
      </div>

      {/* En-tête avec navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="icon"
          onClick={goToPreviousMonth}
          aria-label="Mois précédent"
          className="border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex flex-col items-center gap-1">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {format(currentMonth, 'MMMM yyyy', { locale: fr })}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToCurrentMonth}
            className="text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            Aujourd'hui
          </Button>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={goToNextMonth}
          aria-label="Mois suivant"
          className="border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Graphique Gantt */}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900/60">
        <svg
          width={sidebarWidth + chartWidth}
          height={chartHeight}
          className="min-w-full"
        >
          {/* En-tête avec jours */}
          <g>
            {/* Fond de l'en-tête */}
            <rect
              x={0}
              y={0}
              width={sidebarWidth + chartWidth}
              height={headerHeight}
              fill="currentColor"
              className="text-slate-100 dark:text-slate-800"
            />
            
            {/* Titre colonne sidebar */}
            <text
              x={sidebarWidth / 2}
              y={headerHeight / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-sm font-semibold fill-slate-900 dark:fill-slate-100"
            >
              Assigné à
            </text>

            {/* Jours du mois */}
            {days.map((day, index) => {
              const isToday = format(day, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
              const x = sidebarWidth + index * dayWidth;
              
              return (
                <g key={day.toISOString()}>
                  {/* Ligne verticale */}
                  <line
                    x1={x}
                    y1={0}
                    x2={x}
                    y2={headerHeight}
                    stroke="currentColor"
                    className="text-slate-300 dark:text-slate-700"
                  />
                  
                  {/* Numéro du jour */}
                  <text
                    x={x + dayWidth / 2}
                    y={headerHeight / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className={cn(
                      'text-xs font-medium',
                      isToday
                        ? 'fill-blue-600 dark:fill-blue-400'
                        : 'fill-slate-700 dark:fill-slate-300'
                    )}
                  >
                    {format(day, 'd')}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Lignes horizontales pour chaque personne */}
          {rows.map((row, rowIndex) => {
            const y = headerHeight + rowIndex * rowHeight;
            
            return (
              <g key={row.id}>
                {/* Ligne horizontale */}
                <line
                  x1={0}
                  y1={y}
                  x2={sidebarWidth + chartWidth}
                  y2={y}
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-700"
                />

                {/* Label de la personne */}
                <rect
                  x={0}
                  y={y}
                  width={sidebarWidth}
                  height={rowHeight}
                  fill="currentColor"
                  className="text-slate-50 dark:text-slate-800/50"
                />
                <text
                  x={sidebarWidth / 2}
                  y={y + rowHeight / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-sm fill-slate-700 dark:fill-slate-300"
                >
                  {row.label}
                </text>

                {/* Items Gantt */}
                {row.items.map((item) => {
                  const { x, width } = getItemPosition(item.startDate, item.endDate);
                  const itemY = y + 10;
                  const itemHeight = rowHeight - 20;
                  
                  return (
                    <g key={item.id}>
                      {/* Barre principale */}
                      <rect
                        x={sidebarWidth + x}
                        y={itemY}
                        width={width}
                        height={itemHeight}
                        rx={4}
                        fill={item.color || (item.type === 'task' ? '#3B82F6' : '#8B5CF6')}
                        opacity={0.8}
                        className="hover:opacity-100 transition-opacity cursor-pointer"
                      />
                      
                      {/* Barre de progression */}
                      {item.progress > 0 && (
                        <rect
                          x={sidebarWidth + x}
                          y={itemY}
                          width={(width * item.progress) / 100}
                          height={itemHeight}
                          rx={4}
                          fill="currentColor"
                          className="text-white opacity-60"
                        />
                      )}
                      
                      {/* Titre de l'item */}
                      {width > 80 && (
                        <text
                          x={sidebarWidth + x + 8}
                          y={itemY + itemHeight / 2}
                          dominantBaseline="middle"
                          className="text-xs font-medium fill-white pointer-events-none"
                        >
                          {item.title}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* Ligne verticale pour aujourd'hui */}
          {format(now, 'yyyy-MM') === format(currentMonth, 'yyyy-MM') && (
            (() => {
              const todayOffset = differenceInDays(now, monthStart);
              const todayX = sidebarWidth + todayOffset * dayWidth;
              
              return (
                <line
                  x1={todayX}
                  y1={0}
                  x2={todayX}
                  y2={chartHeight}
                  stroke="#EF4444"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  opacity={0.6}
                />
              );
            })()
          )}
        </svg>
      </div>

      {/* Légende */}
      <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-500 opacity-80" />
          <span>Tâches</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-purple-500 opacity-80" />
          <span>Activités</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-red-500 opacity-60" />
          <span>Aujourd'hui</span>
        </div>
      </div>
    </div>
  );
}

