'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Button } from '@/ui/button';

type TicketsSearchBarProps = {
  initialSearch?: string;
};

export function TicketsSearchBar({ initialSearch }: TicketsSearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(initialSearch || '');
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch || '');

  // Debounce de 500ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchValue);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchValue]);

  // Mettre à jour l'URL quand la recherche change (après debounce)
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (debouncedSearch.trim()) {
      params.set('search', debouncedSearch.trim());
    } else {
      params.delete('search');
    }

    // Réinitialiser l'offset quand on recherche
    params.delete('offset');

    const newUrl = params.toString() 
      ? `/gestion/tickets?${params.toString()}`
      : '/gestion/tickets';
    
    router.push(newUrl);
  }, [debouncedSearch, router, searchParams]);

  const handleClear = useCallback(() => {
    setSearchValue('');
    setDebouncedSearch('');
  }, []);

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Rechercher dans les tickets (titre, description, Jira)..."
          className="w-full rounded-md border border-slate-200 bg-white pl-10 pr-10 py-2 text-sm placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-brand"
        />
        {searchValue && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={handleClear}
            aria-label="Effacer la recherche"
          >
            <X className="h-3.5 w-3.5 text-slate-400" />
          </Button>
        )}
      </div>
      {debouncedSearch && (
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          Recherche : &quot;{debouncedSearch}&quot;
        </p>
      )}
    </div>
  );
}

