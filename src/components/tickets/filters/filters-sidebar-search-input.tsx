'use client';

import { useId } from 'react';

type FiltersSidebarSearchInputProps = {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  id?: string;
  name?: string;
};

/**
 * Champ de recherche pour les filtres multi-select
 *
 * @param placeholder - Placeholder du champ
 * @param value - Valeur actuelle
 * @param onChange - Callback lors du changement
 */
export function FiltersSidebarSearchInput({
  placeholder = 'Rechercher...',
  value,
  onChange,
  label,
  id,
  name
}: FiltersSidebarSearchInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const resolvedLabel = label ?? placeholder;
  const inputName = name ?? inputId;

  return (
    <>
      <label htmlFor={inputId} className="sr-only">
        {resolvedLabel}
      </label>
      <input
        id={inputId}
        name={inputName}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-500 dark:border-slate-700 dark:bg-slate-900"
      />
    </>
  );
}


