'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { ViewUserDialog } from '@/components/users/view-user-dialog';
import { EditUserDialog } from '@/components/users/edit-user-dialog';
import { DeleteUserButton } from '@/components/users/delete-user-button';
import { Pagination } from '@/ui/pagination';

export type UserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  department: string | null;
  is_active: boolean | null;
  company_id: string | null;
};

type Props = {
  rows: UserRow[];
  companies: Record<string, string>;
};

const ITEMS_PER_PAGE = 20;

export function UsersTableClient({ rows, companies }: Props) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const prevFiltersRef = useRef({ search, roleFilter, departmentFilter, companyFilter, statusFilter });

  const filteredRows = useMemo(() => {
    const term = search.toLowerCase().trim();
    return rows.filter((row) => {
      if (term) {
        const inName = (row.full_name ?? '').toLowerCase().includes(term);
        const inEmail = (row.email ?? '').toLowerCase().includes(term);
        if (!inName && !inEmail) return false;
      }

      if (roleFilter !== 'all' && row.role !== roleFilter) return false;
      if (departmentFilter !== 'all' && row.department !== departmentFilter) return false;
      if (companyFilter !== 'all' && (!row.company_id || row.company_id !== companyFilter)) return false;
      if (statusFilter === 'active' && !row.is_active) return false;
      if (statusFilter === 'inactive' && row.is_active) return false;

      return true;
    });
  }, [rows, search, roleFilter, departmentFilter, companyFilter, statusFilter]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRows, currentPage]);

  const totalPages = Math.ceil(filteredRows.length / ITEMS_PER_PAGE);

  const uniqueRoles = useMemo(() => {
    const roles = new Set(rows.map((r) => r.role));
    return Array.from(roles).sort();
  }, [rows]);

  const uniqueDepartments = useMemo(() => {
    const depts = new Set(rows.map((r) => r.department).filter((d): d is string => Boolean(d)));
    return Array.from(depts).sort();
  }, [rows]);

  const companyOptions = useMemo(() => {
    return Object.entries(companies)
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [companies]);

  // Reset to page 1 when filters change
  useEffect(() => {
    const prev = prevFiltersRef.current;
    if (
      prev.search !== search ||
      prev.roleFilter !== roleFilter ||
      prev.departmentFilter !== departmentFilter ||
      prev.companyFilter !== companyFilter ||
      prev.statusFilter !== statusFilter
    ) {
      setCurrentPage(1);
      prevFiltersRef.current = { search, roleFilter, departmentFilter, companyFilter, statusFilter };
    }
  }, [search, roleFilter, departmentFilter, companyFilter, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="grid gap-1">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Recherche
          </label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom ou email…"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus-visible:outline-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
        <div className="grid gap-1">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Rôle
          </label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-2 py-2 text-sm focus-visible:outline-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="all">Tous</option>
            {uniqueRoles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Département
          </label>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-2 py-2 text-sm focus-visible:outline-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="all">Tous</option>
            {uniqueDepartments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Entreprise
          </label>
          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-2 py-2 text-sm focus-visible:outline-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="all">Toutes</option>
            {companyOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Statut
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
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
              <th className="pb-2">Email</th>
              <th className="pb-2">Rôle</th>
              <th className="pb-2">Département</th>
              <th className="pb-2">Entreprise</th>
              <th className="pb-2">Actif</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {paginatedRows.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="py-3 text-xs font-medium">{u.full_name ?? '-'}</td>
                <td className="py-3 text-xs">{u.email ?? '-'}</td>
                <td className="py-3 text-xs capitalize">{u.role}</td>
                <td className="py-3 text-xs">{u.department ?? '-'}</td>
                <td className="py-3 text-xs">{(u.company_id && companies[u.company_id]) ?? '-'}</td>
                <td className="py-3 text-xs">{u.is_active ? 'Oui' : 'Non'}</td>
                <td className="py-3 text-right text-xs">
                  <div className="flex justify-end gap-1.5">
                    <ViewUserDialog
                      userId={u.id}
                      trigger={
                        <button
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md p-0 text-slate-600 hover:bg-slate-600/10 dark:text-slate-200 dark:hover:bg-slate-200/10"
                          aria-label="Voir"
                        >
                          <Eye className="h-3 w-3" />
                        </button>
                      }
                    />
                    <EditUserDialog
                      userId={u.id}
                      trigger={
                        <button
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md p-0 text-slate-600 hover:bg-slate-600/10 dark:text-slate-200 dark:hover:bg-slate-200/10"
                          aria-label="Modifier"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      }
                    />
                    <DeleteUserButton
                      userId={u.id}
                      userName={u.full_name ?? u.email ?? 'Utilisateur'}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md p-0 text-slate-600 hover:bg-slate-600/10 dark:text-slate-200 dark:hover:bg-slate-200/10"
                    >
                      <Trash2 className="h-3 w-3" />
                    </DeleteUserButton>
                  </div>
                </td>
              </tr>
            ))}
            {!paginatedRows.length && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                  {filteredRows.length === 0
                    ? 'Aucun utilisateur ne correspond aux filtres.'
                    : 'Aucun utilisateur sur cette page.'}
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

