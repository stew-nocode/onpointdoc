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
  // TODO: URGENT - Composant désactivé car 'dueDate' n'existe pas dans CreateTaskInput
  // Actions requises :
  // 1. Vérifier si dueDate doit être ajouté au schéma task dans src/lib/validators/task.ts
  // 2. Si oui : ajouter dueDate à la table tasks via migration SQL
  // 3. Si non : retirer ce composant complètement du TaskForm
  // 4. Mettre à jour la documentation si ce champ a été retiré intentionnellement
  return null;

}
