'use client';

import { useEffect, useMemo, useState } from 'react';
import { Eye, Pencil, Trash2 } from 'lucide-react';

import { ViewUserDialog } from '@/components/users/view-user-dialog';
import { EditUserDialog } from '@/components/users/edit-user-dialog';
import { DeleteUserButton } from '@/components/users/delete-user-button';
import { Button } from '@/ui/button';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export type ContactRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  company_id: string | null;
  is_active: boolean | null;
  role?: string | null;
};

type Props = {
  rows: ContactRow[];
  companies: Record<string, string>;
  statusPreset?: 'all' | 'active';
};

export function ContactsTable({ rows, companies, statusPreset = 'all' }: Props) {
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>(statusPreset);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  const filteredRows = useMemo(() => {
    const term = search.toLowerCase().trim();
    return rows.filter((row) => {
      if (term) {
        const inName = (row.full_name ?? '').toLowerCase().includes(term);
        const inEmail = (row.email ?? '').toLowerCase().includes(term);
        if (!inName && !inEmail) return false;
      }

      if (companyFilter !== 'all') {
        if (!row.company_id || row.company_id !== companyFilter) return false;
      }

      if (statusFilter === 'active' && !row.is_active) return false;
      if (statusFilter === 'inactive' && row.is_active) return false;

      return true;
    });
  }, [rows, search, companyFilter, statusFilter]);

  const companyOptions = useMemo(() => {
    return Object.entries(companies)
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [companies]);

  // Synchroniser le filtre de statut avec l'onglet sélectionné par le parent
  useEffect(() => {
    setStatusFilter(statusPreset);
  }, [statusPreset]);

  const allSelectableIds = useMemo(
    () => filteredRows.filter((r) => (r.role ?? 'client') === 'client').map((r) => r.id),
    [filteredRows]
  );

  const allSelected = allSelectableIds.length > 0 && allSelectableIds.every((id) => selectedIds.includes(id));

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !allSelectableIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...allSelectableIds])));
    }
  }

  function toggleSelectOne(id: string, selectable: boolean) {
    if (!selectable) return;
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleBulkUpdateActive(isActive: boolean) {
    const clientIds = rows
      .filter((r) => (r.role ?? 'client') === 'client' && selectedIds.includes(r.id))
      .map((r) => r.id);
    if (!clientIds.length) {
      toast.info('Aucun contact client sélectionné.');
      return;
    }
    try {
      setBulkLoading(true);
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.from('profiles').update({ is_active: isActive }).in('id', clientIds);
      if (error) throw new Error(error.message);
      toast.success(isActive ? 'Contacts réactivés' : 'Contacts désactivés');
      // On ne modifie pas localement les données, on déclenche un rafraîchissement complet.
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (e: any) {
      toast.error(e?.message ?? 'Erreur lors de la mise à jour des contacts');
    } finally {
      setBulkLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1.2fr)]">
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {selectedIds.length > 0
            ? `${selectedIds.length} contact(s) sélectionné(s)`
            : 'Sélectionnez des contacts clients pour appliquer une action en masse.'}
        </p>
        {selectedIds.length > 0 && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={bulkLoading}
              onClick={() => handleBulkUpdateActive(false)}
            >
              Désactiver la sélection
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={bulkLoading}
              onClick={() => handleBulkUpdateActive(true)}
            >
              Réactiver la sélection
            </Button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <tr>
              <th className="pb-2">
                <input
                  type="checkbox"
                  aria-label="Tout sélectionner"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-slate-300 text-brand focus-visible:outline-brand dark:border-slate-600"
                />
              </th>
              <th className="pb-2">Nom</th>
              <th className="pb-2">Email</th>
              <th className="pb-2">Entreprise</th>
              <th className="pb-2">Actif</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredRows.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="py-3">
                  <input
                    type="checkbox"
                    aria-label="Sélectionner le contact"
                    checked={selectedIds.includes(u.id)}
                    onChange={() => toggleSelectOne(u.id, (u.role ?? 'client') === 'client')}
                    disabled={(u.role ?? 'client') !== 'client'}
                    className="h-4 w-4 rounded border-slate-300 text-brand focus-visible:outline-brand dark:border-slate-600 disabled:opacity-40"
                  />
                </td>
                <td className="py-3 font-medium">{u.full_name ?? '-'}</td>
                <td className="py-3">{u.email ?? '-'}</td>
                <td className="py-3">{(u.company_id && companies[u.company_id]) ?? '-'}</td>
                <td className="py-3">{u.is_active ? 'Oui' : 'Non'}</td>
                <td className="py-3 text-right">
                  <div className="flex justify-end gap-1.5">
                    <ViewUserDialog
                      userId={u.id}
                      trigger={
                        <button
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md p-0 text-slate-600 hover:bg-slate-600/10 dark:text-slate-200 dark:hover:bg-slate-200/10"
                          aria-label="Voir le contact"
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
                          aria-label="Modifier le contact"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      }
                    />
                    <DeleteUserButton
                      userId={u.id}
                      userName={u.full_name ?? u.email ?? 'Contact'}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md p-0 text-slate-600 hover:bg-slate-600/10 dark:text-slate-200 dark:hover:bg-slate-200/10"
                    >
                      <Trash2 className="h-3 w-3" />
                    </DeleteUserButton>
                  </div>
                </td>
              </tr>
            ))}
            {!filteredRows.length && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  Aucun contact ne correspond aux filtres.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


