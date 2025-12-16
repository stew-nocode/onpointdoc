/**
 * Section Entités liées du formulaire d'activité
 * 
 * Composant atomique pour respecter les principes Clean Code (< 100 lignes)
 * Utilise une approche en 2 étapes : sélection du type puis recherche
 */

'use client';

import { useState, useMemo } from 'react';
import { useWatch } from 'react-hook-form';
import type { CreateActivityInput } from '@/lib/validators/activity';
import type { UseFormReturn } from 'react-hook-form';
import type { LinkableEntityType } from '@/types/activity-links';
import { EntityTypeSelector } from './entity-type-selector';
import { LinkSearchField } from './link-search-field';
import { X } from 'lucide-react';

type ActivityTicketsSectionProps = {
  form: UseFormReturn<CreateActivityInput>;
};

/**
 * Section pour sélectionner les entités liées à l'activité
 * 
 * @param form - Instance du formulaire React Hook Form
 */
export function ActivityTicketsSection({ form }: ActivityTicketsSectionProps) {
  // Utiliser useWatch pour optimiser les re-renders (isole les re-renders au niveau du hook)
  const selectedIds = useWatch({
    control: form.control,
    name: 'linkedTicketIds',
    defaultValue: []
  }) || [];
  const [entityType, setEntityType] = useState<LinkableEntityType | null>(null);

  // Gérer la sélection depuis LinkSearchField
  const handleSelectionChange = (ids: string[]) => {
    form.setValue('linkedTicketIds', ids);
  };

  // Retirer un ID de la sélection
  const handleRemove = (idToRemove: string) => {
    const newIds = selectedIds.filter(id => id !== idToRemove);
    form.setValue('linkedTicketIds', newIds);
  };

  return (
    <div className="grid gap-3">
      <EntityTypeSelector
        value={entityType}
        onValueChange={setEntityType}
      />
      
      {entityType && (
        <LinkSearchField
          entityType={entityType}
          selectedIds={selectedIds}
          onSelectionChange={handleSelectionChange}
        />
      )}
      
      {/* Affichage des entités sélectionnées */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 border border-slate-200 rounded-lg dark:border-slate-700">
          {selectedIds.map((id) => (
            <span
              key={id}
              className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800"
            >
              {id.substring(0, 8)}...
              <button
                type="button"
                onClick={() => handleRemove(id)}
                className="rounded p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700"
                aria-label={`Retirer ${id}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
