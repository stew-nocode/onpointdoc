/**
 * Filtres pour le widget Répartition par Type
 * 
 * Filtre simplifié : uniquement les agents Support (multi-sélection)
 */

'use client';

import { useState } from 'react';
import { Button } from '@/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/popover';
import { Checkbox } from '@/ui/checkbox';
import { Label } from '@/ui/label';
import { ScrollArea } from '@/ui/scroll-area';
import { Separator } from '@/ui/separator';
import { Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type TicketsByTypePieChartFiltersProps = {
  selectedAgents: string[];
  agents: Array<{ id: string; name: string }>;
  onAgentsChange: (agentIds: string[]) => void;
};

/**
 * Filtres pour le widget Répartition par Type
 */
export function TicketsByTypePieChartFilters({
  selectedAgents,
  agents,
  onAgentsChange,
}: TicketsByTypePieChartFiltersProps) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // État draft pour les filtres (modifications non appliquées)
  const [draftAgents, setDraftAgents] = useState<string[]>(selectedAgents);

  // Synchroniser les drafts avec les props quand le popover s'ouvre
  const handleOpenChange = (open: boolean) => {
    setIsFiltersOpen(open);
    if (open) {
      // Réinitialiser les drafts avec les valeurs actuelles
      setDraftAgents([...selectedAgents]);
    }
  };

  // Appliquer les filtres draft
  const handleApply = () => {
    onAgentsChange(draftAgents);
    setIsFiltersOpen(false);
  };

  // Réinitialiser les drafts aux valeurs actuelles
  const handleReset = () => {
    setDraftAgents([...selectedAgents]);
  };

  // Handlers pour les drafts (ne modifient que l'état local)
  const handleAgentToggle = (agentId: string, checked: boolean) => {
    if (checked) {
      setDraftAgents([...draftAgents, agentId]);
    } else {
      setDraftAgents(draftAgents.filter(id => id !== agentId));
    }
  };

  const handleSelectAllAgents = () => {
    setDraftAgents(agents.map(a => a.id));
  };

  const handleDeselectAllAgents = () => {
    setDraftAgents([]);
  };

  const hasActiveFilters = selectedAgents.length > 0;
  const activeFiltersCount = selectedAgents.length > 0 ? 1 : 0;

  // Vérifier si les drafts ont changé
  const hasDraftChanges =
    draftAgents.length !== selectedAgents.length ||
    draftAgents.some(id => !selectedAgents.includes(id));

  return (
    <Popover open={isFiltersOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5">
          <Filter className="h-3.5 w-3.5" />
          Filtres
          {hasActiveFilters && (
            <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[10px] font-medium text-white">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80"
        align="end"
        onPointerDownOutside={(e) => {
          const target = e.target as HTMLElement;
          const popoverContent = target.closest('[data-radix-popover-content]');
          if (popoverContent) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          handleReset();
        }}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">Filtres Locaux</h4>
            <p className="text-xs text-slate-500">
              Filtrer par agent Support
            </p>
          </div>
          <Separator />

          {/* Agents */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Agents ({draftAgents.length === 0 ? 'Tous' : `${draftAgents.length} sélectionné(s)`})
              </Label>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectAllAgents();
                  }}
                  className="h-6 text-xs"
                >
                  Tout
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeselectAllAgents();
                  }}
                  className="h-6 text-xs"
                >
                  Rien
                </Button>
              </div>
            </div>
            <ScrollArea className="h-40 rounded-md border p-2">
              <div className="space-y-2">
                {agents.map((agent) => (
                  <div key={agent.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`agent-${agent.id}`}
                      checked={draftAgents.includes(agent.id)}
                      onCheckedChange={(checked) =>
                        handleAgentToggle(agent.id, checked === true)
                      }
                    />
                    <Label
                      htmlFor={`agent-${agent.id}`}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {agent.name}
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Boutons d'action */}
          <Separator />
          <div className="flex gap-2">
            {hasDraftChanges && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReset();
                }}
                className="flex-1 h-8 text-xs"
              >
                Annuler
              </Button>
            )}
            <Button
              variant="default"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleApply();
              }}
              disabled={!hasDraftChanges}
              className="flex-1 h-8 text-xs"
            >
              Appliquer
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}


