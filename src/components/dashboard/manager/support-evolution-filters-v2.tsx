/**
 * Filtres pour le widget Support Evolution - VERSION 2
 * 
 * Filtres simplifiés selon la nouvelle spécification:
 * - Période (Semaine/Mois/Trimestre/Année + Années précédentes)
 * - Agent(s) Support (multi-sélection)
 * - Dimension(s) (BUG, REQ, ASSISTANCE, Temps, Tâches, Activités)
 */

'use client';

import { useState } from 'react';
import { Button } from '@/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/popover';
import { Checkbox } from '@/ui/checkbox';
import { Label } from '@/ui/label';
// Note: Utiliser un composant Select personnalisé ou un Input avec dropdown
// Pour l'instant, utilisons un simple input pour les années
import { Input } from '@/ui/input';
import { ScrollArea } from '@/ui/scroll-area';
import { Separator } from '@/ui/separator';
import { Filter, X } from 'lucide-react';
import type { SupportDimension } from '@/types/dashboard-support-evolution';
import { cn } from '@/lib/utils';

type SupportEvolutionFiltersV2Props = {
  selectedAgents: string[];
  selectedDimensions: SupportDimension[];
  agents: Array<{ id: string; name: string }>;
  availableDimensions: SupportDimension[];
  onAgentsChange: (agentIds: string[]) => void;
  onDimensionsChange: (dimensions: SupportDimension[]) => void;
  onApply?: () => void; // Callback pour appliquer les filtres (optionnel pour compatibilité)
};

/**
 * Dimensions disponibles avec labels
 */
const DIMENSION_LABELS: Record<SupportDimension, string> = {
  BUG: 'BUG',
  REQ: 'Requête',
  ASSISTANCE: 'Assistance',
  assistanceTime: 'Temps d\'assistance',
  tasks: 'Tâches',
  activities: 'Activités',
};


/**
 * Filtres pour le widget Support Evolution V2
 */
export function SupportEvolutionFiltersV2({
  selectedAgents,
  selectedDimensions,
  agents,
  availableDimensions,
  onAgentsChange,
  onDimensionsChange,
  onApply,
}: SupportEvolutionFiltersV2Props) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // État draft pour les filtres (modifications non appliquées)
  const [draftAgents, setDraftAgents] = useState<string[]>(selectedAgents);
  const [draftDimensions, setDraftDimensions] = useState<SupportDimension[]>(selectedDimensions);

  // Synchroniser les drafts avec les props quand le popover s'ouvre
  const handleOpenChange = (open: boolean) => {
    setIsFiltersOpen(open);
    if (open) {
      // Réinitialiser les drafts avec les valeurs actuelles
      setDraftAgents([...selectedAgents]);
      setDraftDimensions([...selectedDimensions]);
    }
  };

  // Appliquer les filtres draft
  const handleApply = () => {
    onAgentsChange(draftAgents);
    onDimensionsChange(draftDimensions);
    if (onApply) {
      onApply();
    }
    setIsFiltersOpen(false);
  };

  // Réinitialiser les drafts aux valeurs actuelles
  const handleReset = () => {
    setDraftAgents([...selectedAgents]);
    setDraftDimensions([...selectedDimensions]);
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

  const handleDimensionToggle = (dimension: SupportDimension, checked: boolean) => {
    if (checked) {
      setDraftDimensions([...draftDimensions, dimension]);
    } else {
      setDraftDimensions(draftDimensions.filter(d => d !== dimension));
    }
  };

  const handleSelectAllDimensions = () => {
    setDraftDimensions([...availableDimensions]);
  };

  const hasActiveFilters =
    selectedAgents.length > 0 ||
    selectedDimensions.length !== availableDimensions.length;

  const activeFiltersCount =
    (selectedAgents.length > 0 ? 1 : 0) +
    (selectedDimensions.length !== availableDimensions.length ? 1 : 0);

  // Vérifier si les drafts ont changé
  const hasDraftChanges =
    draftAgents.length !== selectedAgents.length ||
    draftAgents.some(id => !selectedAgents.includes(id)) ||
    draftDimensions.length !== selectedDimensions.length ||
    draftDimensions.some(d => !selectedDimensions.includes(d));

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
        className="w-96" 
        align="end"
        onPointerDownOutside={(e) => {
          // Empêcher la fermeture lors des clics sur les éléments interactifs à l'intérieur
          const target = e.target as HTMLElement;
          // Si le clic est à l'intérieur du PopoverContent, ne pas fermer
          const popoverContent = target.closest('[data-radix-popover-content]');
          if (popoverContent) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          // Permettre la fermeture avec Escape, mais réinitialiser les drafts
          handleReset();
        }}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">Filtres Locaux</h4>
            <p className="text-xs text-slate-500">
              Ajustez les paramètres du graphique
            </p>
          </div>
          <Separator />

          {/* Dimensions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Dimensions</Label>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectAllDimensions();
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
                    setDraftDimensions([]);
                  }}
                  className="h-6 text-xs"
                >
                  Rien
                </Button>
              </div>
            </div>
            <ScrollArea className="h-32 rounded-md border p-2">
              <div className="space-y-2">
                {availableDimensions.map((dimension) => (
                  <div key={dimension} className="flex items-center space-x-2">
                    <Checkbox
                      id={`dimension-${dimension}`}
                      checked={draftDimensions.includes(dimension)}
                      onCheckedChange={(checked) =>
                        handleDimensionToggle(dimension, checked === true)
                      }
                    />
                    <Label
                      htmlFor={`dimension-${dimension}`}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {DIMENSION_LABELS[dimension]}
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
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

