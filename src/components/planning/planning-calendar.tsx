'use client';

import { useState, useEffect } from 'react';
import { Calendar } from '@/ui/calendar';
import { Button } from '@/ui/button';
import { Switch } from '@/ui/switch';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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
  const [datesWithEvents, setDatesWithEvents] = useState<Date[]>([]);
  const [isLoadingDates, setIsLoadingDates] = useState(false);

  // Extraire year/month pour les dépendances (évite expressions complexes)
  const currentYear = currentMonth.getFullYear();
  const currentMonthIndex = currentMonth.getMonth();

  // Récupérer les dates avec événements depuis l'API Supabase
  // Utilise AbortController pour annuler les requêtes obsolètes
  useEffect(() => {
    const abortController = new AbortController();

    const fetchDates = async () => {
      setIsLoadingDates(true);
      try {
        const response = await fetch(
          `/api/planning/dates?year=${currentYear}&month=${currentMonthIndex}&viewMode=${viewMode}`,
          { signal: abortController.signal }
        );

        if (!response.ok) {
          console.error('Erreur lors de la récupération des dates:', response.statusText);
          setDatesWithEvents([]);
          return;
        }

        const data = await response.json();
        const dates = (data.dates || []).map((dateStr: string) => new Date(dateStr));
        setDatesWithEvents(dates);
      } catch (error) {
        // Ignorer les erreurs d'annulation
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        console.error('Erreur lors de la récupération des dates:', error);
        setDatesWithEvents([]);
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoadingDates(false);
        }
      }
    };

    fetchDates();

    return () => {
      abortController.abort();
    };
  }, [currentYear, currentMonthIndex, viewMode]);

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
   * Retour au mois en cours et sélectionne la date du jour
   */
  const goToCurrentMonth = () => {
    const today = new Date();
    setCurrentMonth(today);
    onDateSelect(today);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header uniforme - même hauteur que les autres colonnes */}
      <div className="flex-shrink-0 pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
        {/* Switch Mode : Débuts / Échéances */}
        <div className="flex items-center justify-center gap-3 mb-3">
          <label
            htmlFor="planning-view-mode"
            className={cn(
              'text-sm font-medium transition-colors cursor-pointer',
              viewMode === 'starts'
                ? 'text-slate-900 dark:text-slate-100'
                : 'text-slate-500 dark:text-slate-400'
            )}
          >
            Débuts
          </label>
          <Switch
            id="planning-view-mode"
            checked={viewMode === 'dueDates'}
            onCheckedChange={(checked) => {
              onViewModeChange?.(checked ? 'dueDates' : 'starts');
            }}
            aria-label="Basculer entre Débuts et Échéances"
          />
          <label
            htmlFor="planning-view-mode"
            className={cn(
              'text-sm font-medium transition-colors cursor-pointer',
              viewMode === 'dueDates'
                ? 'text-slate-900 dark:text-slate-100'
                : 'text-slate-500 dark:text-slate-400'
            )}
          >
            Échéances
          </label>
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
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {format(currentMonth, 'MMMM yyyy', { locale: fr })}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToCurrentMonth}
            className="text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            Aujourd&apos;hui
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
      </div>

      {/* Calendrier - prend le reste de l'espace */}
      <div className="flex-1 min-h-0">
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
            'relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:content-[""] after:shadow-sm after:z-10',
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
          // Jour sélectionné : cercle vert (débuts) ou rouge (échéances) fin
          selected: cn(
            'relative',
            '!bg-transparent hover:!bg-transparent',
            // Cercle fin autour selon le mode de vue (before pour z-index < after des points)
            'before:absolute before:inset-[1px] before:rounded-full before:border-[2px] before:content-[""] before:shadow-sm before:z-[1] before:opacity-60',
            viewMode === 'starts'
              ? 'before:border-green-500 dark:before:border-green-400 !text-green-700 dark:!text-green-300 font-bold'
              : 'before:border-red-500 dark:before:border-red-400 !text-red-700 dark:!text-red-300 font-bold',
            // Si le jour sélectionné est aussi aujourd'hui, le cercle devient plein opacité
            '[&.today]:before:border-transparent [&.today]:before:opacity-100 [&.today]:after:block',
            // Cercle de sélection pour aujourd'hui sélectionné (opacité 100%)
            viewMode === 'starts'
              ? '[&.today]:after:border-green-500 dark:[&.today]:after:border-green-400'
              : '[&.today]:after:border-red-500 dark:[&.today]:after:border-red-400',
            '[&.today]:after:absolute [&.today]:after:inset-[1px] [&.today]:after:rounded-full [&.today]:after:border-[2px] [&.today]:after:content-[""] [&.today]:after:shadow-sm [&.today]:after:z-[1]'
          )
        }}
        />
      </div>
    </div>
  );
}

