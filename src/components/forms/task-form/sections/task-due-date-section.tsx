/**
 * Section Date d'échéance du formulaire de tâche
 * 
 * Composant atomique pour respecter les principes Clean Code
 * Utilise un Switch pour activer/désactiver la planification
 * Affiche un Dialog pour saisir la date d'échéance si le Switch est activé
 * 
 * Différence avec ActivityDatesSection : une seule date (dueDate) au lieu de deux (plannedStart/plannedEnd)
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWatch } from 'react-hook-form';
import type { CreateTaskInput } from '@/lib/validators/task';
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
import { DateTimePicker } from '../../activity-form/sections/date-time-picker';

type TaskDueDateSectionProps = {
  form: UseFormReturn<CreateTaskInput>;
};

/**
 * Section pour gérer la date d'échéance de la tâche
 * 
 * @param form - Instance du formulaire React Hook Form
 */
export function TaskDueDateSection({ form }: TaskDueDateSectionProps) {
  const { errors } = form.formState;
  
  // État local pour le Switch (initialisé depuis les valeurs du formulaire)
  const [hasDueDate, setHasDueDate] = useState(() => {
    const dueDate = form.getValues('dueDate');
    return !!(dueDate && typeof dueDate === 'string' && dueDate.trim().length > 0);
  });
  
  // État pour contrôler l'ouverture du Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // États temporaires pour la date dans le Dialog
  // Séparés en Date (objet Date) et time (string HH:mm)
  const [tempDueDate, setTempDueDate] = useState<Date | undefined>(undefined);
  const [tempDueTime, setTempDueTime] = useState<string>('17:00');
  
  /**
   * Convertit une date ISO en objet Date (pour Calendar) et string time (pour input time)
   */
  const parseIsoToDateTime = useCallback((isoDate?: string): { date: Date | undefined; time: string } => {
    if (!isoDate) return { date: undefined, time: '17:00' };
    try {
      const dateObj = new Date(isoDate);
      if (isNaN(dateObj.getTime())) return { date: undefined, time: '17:00' };
      
      // Extraire la partie heure dans le fuseau horaire local (HH:mm)
      const hours = dateObj.getHours().toString().padStart(2, '0');
      const minutes = dateObj.getMinutes().toString().padStart(2, '0');
      const time = `${hours}:${minutes}`;
      
      // Créer une nouvelle Date avec seulement la partie date (sans heure) pour le Calendar
      const dateOnly = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
      
      return { date: dateOnly, time };
    } catch {
      return { date: undefined, time: '17:00' };
    }
  }, []);
  
  /**
   * Combine Date (objet Date du Calendar) et time (string HH:mm) en string ISO
   */
  const combineDateTime = useCallback((date: Date | undefined, time: string): string | undefined => {
    if (!date) return undefined;
    
    try {
      const [hours, minutes] = time.split(':').map(Number);
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
  
  // Utiliser useWatch pour optimiser les re-renders
  const dueDate = useWatch({
    control: form.control,
    name: 'dueDate'
  });
  
  useEffect(() => {
    const hasDate = !!(
      dueDate && 
      typeof dueDate === 'string' &&
      dueDate.trim().length > 0
    );
    setHasDueDate(hasDate);
  }, [dueDate]);
  
  // Initialiser les valeurs temporaires quand le Dialog s'ouvre
  useEffect(() => {
    if (dialogOpen) {
      const currentDueDate = form.getValues('dueDate');
      const dateTime = parseIsoToDateTime(currentDueDate);
      
      setTempDueDate(dateTime.date);
      setTempDueTime(dateTime.time);
    }
  }, [dialogOpen, form, parseIsoToDateTime]);
  
  /**
   * Gère le changement du Switch
   */
  const handleToggle = useCallback((checked: boolean) => {
    setHasDueDate(checked);
    
    if (!checked) {
      // Désactiver : nettoyer la date sans déclencher la validation
      form.setValue('dueDate', undefined, {
        shouldValidate: false,
        shouldDirty: true,
        shouldTouch: false
      });
      form.clearErrors(['dueDate']);
      setDialogOpen(false);
    } else {
      // Activer : ouvrir le Dialog pour saisir la date
      setDialogOpen(true);
    }
  }, [form]);
  
  /**
   * Valide et enregistre la date depuis le Dialog
   */
  const handleValidateDate = useCallback(() => {
    if (!tempDueDate) {
      return;
    }
    
    try {
      const dateIso = combineDateTime(tempDueDate, tempDueTime);
      
      if (!dateIso) {
        return;
      }
      
      // Enregistrer avec validation
      form.setValue('dueDate', dateIso, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true
      });
      
      setDialogOpen(false);
    } catch (error) {
      console.error('Erreur lors de la conversion de la date:', error);
    }
  }, [tempDueDate, tempDueTime, form, combineDateTime]);
  
  /**
   * Annule la saisie dans le Dialog
   * Si aucune date n'est définie, désactive le toggle
   */
  const handleCancelDialog = useCallback(() => {
    setDialogOpen(false);

    // Vérifier si une date est déjà définie dans le formulaire
    const currentDueDate = form.getValues('dueDate');

    // Si aucune date n'est définie, désactiver le toggle
    if (!currentDueDate) {
      setHasDueDate(false);
      return;
    }

    // Sinon, réinitialiser les valeurs temporaires depuis le formulaire
    const dateTime = parseIsoToDateTime(currentDueDate);
    setTempDueDate(dateTime.date);
    setTempDueTime(dateTime.time);
  }, [form, parseIsoToDateTime]);

  return (
    <div className="grid gap-3">
      {/* Switch pour activer/désactiver la planification */}
      <div className="flex items-center gap-3">
        <Switch
          checked={hasDueDate}
          onCheckedChange={handleToggle}
          id="plan-task"
        />
        <label
          htmlFor="plan-task"
          className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
        >
          Planifier la tâche
        </label>
      </div>
      
      {/* Affichage de la date d'échéance (si présente) */}
      {hasDueDate && dueDate && typeof dueDate === 'string' && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="font-medium text-slate-700 dark:text-slate-300 mb-1">
            Date d'échéance
          </div>
          <div className="text-slate-600 dark:text-slate-400">
            <div>Échéance : {new Date(dueDate).toLocaleString('fr-FR')}</div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => setDialogOpen(true)}
          >
            Modifier la date
          </Button>
        </div>
      )}
      
      {/* Messages d'erreur */}
      {errors.dueDate && (
        <p className="text-xs text-status-danger">{errors.dueDate.message}</p>
      )}
      
      {/* Dialog pour saisir la date */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        if (!open) {
          handleCancelDialog();
        } else {
          setDialogOpen(true);
        }
      }}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Planifier la tâche</DialogTitle>
            <DialogDescription>
              Définissez la date d'échéance de la tâche
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <DateTimePicker
              label="Date d'échéance"
              date={tempDueDate}
              time={tempDueTime}
              onDateChange={setTempDueDate}
              onTimeChange={setTempDueTime}
              required
              id="due-datetime"
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
              onClick={handleValidateDate}
              disabled={!tempDueDate || !tempDueTime}
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
