/**
 * Section Planification du formulaire de tâche
 * 
 * Composant atomique pour respecter les principes Clean Code
 * Utilise un Switch pour activer/désactiver la planification
 * Affiche un Dialog pour saisir date de début + durée estimée
 * Intègre la barre de charge de travail (WorkloadBar)
 * 
 * Principe Clean Code :
 * - Composant < 100 lignes (logique déléguée aux hooks/services)
 * - Présentation uniquement (logique dans useWorkloadForDate)
 * - Props typées explicitement
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Label } from '@/ui/label';
import { Input } from '@/ui/input';
import { DateTimePicker } from '../../activity-form/sections/date-time-picker';
import { WorkloadBar } from '@/components/tasks/workload-bar';
import { useWorkloadForDate } from '@/hooks/tasks/use-workload-for-date';

type TaskPlanningSectionProps = {
  form: UseFormReturn<CreateTaskInput>;
};

/**
 * Section pour gérer la planification de la tâche
 * 
 * @param form - Instance du formulaire React Hook Form
 */
export function TaskPlanningSection({ form }: TaskPlanningSectionProps) {
  const { errors } = form.formState;

  // État pour contrôler l'ouverture du Dialog
  const [dialogOpen, setDialogOpen] = useState(false);

  // États temporaires pour le Dialog
  const [tempStartDate, setTempStartDate] = useState<Date | undefined>(undefined);
  const [tempStartTime, setTempStartTime] = useState<string>('09:00');
  const [tempDuration, setTempDuration] = useState<string>('');

  // Watch des valeurs du formulaire
  const startDate = useWatch({ control: form.control, name: 'startDate' });
  const estimatedDurationHours = useWatch({ control: form.control, name: 'estimatedDurationHours' });
  const assignedTo = useWatch({ control: form.control, name: 'assignedTo' });

  // Calculer hasPlanning comme valeur dérivée au lieu d'utiliser useEffect
  const hasPlanning = useMemo(() => {
    return !!(
      startDate &&
      typeof startDate === 'string' &&
      startDate.trim().length > 0
    );
  }, [startDate]);

  // Calculer la date pour le hook de charge
  const dateForWorkload = useMemo(() => {
    if (!tempStartDate) return undefined;
    return new Date(
      tempStartDate.getFullYear(),
      tempStartDate.getMonth(),
      tempStartDate.getDate()
    );
  }, [tempStartDate]);

  // Récupérer la charge de travail
  const { workload, isLoading } = useWorkloadForDate({
    date: dateForWorkload,
    newTaskDuration: parseFloat(tempDuration) || 0,
    assignedTo: assignedTo as string | undefined
  });

  // Initialiser les valeurs temporaires quand le Dialog s'ouvre
  useEffect(() => {
    if (dialogOpen) {
      const currentStartDate = form.getValues('startDate');
      const currentDuration = form.getValues('estimatedDurationHours');
      
      if (currentStartDate) {
        const dateObj = new Date(currentStartDate);
        const dateOnly = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
        const time = `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;
        
        setTempStartDate(dateOnly);
        setTempStartTime(time);
      } else {
        setTempStartDate(undefined);
        setTempStartTime('09:00');
      }
      
      setTempDuration(currentDuration?.toString() || '');
    }
  }, [dialogOpen, form]);

  /**
   * Gère le changement du Switch
   */
  const handleToggle = useCallback((checked: boolean) => {
    if (!checked) {
      // Désactiver : nettoyer les valeurs
      form.setValue('startDate', undefined, { shouldValidate: false, shouldDirty: true });
      form.setValue('estimatedDurationHours', undefined, { shouldValidate: false, shouldDirty: true });
      form.clearErrors(['startDate', 'estimatedDurationHours']);
      setDialogOpen(false);
    } else {
      // Activer : ouvrir le Dialog
      setDialogOpen(true);
    }
  }, [form]);

  /**
   * Combine Date et time en string ISO
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

  /**
   * Valide et enregistre les valeurs depuis le Dialog
   */
  const handleValidate = useCallback(() => {
    if (!tempStartDate || !tempDuration) {
      return;
    }

    const duration = parseFloat(tempDuration);
    if (isNaN(duration) || duration <= 0) {
      return;
    }

    const dateIso = combineDateTime(tempStartDate, tempStartTime);
    if (!dateIso) {
      return;
    }

    // Enregistrer avec validation
    form.setValue('startDate', dateIso, { shouldValidate: true, shouldDirty: true });
    form.setValue('estimatedDurationHours', duration, { shouldValidate: true, shouldDirty: true });
    setDialogOpen(false);
  }, [tempStartDate, tempStartTime, tempDuration, form, combineDateTime]);

  /**
   * Annule la saisie dans le Dialog
   */
  const handleCancelDialog = useCallback(() => {
    setDialogOpen(false);
  }, []);

  return (
    <div className="grid gap-3">
      {/* Switch pour activer/désactiver la planification */}
      <div className="flex items-center gap-3">
        <Switch
          checked={hasPlanning}
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
      
      {/* Affichage de la planification (si présente) */}
      {hasPlanning && startDate && estimatedDurationHours && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="font-medium text-slate-700 dark:text-slate-300 mb-1">
            Planification
          </div>
          <div className="text-slate-600 dark:text-slate-400 space-y-1">
            <div>Date de début : {new Date(startDate).toLocaleString('fr-FR')}</div>
            <div>Durée estimée : {estimatedDurationHours}h</div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => setDialogOpen(true)}
          >
            Modifier la planification
          </Button>
        </div>
      )}
      
      {/* Messages d'erreur */}
      {errors.startDate && (
        <p className="text-xs text-status-danger">{errors.startDate.message}</p>
      )}
      {errors.estimatedDurationHours && (
        <p className="text-xs text-status-danger">{errors.estimatedDurationHours.message}</p>
      )}
      
      {/* Dialog pour saisir la planification */}
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
              Définissez la date de début et la durée estimée
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

            <div className="grid gap-2">
              <Label htmlFor="duration-hours">Durée estimée (heures)</Label>
              <Input
                id="duration-hours"
                type="number"
                step="0.5"
                min="0.5"
                value={tempDuration}
                onChange={(e) => setTempDuration(e.target.value)}
                placeholder="Ex: 2.5"
              />
            </div>

            {/* Barre de charge de travail */}
            {tempStartDate && tempDuration && !isNaN(parseFloat(tempDuration)) && workload && (
              <div className="mt-2">
                <Label className="mb-2 block">Charge de travail</Label>
                <WorkloadBar workload={workload} showDetails={true} />
              </div>
            )}
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
              onClick={handleValidate}
              disabled={!tempStartDate || !tempDuration || isNaN(parseFloat(tempDuration)) || parseFloat(tempDuration) <= 0}
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

