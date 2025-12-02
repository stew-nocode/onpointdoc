/**
 * Filtres pour le widget Répartition par Entreprise
 * 
 * Filtre simplifié : uniquement les types de tickets (multi-sélection)
 */

'use client';

import { useState } from 'react';
import { Button } from '@/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/popover';
import { Checkbox } from '@/ui/checkbox';
import { Label } from '@/ui/label';
import { Separator } from '@/ui/separator';
import { Filter } from 'lucide-react';

type TicketType = 'BUG' | 'REQ' | 'ASSISTANCE';

type TicketsByCompanyPieChartFiltersProps = {
  selectedTicketTypes: TicketType[];
  onTicketTypesChange: (ticketTypes: TicketType[]) => void;
};

const ALL_TICKET_TYPES: TicketType[] = ['BUG', 'REQ', 'ASSISTANCE'];
const TICKET_TYPE_LABELS: Record<TicketType, string> = {
  BUG: 'BUG',
  REQ: 'Requête',
  ASSISTANCE: 'Assistance',
};

/**
 * Filtres pour le widget Répartition par Entreprise
 */
export function TicketsByCompanyPieChartFilters({
  selectedTicketTypes,
  onTicketTypesChange,
}: TicketsByCompanyPieChartFiltersProps) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // État draft pour les filtres (modifications non appliquées)
  const [draftTicketTypes, setDraftTicketTypes] = useState<TicketType[]>(selectedTicketTypes);

  // Synchroniser les drafts avec les props quand le popover s'ouvre
  const handleOpenChange = (open: boolean) => {
    setIsFiltersOpen(open);
    if (open) {
      // Réinitialiser les drafts avec les valeurs actuelles
      setDraftTicketTypes([...selectedTicketTypes]);
    }
  };

  // Appliquer les filtres draft
  const handleApply = () => {
    onTicketTypesChange(draftTicketTypes);
    setIsFiltersOpen(false);
  };

  // Réinitialiser les drafts aux valeurs actuelles
  const handleReset = () => {
    setDraftTicketTypes([...selectedTicketTypes]);
  };

  // Handlers pour les drafts (ne modifient que l'état local)
  const handleTicketTypeToggle = (ticketType: TicketType, checked: boolean) => {
    if (checked) {
      setDraftTicketTypes([...draftTicketTypes, ticketType]);
    } else {
      setDraftTicketTypes(draftTicketTypes.filter(type => type !== ticketType));
    }
  };

  const handleSelectAll = () => {
    setDraftTicketTypes([...ALL_TICKET_TYPES]);
  };

  const handleDeselectAll = () => {
    setDraftTicketTypes([]);
  };

  const hasActiveFilters = selectedTicketTypes.length > 0 && selectedTicketTypes.length < ALL_TICKET_TYPES.length;

  // Vérifier si les drafts ont changé
  const hasDraftChanges =
    draftTicketTypes.length !== selectedTicketTypes.length ||
    draftTicketTypes.some(type => !selectedTicketTypes.includes(type)) ||
    selectedTicketTypes.some(type => !draftTicketTypes.includes(type));

  return (
    <Popover open={isFiltersOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5">
          <Filter className="h-3.5 w-3.5" />
          Filtres
          {hasActiveFilters && (
            <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[10px] font-medium text-white">
              1
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
        onEscapeKeyDown={() => {
          handleReset();
        }}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">Filtres Locaux</h4>
            <p className="text-xs text-slate-500">
              Filtrer par type de ticket
            </p>
          </div>
          <Separator />

          {/* Types de Tickets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Types de Tickets ({draftTicketTypes.length === 0 ? 'Aucun' : draftTicketTypes.length === ALL_TICKET_TYPES.length ? 'Tous' : `${draftTicketTypes.length} sélectionné(s)`})
              </Label>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectAll();
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
                    handleDeselectAll();
                  }}
                  className="h-6 text-xs"
                >
                  Rien
                </Button>
              </div>
            </div>
            <div className="space-y-2 rounded-md border p-2">
              {ALL_TICKET_TYPES.map((ticketType) => (
                <div key={ticketType} className="flex items-center space-x-2">
                  <Checkbox
                    id={`ticket-type-${ticketType}`}
                    checked={draftTicketTypes.includes(ticketType)}
                    onCheckedChange={(checked) =>
                      handleTicketTypeToggle(ticketType, checked === true)
                    }
                  />
                  <Label
                    htmlFor={`ticket-type-${ticketType}`}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {TICKET_TYPE_LABELS[ticketType]}
                  </Label>
                </div>
              ))}
            </div>
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

