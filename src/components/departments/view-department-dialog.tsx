'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/ui/dialog';
import { DepartmentProductsManager } from '@/components/departments/department-products-manager';

type Props = { departmentId: string; trigger: React.ReactNode };

export function ViewDepartmentDialog({ departmentId, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [row, setRow] = useState<{
    name: string;
    code: string;
    description: string | null;
    color: string | null;
    is_active: boolean;
    created_at: string;
  } | null>(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase
        .from('departments')
        .select('name, code, description, color, is_active, created_at')
        .eq('id', departmentId)
        .single();
      if (data) {
        setRow({
          name: data.name ?? '',
          code: data.code ?? '',
          description: data.description,
          color: data.color,
          is_active: data.is_active ?? true,
          created_at: data.created_at
        });
      }
      setLoading(false);
    })();
  }, [open, departmentId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Détails du département</DialogTitle>
          <DialogDescription>Lecture seule.</DialogDescription>
        </DialogHeader>
        {loading || !row ? (
          <p className="py-6 text-sm text-slate-500">Chargement…</p>
        ) : (
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium text-slate-700 dark:text-slate-300">Nom</p>
              <p className="text-slate-600 dark:text-slate-400">{row.name}</p>
            </div>
            <div>
              <p className="font-medium text-slate-700 dark:text-slate-300">Code</p>
              <p className="font-mono text-slate-600 dark:text-slate-400">{row.code}</p>
            </div>
            <div>
              <p className="font-medium text-slate-700 dark:text-slate-300">Description</p>
              <p className="text-slate-600 dark:text-slate-400">{row.description || '-'}</p>
            </div>
            <div>
              <p className="font-medium text-slate-700 dark:text-slate-300">Couleur</p>
              {row.color ? (
                <div className="flex items-center gap-2">
                  <div
                    className="h-6 w-6 rounded border border-slate-300 dark:border-slate-600"
                    style={{ backgroundColor: row.color }}
                  />
                  <span className="font-mono text-slate-600 dark:text-slate-400">{row.color}</span>
                </div>
              ) : (
                <p className="text-slate-600 dark:text-slate-400">-</p>
              )}
            </div>
            <div>
              <p className="font-medium text-slate-700 dark:text-slate-300">Statut</p>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  row.is_active
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {row.is_active ? 'Actif' : 'Inactif'}
              </span>
            </div>
            <div>
              <p className="font-medium text-slate-700 dark:text-slate-300">Créé le</p>
              <p className="text-slate-600 dark:text-slate-400">
                {new Date(row.created_at).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
              <DepartmentProductsManager departmentId={departmentId} />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

