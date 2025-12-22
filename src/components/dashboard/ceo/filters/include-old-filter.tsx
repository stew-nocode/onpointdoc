'use client';

import { Label } from '@/ui/label';
import { Switch } from '@/ui/switch';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/ui/tooltip';

type IncludeOldFilterProps = {
  includeOld: boolean;
  onIncludeOldChange: (includeOld: boolean) => void;
};

/**
 * Filtre pour inclure/exclure les données anciennes (old = true)
 * 
 * Par défaut, les données anciennes sont exclues car elles peuvent être
 * imprécises ou incomplètes. Les utilisateurs peuvent activer ce toggle
 * pour les inclure dans les calculs du dashboard.
 * 
 * @param includeOld - État actuel du toggle
 * @param onIncludeOldChange - Callback lors du changement
 */
export function IncludeOldFilter({
  includeOld,
  onIncludeOldChange
}: IncludeOldFilterProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor="include-old-switch" className="text-sm font-medium">
            Inclure données anciennes
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  Les données anciennes (old = true) peuvent être imprécises.
                  Désactivé par défaut pour afficher uniquement les données récentes.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Switch
          id="include-old-switch"
          checked={includeOld}
          onCheckedChange={onIncludeOldChange}
        />
      </div>
      {includeOld && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          ⚠️ Les données anciennes sont incluses dans les calculs
        </p>
      )}
    </div>
  );
}



