'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { ViewCompanyDialogLazy } from '@/components/companies/view-company-dialog-lazy';
import { EditCompanyDialogLazy } from '@/components/companies/edit-company-dialog-lazy';
import { DeleteCompanyButton } from '@/components/companies/delete-company-button';
import { Pagination } from '@/ui/pagination';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/ui/tooltip';
import { SortableCompanyTableHeader } from './sortable-company-table-header';
import { parseCompanySort } from '@/types/company-sort';
import type { CompanySortColumn, SortDirection } from '@/types/company-sort';
import { highlightText } from '@/components/tickets/utils/ticket-display';

export type CompanyRow = {
  id: string;
  name: string;
  created_at: string;
  country_id: string | null;
  focal_user_id: string | null;
  company_sector_link: Array<{ sector: { name: string } | null }>;
};

type Props = {
  rows: CompanyRow[];
  countries: Record<string, string>;
  users: Record<string, string>;
};

const ITEMS_PER_PAGE = 20;

export function CompaniesTableClient({ rows, countries, users }: Props) {
  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [currentSort, setCurrentSort] = useState<CompanySortColumn>('name');
  const [currentSortDirection, setCurrentSortDirection] = useState<SortDirection>('desc');

  // Utiliser la fonction utilitaire pour mettre en surbrillance les termes recherchés
  const highlightSearchTerm = useCallback(
    (text: string, searchTerm?: string) => highlightText(text, searchTerm),
    []
  );

  /**
   * Handler pour le tri d'une colonne
   */
  const handleSort = useCallback((column: CompanySortColumn, direction: SortDirection) => {
    setCurrentSort(column);
    setCurrentSortDirection(direction);
  }, []);

  const filteredRows = useMemo(() => {
    const term = search.toLowerCase().trim();
    let filtered = rows.filter((row) => {
      if (term) {
        const inName = row.name.toLowerCase().includes(term);
        if (!inName) return false;
      }

      if (countryFilter !== 'all' && (!row.country_id || row.country_id !== countryFilter)) return false;

      return true;
    });

    // Appliquer le tri
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (currentSort) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'country':
          const countryA = a.country_id ? countries[a.country_id] || '' : '';
          const countryB = b.country_id ? countries[b.country_id] || '' : '';
          comparison = countryA.localeCompare(countryB);
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        default:
          return 0;
      }

      return currentSortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [rows, search, countryFilter, currentSort, currentSortDirection, countries]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRows, currentPage]);

  const totalPages = Math.ceil(filteredRows.length / ITEMS_PER_PAGE);

  const countryOptions = useMemo(() => {
    return Object.entries(countries)
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [countries]);

  // Réinitialiser la page quand les filtres changent
  const prevSearchRef = useRef(search);
  const prevCountryFilterRef = useRef(countryFilter);
  
  useEffect(() => {
    if (prevSearchRef.current !== search || prevCountryFilterRef.current !== countryFilter) {
      prevSearchRef.current = search;
      prevCountryFilterRef.current = countryFilter;
      // Réinitialiser la page à 1 quand les filtres changent (asynchrone pour éviter les rendus en cascade)
      setTimeout(() => {
        setCurrentPage(1);
      }, 0);
    }
  }, [search, countryFilter]);

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="grid gap-1">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Recherche
            </label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nom de l'entreprise…"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus-visible:outline-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
          <div className="grid gap-1">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Pays
            </label>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="rounded-lg border border-slate-200 px-2 py-2 text-sm focus-visible:outline-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="all">Tous</option>
              {countryOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="border-b border-slate-200 dark:border-slate-800">
              <tr>
                <SortableCompanyTableHeader
                  column="name"
                  label="Nom"
                  currentSortColumn={currentSort}
                  currentSortDirection={currentSortDirection}
                  onSort={handleSort}
                />
                <SortableCompanyTableHeader
                  column="country"
                  label="Pays"
                  currentSortColumn={currentSort}
                  currentSortDirection={currentSortDirection}
                  onSort={handleSort}
                />
                <th className="pb-2.5 pr-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Point focal
                </th>
                <th className="pb-2.5 pr-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Secteurs
                </th>
                <SortableCompanyTableHeader
                  column="created_at"
                  label="Créée le"
                  currentSortColumn={currentSort}
                  currentSortDirection={currentSortDirection}
                  onSort={handleSort}
                />
                <th className="pb-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedRows.map((c) => {
                const sectors =
                  c.company_sector_link?.map((l) => l.sector?.name).filter(Boolean).join(', ') || '-';
                const countryName = c.country_id ? countries[c.country_id] : null;
                const focalUserName = c.focal_user_id ? users[c.focal_user_id] : null;
                
                return (
                  <tr
                    key={c.id}
                    className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    {/* Nom avec highlight */}
                    <td className="py-2.5 pr-4">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate block max-w-[300px]">
                            {search ? highlightSearchTerm(c.name, search) : c.name}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-md">
                          <p className="text-sm">{c.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    </td>
                    
                    {/* Pays */}
                    <td className="py-2.5 pr-4">
                      <span className="text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {countryName || '-'}
                      </span>
                    </td>
                    
                    {/* Point focal */}
                    <td className="py-2.5 pr-4">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-xs text-slate-600 dark:text-slate-300 truncate block max-w-[150px]">
                            {focalUserName || '-'}
                          </span>
                        </TooltipTrigger>
                        {focalUserName && (
                          <TooltipContent>
                            <p>Point focal: {focalUserName}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </td>
                    
                    {/* Secteurs */}
                    <td className="py-2.5 pr-4">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-xs text-slate-600 dark:text-slate-300 truncate block max-w-[200px]">
                            {sectors}
                          </span>
                        </TooltipTrigger>
                        {sectors !== '-' && (
                          <TooltipContent>
                            <p>Secteurs: {sectors}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </td>
                    
                    {/* Date de création */}
                    <td className="py-2.5 pr-4">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {new Date(c.created_at).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {new Date(c.created_at).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </td>
                    
                    {/* Actions */}
                    <td className="py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Voir */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <ViewCompanyDialogLazy
                                companyId={c.id}
                                trigger={
                                  <button
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                                    aria-label="Voir les détails"
                                    type="button"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </button>
                                }
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Voir les détails</p>
                          </TooltipContent>
                        </Tooltip>

                        {/* Modifier */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <EditCompanyDialogLazy
                                companyId={c.id}
                                trigger={
                                  <button
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                                    aria-label="Modifier"
                                    type="button"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                }
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Modifier</p>
                          </TooltipContent>
                        </Tooltip>

                        {/* Supprimer */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <DeleteCompanyButton
                                companyId={c.id}
                                companyName={c.name}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </DeleteCompanyButton>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Supprimer</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!paginatedRows.length && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                    {filteredRows.length === 0
                      ? 'Aucune compagnie ne correspond aux filtres.'
                      : 'Aucune compagnie sur cette page.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={ITEMS_PER_PAGE}
            totalItems={filteredRows.length}
          />
        )}
      </div>
    </TooltipProvider>
  );
}

