'use client';

import { useState } from 'react';
import { Button } from '@/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/ui/dialog';
import { Settings2, Check } from 'lucide-react';
import {
  AVAILABLE_TASK_COLUMNS,
  getVisibleTaskColumns,
  saveVisibleTaskColumns,
  resetTaskColumnsToDefault,
  type TaskColumnId
} from '@/lib/utils/task-column-preferences';

type TasksColumnsConfigDialogProps = {
  onColumnsChange?: (visibleColumns: Set<TaskColumnId>) => void;
};

/**
 * Composant de dialogue pour configurer les colonnes visibles dans le tableau des tâches
 * 
 * Pattern similaire à ActivitiesColumnsConfigDialog pour cohérence
 * 
 * Principe Clean Code :
 * - SRP : Gère uniquement la configuration des colonnes
 * - Utilise localStorage pour persister les préférences
 * - Props typées explicitement
 */
export function TasksColumnsConfigDialog({ 
  onColumnsChange 
}: TasksColumnsConfigDialogProps) {
  const [open, setOpen] = useState(false);
  // Initialiser directement avec les colonnes visibles pour éviter setState dans useEffect
  const [visibleColumns, setVisibleColumns] = useState<Set<TaskColumnId>>(() => 
    getVisibleTaskColumns()
  );

  const handleToggleColumn = (columnId: TaskColumnId) => {
    const column = AVAILABLE_TASK_COLUMNS.find(col => col.id === columnId);
    // Empêcher de masquer les colonnes requises
    if (column?.required) return;

    setVisibleColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(columnId)) {
        newSet.delete(columnId);
      } else {
        newSet.add(columnId);
      }
      return newSet;
    });
  };

  const handleSave = () => {
    saveVisibleTaskColumns(visibleColumns);
    onColumnsChange?.(visibleColumns);
    setOpen(false);
  };

  const handleReset = () => {
    const defaultColumns = resetTaskColumnsToDefault();
    setVisibleColumns(defaultColumns);
    onColumnsChange?.(defaultColumns);
  };

  const handleCancel = () => {
    // Recharger les colonnes depuis localStorage
    setVisibleColumns(getVisibleTaskColumns());
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setVisibleColumns(getVisibleTaskColumns())}
        >
          <Settings2 className="h-4 w-4" />
          Colonnes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configurer les colonnes</DialogTitle>
          <DialogDescription>
            Choisissez les colonnes à afficher dans le tableau des tâches.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {AVAILABLE_TASK_COLUMNS.map(column => {
              const isVisible = visibleColumns.has(column.id);
              const isRequired = column.required;

              return (
                <label
                  key={column.id}
                  className={`flex items-center gap-3 rounded-md p-3 cursor-pointer transition-colors ${
                    isRequired
                      ? 'bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed opacity-75'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="relative flex items-center justify-center h-4 w-4">
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={() => handleToggleColumn(column.id)}
                      disabled={isRequired}
                      className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand disabled:cursor-not-allowed dark:border-slate-600 appearance-none checked:bg-brand checked:border-brand"
                    />
                    {isVisible && (
                      <Check className="absolute left-0.5 top-0.5 h-3 w-3 text-white pointer-events-none" />
                    )}
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {column.label}
                    </span>
                    {isRequired && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        (Requis)
                      </p>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-xs"
            >
              Réinitialiser
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                Annuler
              </Button>
              <Button size="sm" onClick={handleSave}>
                Enregistrer
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
