/**
 * Section Liens du formulaire de tâche
 * 
 * Composant atomique pour respecter les principes Clean Code
 * Deux sous-sections : Tickets liés + Activités liées
 * 
 * Pattern adapté depuis ActivityTicketsSection
 */

'use client';

import { useState, useMemo } from 'react';
import { useWatch } from 'react-hook-form';
import type { CreateTaskInput } from '@/lib/validators/task';
import type { UseFormReturn } from 'react-hook-form';
import type { LinkableEntityType } from '@/types/activity-links';
import { EntityTypeSelector } from '../../activity-form/sections/entity-type-selector';
import { LinkSearchField } from '../../activity-form/sections/link-search-field';
import { X } from 'lucide-react';

type TaskLinksSectionProps = {
  form: UseFormReturn<CreateTaskInput>;
};

/**
 * Section pour sélectionner les tickets et activités liés à la tâche
 * 
 * @param form - Instance du formulaire React Hook Form
 */
export function TaskLinksSection({ form }: TaskLinksSectionProps) {
  // Utiliser useWatch pour optimiser les re-renders
  const linkedTicketIds = useWatch({
    control: form.control,
    name: 'linkedTicketIds',
    defaultValue: []
  }) || [];
  
  const linkedActivityIds = useWatch({
    control: form.control,
    name: 'linkedActivityIds',
    defaultValue: []
  }) || [];

  const [ticketEntityType, setTicketEntityType] = useState<LinkableEntityType | null>(null);

  // Gérer la sélection des tickets depuis LinkSearchField
  const handleTicketSelectionChange = (ids: string[]) => {
    form.setValue('linkedTicketIds', ids);
  };

  // Gérer la sélection des activités depuis LinkSearchField
  const handleActivitySelectionChange = (ids: string[]) => {
    form.setValue('linkedActivityIds', ids);
  };

  // Retirer un ID de la sélection des tickets
  const handleRemoveTicket = (idToRemove: string) => {
    const newIds = linkedTicketIds.filter(id => id !== idToRemove);
    form.setValue('linkedTicketIds', newIds);
  };

  // Retirer un ID de la sélection des activités
  const handleRemoveActivity = (idToRemove: string) => {
    const newIds = linkedActivityIds.filter(id => id !== idToRemove);
    form.setValue('linkedActivityIds', newIds);
  };

  return (
    <div className="grid gap-6">
      {/* Section Tickets liés */}
      <div className="grid gap-3">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Tickets liés
        </label>
        <EntityTypeSelector
          value={ticketEntityType}
          onValueChange={setTicketEntityType}
        />
        
        {ticketEntityType && (
          <LinkSearchField
            entityType={ticketEntityType}
            selectedIds={linkedTicketIds}
            onSelectionChange={handleTicketSelectionChange}
          />
        )}
        
        {/* Affichage des tickets sélectionnés */}
        {linkedTicketIds.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2 border border-slate-200 rounded-lg dark:border-slate-700">
            {linkedTicketIds.map((id) => (
              <span
                key={id}
                className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800"
              >
                {id.substring(0, 8)}...
                <button
                  type="button"
                  onClick={() => handleRemoveTicket(id)}
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

      {/* Section Activités liées */}
      <div className="grid gap-3">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Activités liées
        </label>
        <LinkSearchField
          entityType="activity"
          selectedIds={linkedActivityIds}
          onSelectionChange={handleActivitySelectionChange}
        />
        
        {/* Affichage des activités sélectionnées */}
        {linkedActivityIds.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2 border border-slate-200 rounded-lg dark:border-slate-700">
            {linkedActivityIds.map((id) => (
              <span
                key={id}
                className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800"
              >
                {id.substring(0, 8)}...
                <button
                  type="button"
                  onClick={() => handleRemoveActivity(id)}
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
    </div>
  );
}
