/**
 * Composant MultiSelect générique pour sélectionner plusieurs éléments
 * 
 * Utilise ShadCN Checkbox pour une sélection multiple avec recherche
 */

'use client';

import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/ui/button';
import { Checkbox } from '@/ui/checkbox';
import * as PopoverPrimitive from '@radix-ui/react-popover';

type MultiSelectOption = {
  value: string;
  label: string;
  searchable?: string;
};

type MultiSelectProps = {
  options: MultiSelectOption[];
  value: string[];
  onValueChange: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
};

/**
 * Composant MultiSelect pour sélectionner plusieurs éléments
 * 
 * @param options - Liste des options disponibles
 * @param value - Tableau des valeurs actuellement sélectionnées
 * @param onValueChange - Callback appelé quand la sélection change
 */
export function MultiSelect({
  options,
  value,
  onValueChange,
  placeholder = 'Sélectionner...',
  searchPlaceholder = 'Rechercher...',
  emptyText = 'Aucun résultat',
  disabled = false,
  className
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const filteredOptions = useMemo(() => {
    if (!search) return options;
    const searchLower = search.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(searchLower) ||
        opt.searchable?.toLowerCase().includes(searchLower)
    );
  }, [options, search]);
  
  const selectedOptions = useMemo(() => {
    return options.filter((opt) => value.includes(opt.value));
  }, [options, value]);
  
  const handleToggle = (optionValue: string, checked: boolean) => {
    if (checked) {
      onValueChange([...value, optionValue]);
    } else {
      onValueChange(value.filter((v) => v !== optionValue));
    }
  };
  
  const handleRemove = (optionValue: string) => {
    onValueChange(value.filter((v) => v !== optionValue));
  };
  
  return (
    <div className={cn('grid gap-2', className)}>
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen} modal={false}>
        <PopoverPrimitive.Trigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-full justify-between font-normal',
              value.length === 0 && 'text-slate-500',
              className
            )}
            disabled={disabled}
            type="button"
          >
            {value.length > 0
              ? `${value.length} élément(s) sélectionné(s)`
              : placeholder}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="ml-2 h-4 w-4 shrink-0 opacity-50"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </Button>
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            className={cn(
              'z-[100] w-[var(--radix-popover-trigger-width)] rounded-md border border-slate-200 bg-white p-1 shadow-md dark:border-slate-800 dark:bg-slate-950'
            )}
            align="start"
            sideOffset={4}
          >
            <div className="flex items-center border-b border-slate-200 px-3 dark:border-slate-800">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50 dark:placeholder:text-slate-400"
              />
            </div>
            <div
              className="max-h-[300px] overflow-y-auto overscroll-contain p-1"
              onWheel={(e) => {
                e.stopPropagation();
              }}
            >
              {filteredOptions.length === 0 ? (
                <div className="py-6 text-center text-sm text-slate-500">{emptyText}</div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = value.includes(option.value);
                  
                  return (
                    <div
                      key={option.value}
                      className={cn(
                        'flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors',
                        'hover:bg-slate-100 dark:hover:bg-slate-800',
                        isSelected && 'bg-slate-100 dark:bg-slate-800'
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleToggle(option.value, checked === true)}
                        id={`option-${option.value}`}
                      />
                      <label
                        htmlFor={`option-${option.value}`}
                        className="flex-1 cursor-pointer"
                      >
                        {option.label}
                      </label>
                    </div>
                  );
                })
              )}
            </div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
      
      {/* Affichage des éléments sélectionnés */}
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedOptions.map((option) => (
            <span
              key={option.value}
              className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800"
            >
              {option.label}
              <button
                type="button"
                onClick={() => handleRemove(option.value)}
                className="rounded p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700"
                aria-label={`Retirer ${option.label}`}
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
