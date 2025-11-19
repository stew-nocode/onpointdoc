'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { ViewModuleDialog } from '@/components/modules/view-module-dialog';
import { EditModuleDialog } from '@/components/modules/edit-module-dialog';
import { DeleteModuleButton } from '@/components/modules/delete-module-button';
import { Pagination } from '@/ui/pagination';

export type ModuleRow = {
  id: string;
  name: string;
  product_id: string;
  created_at: string;
};

type Props = {
  rows: ModuleRow[];
  products: Record<string, string>;
};

const ITEMS_PER_PAGE = 20;

export function ModulesTableClient({ rows, products }: Props) {
  const [search, setSearch] = useState('');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredRows = useMemo(() => {
    const term = search.toLowerCase().trim();
    return rows.filter((row) => {
      if (term) {
        const inName = row.name.toLowerCase().includes(term);
        if (!inName) return false;
      }

      if (productFilter !== 'all' && row.product_id !== productFilter) return false;

      return true;
    });
  }, [rows, search, productFilter]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRows, currentPage]);

  const totalPages = Math.ceil(filteredRows.length / ITEMS_PER_PAGE);

  const productOptions = useMemo(() => {
    return Object.entries(products)
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  // Réinitialiser la page quand les filtres changent
  const prevFilters = useRef({ search, productFilter });
  useEffect(() => {
    if (prevFilters.current.search !== search || prevFilters.current.productFilter !== productFilter) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentPage(1);
      prevFilters.current = { search, productFilter };
    }
  }, [search, productFilter]);

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
            placeholder="Nom du module…"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus-visible:outline-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
        <div className="grid gap-1">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Produit
          </label>
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-2 py-2 text-sm focus-visible:outline-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="all">Tous</option>
            {productOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
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
              <th className="pb-2">Produit</th>
              <th className="pb-2">Créé le</th>
              <th className="pb-2 w-[84px]" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {paginatedRows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="py-3 text-xs font-medium">{r.name}</td>
                <td className="py-3 text-xs">{products[r.product_id] ?? '-'}</td>
                <td className="py-3 text-xs">
                  {new Date(r.created_at).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </td>
                <td className="py-3 text-right w-[84px] text-xs">
                  <div className="flex justify-end gap-1.5">
                    <ViewModuleDialog
                      moduleId={r.id}
                      trigger={
                        <button
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md p-0 text-slate-600 hover:bg-slate-600/10 dark:text-slate-200 dark:hover:bg-slate-200/10"
                          aria-label="Voir"
                        >
                          <Eye className="h-3 w-3" />
                        </button>
                      }
                    />
                    <EditModuleDialog
                      moduleId={r.id}
                      trigger={
                        <button
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md p-0 text-slate-600 hover:bg-slate-600/10 dark:text-slate-200 dark:hover:bg-slate-200/10"
                          aria-label="Modifier"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      }
                    />
                    <DeleteModuleButton
                      moduleId={r.id}
                      moduleName={r.name}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md p-0 text-slate-600 hover:bg-slate-600/10 dark:text-slate-200 dark:hover:bg-slate-200/10"
                    >
                      <Trash2 className="h-3 w-3" />
                    </DeleteModuleButton>
                  </div>
                </td>
              </tr>
            ))}
            {!paginatedRows.length && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                  {filteredRows.length === 0
                    ? 'Aucun module ne correspond aux filtres.'
                    : 'Aucun module sur cette page.'}
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

