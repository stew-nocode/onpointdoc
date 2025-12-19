/**
 * Section Dates du formulaire d'activité
 * 
 * Composant atomique pour respecter les principes Clean Code
 * Utilise un Switch pour activer/désactiver la planification
 * Affiche un Dialog pour saisir les dates si le Switch est activé
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWatch } from 'react-hook-form';
import type { CreateActivityInput } from '@/lib/validators/activity';
import type { UseFormReturn } from 'react-hook-form';
import { Switch } from '@/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/ui/dialog';
import { Button } from '@/ui/button';
import { DateTimePicker } from './date-time-picker';

type ActivityDatesSectionProps = {
  form: UseFormReturn<CreateActivityInput>;
};

/**
 * Section pour gérer la planification de l'activité
 * 
 * @param form - Instance du formulaire React Hook Form
 */
export function ActivityDatesSection({ form }: ActivityDatesSectionProps) {
  const { errors } = form.formState;
  
  // État local pour le Switch (initialisé depuis les valeurs du formulaire)
  const [isPlanned, setIsPlanned] = useState(() => {
    const start = form.getValues('plannedStart');
    const end = form.getValues('plannedEnd');
    return !!(start && end && typeof start === 'string' && typeof end === 'string' && start.trim().length > 0 && end.trim().length > 0);
  });
  
  // État pour contrôler l'ouverture du Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // États temporaires pour les dates dans le Dialog
  // Séparés en Date (objet Date) et time (string HH:mm)
  const [tempStartDate, setTempStartDate] = useState<Date | undefined>(undefined);
  const [tempStartTime, setTempStartTime] = useState<string>('10:00');
  const [tempEndDate, setTempEndDate] = useState<Date | undefined>(undefined);
  const [tempEndTime, setTempEndTime] = useState<string>('12:00');
  
  /**
   * Convertit une date ISO en objet Date (pour Calendar) et string time (pour input time)
   */
  const parseIsoToDateTime = useCallback((isoDate?: string): { date: Date | undefined; time: string } => {
    if (!isoDate) return { date: undefined, time: '10:00' };
    try {
      const dateObj = new Date(isoDate);
      if (isNaN(dateObj.getTime())) return { date: undefined, time: '10:00' };
      
      // Extraire la partie heure dans le fuseau horaire local (HH:mm)
      const hours = dateObj.getHours().toString().padStart(2, '0');
      const minutes = dateObj.getMinutes().toString().padStart(2, '0');
      const time = `${hours}:${minutes}`;
      
      // Créer une nouvelle Date avec seulement la partie date (sans heure) pour le Calendar
      // Le Calendar doit recevoir une date à minuit dans le fuseau local
      const dateOnly = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
      
      return { date: dateOnly, time };
    } catch {
      return { date: undefined, time: '10:00' };
    }
  }, []);
  
  /**
   * Combine Date (objet Date du Calendar) et time (string HH:mm) en string ISO
   * 
   * Le Calendar retourne une Date à minuit dans le fuseau local
   * On ajoute l'heure sélectionnée, puis on convertit en ISO
   */
  const combineDateTime = useCallback((date: Date | undefined, time: string): string | undefined => {
    if (!date) return undefined;
    
    try {
      const [hours, minutes] = time.split(':').map(Number);
      // Créer une nouvelle Date avec la date du Calendar et l'heure sélectionnée
      // La date du Calendar est déjà à minuit dans le fuseau local
      const combinedDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        hours || 0,
        minutes || 0,
        0,
        0
      );
      return combinedDate.toISOString();
    } catch {
      return undefined;
    }
  }, []);
  
  // Utiliser useWatch pour optimiser les re-renders (isole les re-renders au niveau du hook)
  const plannedStart = useWatch({
    control: form.control,
    name: 'plannedStart'
  });
  const plannedEnd = useWatch({
    control: form.control,
    name: 'plannedEnd'
  });
  
  useEffect(() => {
    const hasDates = !!(
      plannedStart && 
      plannedEnd && 
      typeof plannedStart === 'string' && 
      typeof plannedEnd === 'string' &&
      plannedStart.trim().length > 0 && 
      plannedEnd.trim().length > 0
    );
    setIsPlanned(hasDates);
  }, [plannedStart, plannedEnd]);
  
  // Initialiser les valeurs temporaires quand le Dialog s'ouvre
  useEffect(() => {
    if (dialogOpen) {
      const start = form.getValues('plannedStart');
      const end = form.getValues('plannedEnd');
      
      const startDateTime = parseIsoToDateTime(start);
      const endDateTime = parseIsoToDateTime(end);
      
      setTempStartDate(startDateTime.date);
      setTempStartTime(startDateTime.time);
      setTempEndDate(endDateTime.date);
      setTempEndTime(endDateTime.time);
    }
  }, [dialogOpen, form, parseIsoToDateTime]);
  
  /**
   * Gère le changement du Switch
   */
  const handleToggle = useCallback((checked: boolean) => {
    setIsPlanned(checked);
    
    if (!checked) {
      // Désactiver : nettoyer les dates sans déclencher la validation
      form.setValue('plannedStart', undefined, {
        shouldValidate: false,
        shouldDirty: true,
        shouldTouch: false
      });
      form.setValue('plannedEnd', undefined, {
        shouldValidate: false,
        shouldDirty: true,
        shouldTouch: false
      });
      form.clearErrors(['plannedStart', 'plannedEnd']);
      setDialogOpen(false);
    } else {
      // Activer : ouvrir le Dialog pour saisir les dates
      setDialogOpen(true);
    }
  }, [form]);
  
  /**
   * Valide et enregistre les dates depuis le Dialog
   */
  const handleValidateDates = useCallback(() => {
    if (!tempStartDate || !tempEndDate) {
      // Les deux dates sont requises
      return;
    }
    
    try {
      // Combiner Date et time en ISO
      const startIso = combineDateTime(tempStartDate, tempStartTime);
      const endIso = combineDateTime(tempEndDate, tempEndTime);
      
      if (!startIso || !endIso) {
        return;
      }
      
      // Enregistrer avec validation
      form.setValue('plannedStart', startIso, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true
      });
      form.setValue('plannedEnd', endIso, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true
      });
      
      setDialogOpen(false);
    } catch (error) {
      // Les dates invalides seront gérées par la validation Zod
      console.error('Erreur lors de la conversion des dates:', error);
    }
  }, [tempStartDate, tempStartTime, tempEndDate, tempEndTime, form, combineDateTime]);
  
  /**
   * Annule la saisie dans le Dialog
   * Si aucune date n'est définie, désactive le toggle
   */
  const handleCancelDialog = useCallback(() => {
    setDialogOpen(false);

    // Vérifier si des dates sont déjà définies dans le formulaire
    const start = form.getValues('plannedStart');
    const end = form.getValues('plannedEnd');

    // Si aucune date n'est définie, désactiver le toggle
    if (!start || !end) {
      setIsPlanned(false);
      return;
    }

    // Sinon, réinitialiser les valeurs temporaires depuis le formulaire
    const startDateTime = parseIsoToDateTime(start);
    const endDateTime = parseIsoToDateTime(end);

    setTempStartDate(startDateTime.date);
    setTempStartTime(startDateTime.time);
    setTempEndDate(endDateTime.date);
    setTempEndTime(endDateTime.time);
  }, [form, parseIsoToDateTime]);

  return (
    <div className="grid gap-3">
      {/* Switch pour activer/désactiver la planification */}
      <div className="flex items-center gap-3">
        <Switch
          checked={isPlanned}
          onCheckedChange={handleToggle}
          id="plan-activity"
        />
        <label
          htmlFor="plan-activity"
          className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
        >
          Planifier l'activité
        </label>
      </div>
      
      {/* Affichage des dates planifiées (si présentes) */}
      {isPlanned && plannedStart && plannedEnd && typeof plannedStart === 'string' && typeof plannedEnd === 'string' && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="font-medium text-slate-700 dark:text-slate-300 mb-1">
            Dates planifiées
          </div>
          <div className="text-slate-600 dark:text-slate-400">
            <div>Début : {new Date(plannedStart).toLocaleString('fr-FR')}</div>
            <div>Fin : {new Date(plannedEnd).toLocaleString('fr-FR')}</div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => setDialogOpen(true)}
          >
            Modifier les dates
          </Button>
        </div>
      )}
      
      {/* Messages d'erreur */}
      {errors.plannedStart && (
        <p className="text-xs text-status-danger">{errors.plannedStart.message}</p>
      )}
      {errors.plannedEnd && (
        <p className="text-xs text-status-danger">{errors.plannedEnd.message}</p>
      )}
      
      {/* Dialog pour saisir les dates */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        if (!open) {
          handleCancelDialog();
        } else {
          setDialogOpen(true);
        }
      }}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Planifier l'activité</DialogTitle>
            <DialogDescription>
              Définissez les dates de début et de fin de l'activité
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <DateTimePicker
              label="Date de début"
              date={tempStartDate}
              time={tempStartTime}
              onDateChange={setTempStartDate}
              onTimeChange={setTempStartTime}
              required
              id="start-datetime"
            />

            <DateTimePicker
              label="Date de fin"
              date={tempEndDate}
              time={tempEndTime}
              onDateChange={setTempEndDate}
              onTimeChange={setTempEndTime}
              required
              id="end-datetime"
            />
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelDialog}
              className="w-full sm:w-auto"
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleValidateDates}
              disabled={!tempStartDate || !tempEndDate || !tempStartTime || !tempEndTime}
              className="w-full sm:w-auto"
            >
              Valider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}