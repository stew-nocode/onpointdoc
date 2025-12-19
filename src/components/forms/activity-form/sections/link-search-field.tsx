/**
 * Champ de recherche pour les entités liables
 * 
 * Composant atomique pour respecter les principes Clean Code (< 100 lignes)
 * Utilise useDeferredValue pour une recherche non-bloquante
 */

'use client';

import { useState, useMemo } from 'react';
import { INPUT_CLASS } from '@/lib/constants/form-styles';
import { useSearchLinks } from '@/hooks/activities/use-search-links';
import type { LinkableEntityType } from '@/types/activity-links';
import { Loader2 } from 'lucide-react';

type LinkSearchFieldProps = {
  entityType: LinkableEntityType | null;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
};

/**
 * Champ de recherche pour trouver et sélectionner des entités liables
 * 
 * @param entityType - Type d'entité à rechercher
 * @param selectedIds - IDs des entités actuellement sélectionnées
 * @param onSelectionChange - Callback appelé quand la sélection change
 */
export function LinkSearchField({
  entityType,
  selectedIds,
  onSelectionChange
}: LinkSearchFieldProps) {
  const [searchKey, setSearchKey] = useState('');
  
  // Utiliser le hook personnalisé avec useDeferredValue
  const { results, isSearching, error } = useSearchLinks(entityType, searchKey);

  // Options pour le Combobox (formatées pour l'affichage)
  const options = useMemo(() => {
    return results.map((entity) => ({
      value: entity.id,
      label: `${entity.displayKey}: ${entity.title}`,
      searchable: `${entity.displayKey} ${entity.title} ${entity.metadata?.status || ''}`
    }));
  }, [results]);

  // Vérifier si une option est déjà sélectionnée
  const isSelected = (entityId: string) => selectedIds.includes(entityId);

  // Gérer la sélection depuis le Combobox
  const handleSelect = (selectedId: string) => {
    if (!selectedId) return;
    
    if (isSelected(selectedId)) {
      // Retirer de la sélection
      onSelectionChange(selectedIds.filter(id => id !== selectedId));
    } else {
      // Ajouter à la sélection
      onSelectionChange([...selectedIds, selectedId]);
    }
    
    // Réinitialiser le champ de recherche après sélection
    setSearchKey('');
  };

  // Placeholder dynamique selon le type
  const placeholder = useMemo(() => {
    if (!entityType) return 'Sélectionnez d\'abord un type d\'entité';
    
    const placeholders: Record<LinkableEntityType, string> = {
      task: 'Rechercher une tâche (ID ou titre)...',
      bug: 'Rechercher un bug (PROJ-123, ID ou titre)...',
      assistance: 'Rechercher une assistance (ID ou titre)...',
      request: 'Rechercher une requête (PROJ-123, ID ou titre)...',
      followup: 'Rechercher une relance (ID ou contenu)...',
      activity: 'Rechercher une activité (ID ou titre)...'
    };
    
    return placeholders[entityType];
  }, [entityType]);

  // Message d'erreur si présent
  if (error) {
    return (
      <div className="grid gap-2">
        <input
          className={INPUT_CLASS}
          placeholder={placeholder}
          value={searchKey}
          onChange={(e) => setSearchKey(e.target.value)}
          disabled={!entityType}
        />
        <p className="text-xs text-status-danger">{error}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <div className="relative">
        <input
          className={INPUT_CLASS}
          placeholder={placeholder}
          value={searchKey}
          onChange={(e) => setSearchKey(e.target.value)}
          disabled={!entityType}
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          </div>
        )}
      </div>
      
      {/* Liste des résultats de recherche */}
      {searchKey.length >= 2 && results.length > 0 && (
        <div className="border border-slate-200 rounded-lg p-1 max-h-[200px] overflow-y-auto dark:border-slate-700">
          {results.map((entity) => {
            const selected = isSelected(entity.id);
            return (
              <div
                key={entity.id}
                onClick={() => handleSelect(entity.id)}
                className={`
                  flex items-center gap-2 p-2 rounded cursor-pointer transition-colors
                  ${selected 
                    ? 'bg-brand/10 border border-brand' 
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
                  }
                `}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => handleSelect(entity.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {entity.displayKey}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 truncate">
                    {entity.title}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Message si aucun résultat */}
      {searchKey.length >= 2 && !isSearching && results.length === 0 && (
        <p className="text-xs text-slate-500">Aucun résultat trouvé</p>
      )}
    </div>
  );
}
