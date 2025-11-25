'use client';

type FiltersSidebarSearchInputProps = {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
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
  onChange
}: FiltersSidebarSearchInputProps) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-500 dark:border-slate-700 dark:bg-slate-900"
    />
  );
}


