'use client';

import { Button } from '@/ui/button';
import { cn } from '@/lib/utils';

type JiraSyncFilterProps = {
  hasJiraSync: boolean | null;
  onJiraSyncChange: (hasJiraSync: boolean | null) => void;
};

/**
 * Composant pour filtrer par synchronisation JIRA
 * 
 * @param hasJiraSync - État actuel du filtre (true = avec Jira, false = sans Jira, null = tous)
 * @param onJiraSyncChange - Callback appelé lors du changement
 */
export function JiraSyncFilter({ hasJiraSync, onJiraSyncChange }: JiraSyncFilterProps) {
  /**
   * Bascule le filtre JIRA
   */
  function toggleFilter(): void {
    if (hasJiraSync === null) {
      onJiraSyncChange(true);
    } else if (hasJiraSync === true) {
      onJiraSyncChange(false);
    } else {
      onJiraSyncChange(null);
    }
  }

  /**
   * Obtient le texte du bouton
   */
  function getButtonText(): string {
    if (hasJiraSync === true) return 'Avec JIRA';
    if (hasJiraSync === false) return 'Sans JIRA';
    return 'Tous (JIRA)';
  }

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
        Synchronisation JIRA
      </label>
      <Button
        type="button"
        variant="outline"
        onClick={toggleFilter}
        className={cn(
          'w-full justify-start font-normal',
          hasJiraSync !== null && 'bg-slate-100 dark:bg-slate-800'
        )}
      >
        {getButtonText()}
      </Button>
    </div>
  );
}

