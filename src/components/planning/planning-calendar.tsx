'use client';

import { useState } from 'react';
import { Calendar } from '@/ui/calendar';
import { Button } from '@/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { getMockDatesWithEvents } from './mock-data';

export type PlanningViewMode = 'starts' | 'dueDates';

type PlanningCalendarProps = {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  viewMode?: PlanningViewMode;
  onViewModeChange?: (mode: PlanningViewMode) => void;
};

/**
 * Composant Calendrier pour le Planning
 * 
 * Affiche le mois en cours avec :
 * - Navigation mois (← →)
 * - Switch pour choisir entre "Débuts" et "Échéances"
 * - Surbrillance du jour J
 * - Surbrillance des jours avec événements (tâches/activités)
 * - Sélection de date
 */
export function PlanningCalendar({ 
  selectedDate, 
  onDateSelect,
  viewMode = 'starts',
  onViewModeChange
}: PlanningCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Récupérer les dates avec événements pour le mois affiché selon le mode
  const datesWithEvents = getMockDatesWithEvents(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    viewMode
  );

  // Convertir en Set pour lookup rapide
  const datesWithEventsSet = new Set(
    datesWithEvents.map((d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`)
  );

  /**
   * Vérifie si une date a des événements
   */
  const hasEvents = (date: Date): boolean => {
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return datesWithEventsSet.has(key);
  };

  /**
   * Navigation mois précédent
   */
  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  /**
   * Navigation mois suivant
   */
  const goToNextMonth = () => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  /**
   * Retour au mois en cours
   */
  const goToCurrentMonth = () => {
    setCurrentMonth(new Date());
  };

  return (
    <div className="space-y-4">
      {/* Switch Mode : Débuts / Échéances */}
      <div className="flex items-center justify-center gap-2">
        <Button
          type="button"
          variant={viewMode === 'starts' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewModeChange?.('starts')}
          className={cn(
            'text-xs transition-all',
            viewMode === 'starts'
              ? 'bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-800 text-white dark:from-blue-700 dark:via-indigo-800 dark:to-purple-900'
              : 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
          )}
        >
          Débuts
        </Button>
        <Button
          type="button"
          variant={viewMode === 'dueDates' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewModeChange?.('dueDates')}
          className={cn(
            'text-xs transition-all',
            viewMode === 'dueDates'
              ? 'bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-800 text-white dark:from-blue-700 dark:via-indigo-800 dark:to-purple-900'
              : 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
          )}
        >
          Échéances
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

      {/* Calendrier */}
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={(date) => {
          if (date) {
            onDateSelect(date);
          }
        }}
        month={currentMonth}
        onMonthChange={setCurrentMonth}
        modifiers={{
          hasEvents: (date) => hasEvents(date)
        }}
        modifiersClassNames={{
          hasEvents: cn(
            'relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:content-[""] after:shadow-sm',
            // Points verts pour débuts, rouges pour échéances - couleurs plus vives
            viewMode === 'starts'
              ? 'after:bg-green-500 dark:after:bg-green-400 dark:after:shadow-green-400/50'
              : 'after:bg-red-500 dark:after:bg-red-400 dark:after:shadow-red-400/50'
          )
        }}
        className="rounded-md border-0"
        classNames={{
          // Jour J (aujourd'hui) : cercle bleu vif autour
          today: cn(
            'relative',
            // Fond subtil pour plus de visibilité
            '!bg-blue-50 dark:!bg-blue-950/50',
            // Cercle bleu vif autour avec bordure plus épaisse et shadow
            'before:absolute before:inset-[1px] before:rounded-full before:border-[2.5px] before:border-blue-500 before:content-[""] before:shadow-sm',
            'dark:before:border-blue-400 dark:before:shadow-blue-400/30',
            // Texte avec plus de contraste
            '!text-blue-900 font-bold dark:!text-blue-100'
          ),
          // Jour sélectionné : badge vert plein
          selected: cn(
            '!bg-status-success !text-white hover:!bg-status-success hover:!text-white',
            'focus:!bg-status-success focus:!text-white',
            'dark:!bg-status-success dark:!text-white dark:hover:!bg-status-success/90',
            // Si le jour sélectionné est aussi aujourd'hui, masquer le cercle bleu
            '[&.today]:before:hidden'
          )
        }}
      />
    </div>
  );
}

