'use client';

import { useEffect, useMemo, useState } from 'react';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { ViewCompanyDialog } from '@/components/companies/view-company-dialog';
import { EditCompanyDialog } from '@/components/companies/edit-company-dialog';
import { DeleteCompanyButton } from '@/components/companies/delete-company-button';
import { Button } from '@/ui/button';
import { Pagination } from '@/ui/pagination';

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

  const filteredRows = useMemo(() => {
    const term = search.toLowerCase().trim();
    return rows.filter((row) => {
      if (term) {
        const inName = row.name.toLowerCase().includes(term);
        if (!inName) return false;
      }

      if (countryFilter !== 'all' && (!row.country_id || row.country_id !== countryFilter)) return false;

      return true;
    });
  }, [rows, search, countryFilter]);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [search, countryFilter]);

  return (
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
          <thead className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <tr>
              <th className="pb-2">Nom</th>
              <th className="pb-2">Pays</th>
              <th className="pb-2">Point focal</th>
              <th className="pb-2">Secteurs</th>
              <th className="pb-2">Créée le</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {paginatedRows.map((c) => {
              const sectors =
                c.company_sector_link?.map((l) => l.sector?.name).filter(Boolean).join(', ') || '-';
              return (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-3 text-xs font-medium">{c.name}</td>
                  <td className="py-3 text-xs">{(c.country_id && countries[c.country_id]) ?? '-'}</td>
                  <td className="py-3 text-xs">{(c.focal_user_id && users[c.focal_user_id]) ?? '-'}</td>
                  <td className="py-3 text-xs">{sectors}</td>
                  <td className="py-3 text-xs">
                    {new Date(c.created_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="py-3 text-right text-xs">
                    <div className="flex justify-end gap-1.5">
                      <ViewCompanyDialog
                        companyId={c.id}
                        trigger={
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label="Voir"
                            className="h-7 w-7 p-0 text-slate-600 hover:bg-slate-600/10 dark:text-slate-200 dark:hover:bg-slate-200/10"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        }
                      />
                      <EditCompanyDialog
                        companyId={c.id}
                        trigger={
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label="Modifier"
                            className="h-7 w-7 p-0 text-slate-600 hover:bg-slate-600/10 dark:text-slate-200 dark:hover:bg-slate-200/10"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        }
                      />
                      <DeleteCompanyButton
                        companyId={c.id}
                        companyName={c.name}
                        className="h-7 w-7 p-0 text-slate-600 hover:bg-slate-600/10 dark:text-slate-200 dark:hover:bg-slate-200/10"
                      >
                        <Trash2 className="h-3 w-3" />
                      </DeleteCompanyButton>
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
  );
}

