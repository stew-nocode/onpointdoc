'use client';

import { useState, useMemo } from 'react';

type MultiSelectOption = {
  value: string;
  label: string;
};

type UseMultiSelectFilterOptions = {
  options: MultiSelectOption[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
};

/**
 * Hook pour gérer l'état et la logique d'un filtre multi-select
 *
 * @param options - Options disponibles
 * @param selectedValues - Valeurs actuellement sélectionnées
 * @param onSelectionChange - Callback appelé lors du changement de sélection
 * @returns État et fonctions pour gérer le filtre
 */
export function useMultiSelectFilter({
  options,
  selectedValues,
  onSelectionChange
}: UseMultiSelectFilterOptions) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  /**
   * Filtre les options selon la recherche
   */
  const filteredOptions = useMemo(() => {
    if (!search) return options;

    const searchLower = search.toLowerCase();
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(searchLower) ||
        option.value.toLowerCase().includes(searchLower)
    );
  }, [options, search]);

  /**
   * Bascule la sélection d'une valeur
   */
  function toggleValue(value: string): void {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];

    onSelectionChange(newValues);
  }

  /**
   * Supprime une valeur sélectionnée
   */
  function removeValue(value: string): void {
    onSelectionChange(selectedValues.filter((v) => v !== value));
  }

  /**
   * Efface toutes les sélections
   */
  function clearAll(): void {
    onSelectionChange([]);
  }

  return {
    open,
    setOpen,
    search,
    setSearch,
    filteredOptions,
    toggleValue,
    removeValue,
    clearAll
  };
}

