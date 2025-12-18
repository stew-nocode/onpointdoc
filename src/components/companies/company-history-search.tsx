'use client';

import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/ui/button';
import { Badge } from '@/ui/badge';
import type { CompanyHistoryItem } from '@/services/companies/company-history';

type CompanyHistorySearchProps = {
  history: CompanyHistoryItem[];
  onFiltered: (filtered: CompanyHistoryItem[]) => void;
  className?: string;
};

/**
 * Composant de recherche pour l'historique d'une entreprise
 * 
 * Pattern similaire à TicketsSearchBar/CompaniesSearchBar pour cohérence
 * 
 * ✅ Principe Clean Code :
 * - Filtrage côté client (performant pour < 100 items)
 * - Recherche instantanée (pas de debounce nécessaire)
 * - Recherche dans : title, description, user.full_name, metadata
 * 
 * @param history - Liste complète de l'historique
 * @param onFiltered - Callback appelé avec la liste filtrée
 * @param className - Classes CSS additionnelles
 */
export function CompanyHistorySearch({
  history,
  onFiltered,
  className,
}: CompanyHistorySearchProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHistory = useMemo(() => {
    if (!searchTerm.trim()) {
      onFiltered(history);
      return history;
    }

    const term = searchTerm.toLowerCase().trim();
    const filtered = history.filter((item) => {
      // Recherche dans title
      if (item.title.toLowerCase().includes(term)) return true;

      // Recherche dans description
      if (item.description?.toLowerCase().includes(term)) return true;

      // Recherche dans nom utilisateur
      if (item.user?.full_name.toLowerCase().includes(term)) return true;

      // Recherche dans métadonnées (ticket_type, status, email, etc.)
      if (item.metadata) {
        // Convertir les métadonnées en string pour recherche
        const metadataStr = JSON.stringify(item.metadata).toLowerCase();
        if (metadataStr.includes(term)) return true;
      }

      return false;
    });

    onFiltered(filtered);
    return filtered;
  }, [history, searchTerm, onFiltered]);

  const handleClear = () => {
    setSearchTerm('');
  };

  const hasResults = filteredHistory.length > 0;
  const hasSearch = searchTerm.trim().length > 0;
  const resultCount = filteredHistory.length;
  const totalCount = history.length;

  return (
    <div className={className}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Rechercher dans l'historique..."
          className="w-full rounded-md border border-slate-200 bg-white pl-10 pr-10 py-2 text-sm placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-brand"
        />
        {searchTerm && (
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
      {hasSearch && (
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {hasResults ? (
              <>
                <Badge variant="secondary" className="mr-1.5">
                  {resultCount}
                </Badge>
                résultat{resultCount > 1 ? 's' : ''} trouvé{resultCount > 1 ? 's' : ''}
                {resultCount < totalCount && (
                  <span className="ml-1 text-slate-400">
                    sur {totalCount}
                  </span>
                )}
              </>
            ) : (
              <span className="text-slate-400 dark:text-slate-500">
                Aucun résultat trouvé
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

