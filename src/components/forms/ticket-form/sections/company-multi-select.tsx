/**
 * Composant MultiSelect pour sélectionner plusieurs entreprises
 * 
 * Utilise ShadCN Checkbox pour une sélection multiple avec recherche
 * Affiche les entreprises sélectionnées avec possibilité de retirer
 */

'use client';

import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/ui/button';
import { Checkbox } from '@/ui/checkbox';
import type { BasicCompany } from '@/services/companies';
import * as PopoverPrimitive from '@radix-ui/react-popover';

type CompanyMultiSelectProps = {
  companies: BasicCompany[];
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
 * Composant MultiSelect pour sélectionner plusieurs entreprises
 * 
 * @param companies - Liste des entreprises disponibles
 * @param selectedIds - IDs des entreprises actuellement sélectionnées
 * @param onSelectionChange - Callback appelé quand la sélection change
 * @param preselectedId - ID d'entreprise à pré-sélectionner (ex: entreprise du contact)
 */
export function CompanyMultiSelect({
  companies,
  selectedIds,
  onSelectionChange,
  preselectedId,
  placeholder = 'Sélectionner des entreprises...',
  searchPlaceholder = 'Rechercher une entreprise...',
  emptyText = 'Aucune entreprise disponible',
  disabled = false,
  className
}: CompanyMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const filteredCompanies = useMemo(() => {
    if (!search) return companies;
    const searchLower = search.toLowerCase();
    return companies.filter((c) => c.name.toLowerCase().includes(searchLower));
  }, [companies, search]);
  
  const selectedCompanies = useMemo(() => {
    return companies.filter((c) => selectedIds.includes(c.id));
  }, [companies, selectedIds]);
  
  const handleToggle = (companyId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIds, companyId]);
    } else {
      onSelectionChange(selectedIds.filter((id) => id !== companyId));
    }
  };
  
  const handleRemove = (companyId: string) => {
    onSelectionChange(selectedIds.filter((id) => id !== companyId));
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
              ? `${selectedIds.length} entreprise(s) sélectionnée(s)`
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
              {filteredCompanies.length === 0 ? (
                <div className="py-6 text-center text-sm text-slate-500">{emptyText}</div>
              ) : (
                filteredCompanies.map((company) => {
                  const isSelected = selectedIds.includes(company.id);
                  const isPreselected = company.id === preselectedId;
                  
                  return (
                    <div
                      key={company.id}
                      className={cn(
                        'flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors',
                        'hover:bg-slate-100 dark:hover:bg-slate-800',
                        isSelected && 'bg-slate-100 dark:bg-slate-800'
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleToggle(company.id, checked === true)}
                        id={`company-${company.id}`}
                      />
                      <label
                        htmlFor={`company-${company.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        {company.name}
                        {isPreselected && (
                          <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                            (signalante)
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
      
      {/* Affichage des entreprises sélectionnées */}
      {selectedCompanies.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCompanies.map((company) => (
            <span
              key={company.id}
              className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800"
            >
              {company.name}
              {company.id === preselectedId && (
                <span className="text-green-600 dark:text-green-400">(signalante)</span>
              )}
              <button
                type="button"
                onClick={() => handleRemove(company.id)}
                className="rounded p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700"
                aria-label={`Retirer ${company.name}`}
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

