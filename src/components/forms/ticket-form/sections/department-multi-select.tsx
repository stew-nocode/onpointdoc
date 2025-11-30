/**
 * Composant MultiSelect pour sélectionner plusieurs départements
 * 
 * Utilise ShadCN Checkbox pour une sélection multiple avec recherche
 * Affiche les départements sélectionnés avec possibilité de retirer
 */

'use client';

import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/ui/button';
import { Checkbox } from '@/ui/checkbox';
import * as PopoverPrimitive from '@radix-ui/react-popover';

export type BasicDepartment = {
  id: string;
  name: string;
  code: string;
  color: string | null;
};

type DepartmentMultiSelectProps = {
  departments: BasicDepartment[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  preselectedId?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
};

/**
 * Composant MultiSelect pour sélectionner plusieurs départements
 * 
 * @param departments - Liste des départements disponibles
 * @param selectedIds - IDs des départements actuellement sélectionnés
 * @param onSelectionChange - Callback appelé quand la sélection change
 * @param preselectedId - ID de département à pré-sélectionner (ex: département du créateur)
 */
export function DepartmentMultiSelect({
  departments,
  selectedIds,
  onSelectionChange,
  preselectedId,
  placeholder = 'Sélectionner des départements...',
  searchPlaceholder = 'Rechercher un département...',
  emptyText = 'Aucun département disponible',
  disabled = false,
  className
}: DepartmentMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const filteredDepartments = useMemo(() => {
    if (!search) return departments;
    const searchLower = search.toLowerCase();
    return departments.filter((d) => 
      d.name.toLowerCase().includes(searchLower) ||
      d.code.toLowerCase().includes(searchLower)
    );
  }, [departments, search]);
  
  const selectedDepartments = useMemo(() => {
    return departments.filter((d) => selectedIds.includes(d.id));
  }, [departments, selectedIds]);
  
  const handleToggle = (departmentId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIds, departmentId]);
    } else {
      onSelectionChange(selectedIds.filter((id) => id !== departmentId));
    }
  };
  
  const handleRemove = (departmentId: string) => {
    onSelectionChange(selectedIds.filter((id) => id !== departmentId));
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
              selectedIds.length === 0 && 'text-slate-500',
              className
            )}
            disabled={disabled}
            type="button"
          >
            {selectedIds.length > 0
              ? `${selectedIds.length} département(s) sélectionné(s)`
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
              {filteredDepartments.length === 0 ? (
                <div className="py-6 text-center text-sm text-slate-500">{emptyText}</div>
              ) : (
                filteredDepartments.map((department) => {
                  const isSelected = selectedIds.includes(department.id);
                  const isPreselected = department.id === preselectedId;
                  
                  return (
                    <div
                      key={department.id}
                      className={cn(
                        'flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors',
                        'hover:bg-slate-100 dark:hover:bg-slate-800',
                        isSelected && 'bg-slate-100 dark:bg-slate-800'
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleToggle(department.id, checked === true)}
                        id={`department-${department.id}`}
                      />
                      <label
                        htmlFor={`department-${department.id}`}
                        className="flex-1 cursor-pointer flex items-center gap-2"
                      >
                        {department.color && (
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: department.color }}
                          />
                        )}
                        <span>{department.name}</span>
                        <span className="text-xs text-slate-500">({department.code})</span>
                        {isPreselected && (
                          <span className="ml-auto text-xs text-green-600 dark:text-green-400">
                            (défaut)
                          </span>
                        )}
                      </label>
                    </div>
                  );
                })
              )}
            </div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
      
      {/* Affichage des départements sélectionnés */}
      {selectedDepartments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedDepartments.map((department) => (
            <span
              key={department.id}
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800"
            >
              {department.color && (
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: department.color }}
                />
              )}
              {department.name}
              {department.id === preselectedId && (
                <span className="text-green-600 dark:text-green-400">(défaut)</span>
              )}
              <button
                type="button"
                onClick={() => handleRemove(department.id)}
                className="rounded p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700"
                aria-label={`Retirer ${department.name}`}
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

