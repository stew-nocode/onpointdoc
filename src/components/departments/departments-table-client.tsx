'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { ViewDepartmentDialog } from '@/components/departments/view-department-dialog';
import { EditDepartmentDialog } from '@/components/departments/edit-department-dialog';
import { DeleteDepartmentButton } from '@/components/departments/delete-department-button';
import { Pagination } from '@/ui/pagination';

export type DepartmentRow = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  color: string | null;
  is_active: boolean;
  created_at: string;
};

type Props = {
  rows: DepartmentRow[];
};

const ITEMS_PER_PAGE = 20;

export function DepartmentsTableClient({ rows }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredRows = useMemo(() => {
    const term = search.toLowerCase().trim();
    return rows.filter((row) => {
      if (term) {
        const inName = row.name.toLowerCase().includes(term);
        const inCode = row.code.toLowerCase().includes(term);
        if (!inName && !inCode) return false;
      }

      if (statusFilter === 'active' && !row.is_active) return false;
      if (statusFilter === 'inactive' && row.is_active) return false;

      return true;
    });
  }, [rows, search, statusFilter]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRows, currentPage]);

  const totalPages = Math.ceil(filteredRows.length / ITEMS_PER_PAGE);

  // Réinitialiser la page quand les filtres changent
  const prevFilters = useRef({ search, statusFilter });
  useEffect(() => {
    if (prevFilters.current.search !== search || prevFilters.current.statusFilter !== statusFilter) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentPage(1);
      prevFilters.current = { search, statusFilter };
    }
  }, [search, statusFilter]);

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
            placeholder="Nom ou code du département…"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus-visible:outline-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
        <div className="grid gap-1">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Statut
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
            className="rounded-lg border border-slate-200 px-2 py-2 text-sm focus-visible:outline-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="all">Tous</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <tr>
              <th className="pb-2">Nom</th>
              <th className="pb-2">Code</th>
              <th className="pb-2">Description</th>
              <th className="pb-2">Couleur</th>
              <th className="pb-2">Statut</th>
              <th className="pb-2">Créé le</th>
              <th className="pb-2 w-[84px]" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {paginatedRows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="py-3 text-xs font-medium">{r.name}</td>
                <td className="py-3 text-xs font-mono">{r.code}</td>
                <td className="py-3 text-xs text-slate-600 dark:text-slate-400">
                  {r.description || '-'}
                </td>
                <td className="py-3 text-xs">
                  {r.color ? (
                    <div className="flex items-center gap-2">
                      <div
                        className="h-4 w-4 rounded border border-slate-300 dark:border-slate-600"
                        style={{ backgroundColor: r.color }}
                      />
                      <span className="font-mono">{r.color}</span>
                    </div>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="py-3 text-xs">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      r.is_active
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {r.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className="py-3 text-xs">
                  {new Date(r.created_at).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </td>
                <td className="py-3 text-right w-[84px] text-xs">
                  <div className="flex justify-end gap-1.5">
                    <ViewDepartmentDialog
                      departmentId={r.id}
                      trigger={
                        <button
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md p-0 text-slate-600 hover:bg-slate-600/10 dark:text-slate-200 dark:hover:bg-slate-200/10"
                          aria-label="Voir"
                        >
                          <Eye className="h-3 w-3" />
                        </button>
                      }
                    />
                    <EditDepartmentDialog
                      departmentId={r.id}
                      trigger={
                        <button
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md p-0 text-slate-600 hover:bg-slate-600/10 dark:text-slate-200 dark:hover:bg-slate-200/10"
                          aria-label="Modifier"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      }
                    />
                    <DeleteDepartmentButton
                      departmentId={r.id}
                      departmentName={r.name}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md p-0 text-slate-600 hover:bg-slate-600/10 dark:text-slate-200 dark:hover:bg-slate-200/10"
                    >
                      <Trash2 className="h-3 w-3" />
                    </DeleteDepartmentButton>
                  </div>
                </td>
              </tr>
            ))}
            {!paginatedRows.length && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                  {filteredRows.length === 0
                    ? 'Aucun département ne correspond aux filtres.'
                    : 'Aucun département sur cette page.'}
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

