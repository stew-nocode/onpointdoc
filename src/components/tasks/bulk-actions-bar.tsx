'use client';

import { CheckSquare2, X } from 'lucide-react';
import { Button } from '@/ui/button';
import { Badge } from '@/ui/badge';
import type { TaskWithRelations } from '@/types/task-with-relations';

type BulkActionsBarProps = {
  selectedTaskIds: string[];
  tasks: TaskWithRelations[];
  onClearSelection: () => void;
};

/**
 * Barre d'actions flottante affichée quand des tâches sont sélectionnées
 * 
 * Pattern similaire à BulkActionsBar pour activités
 * 
 * Version simplifiée pour l'instant - actions en masse à implémenter plus tard
 */
export function BulkActionsBar({
  selectedTaskIds,
  tasks,
  onClearSelection
}: BulkActionsBarProps) {
  if (selectedTaskIds.length === 0) {
    return null;
  }

  return (
    <div className="sticky bottom-0 z-50 mx-auto mb-4 flex w-full max-w-7xl items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <CheckSquare2 className="h-5 w-5 text-brand" />
          <Badge variant="outline" className="text-sm">
            {selectedTaskIds.length} tâche{selectedTaskIds.length > 1 ? 's' : ''} sélectionnée
            {selectedTaskIds.length > 1 ? 's' : ''}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="h-8 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          <X className="h-4 w-4 mr-1" />
          Désélectionner
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {/* TODO: Ajouter les actions en masse (modifier statut, exporter, etc.) plus tard */}
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Actions en masse à venir
        </p>
      </div>
    </div>
  );
}
