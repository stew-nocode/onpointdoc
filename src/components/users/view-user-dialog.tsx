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

type Props = {
  userId: string;
  trigger: React.ReactNode;
};

export function ViewUserDialog({ userId, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [row, setRow] = useState<{
    full_name: string | null;
    email: string | null;
    role: string;
    department: string | null;
    job_title: string | null;
    is_active: boolean | null;
    company_id: string | null;
    companyName?: string;
    modules: string[];
  } | null>(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      const supabase = createSupabaseBrowserClient();
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email, role, department, job_title, is_active, company_id')
        .eq('id', userId)
        .single();
      const [{ data: companies }, { data: links }, { data: modules }] = await Promise.all([
        supabase.from('companies').select('id, name'),
        supabase.from('user_module_assignments').select('module_id').eq('user_id', userId),
        supabase.from('modules').select('id, name')
      ]);
      const companyName =
        (companies ?? []).find((c: any) => c.id === (profile as any)?.company_id)?.name ?? undefined;
      const moduleNames =
        (links ?? [])
          .map((l: any) => (modules ?? []).find((m: any) => m.id === l.module_id)?.name)
          .filter(Boolean) ?? [];
      setRow({
        ...(profile as any),
        companyName,
        modules: moduleNames as string[]
      });
      setLoading(false);
    })();
  }, [open, userId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Détails utilisateur</DialogTitle>
          <DialogDescription>Informations en lecture seule.</DialogDescription>
        </DialogHeader>
        {loading || !row ? (
          <p className="py-6 text-sm text-slate-500">Chargement…</p>
        ) : (
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium text-slate-700">Nom</p>
              <p className="text-slate-600 dark:text-slate-300">{row.full_name ?? '-'}</p>
            </div>
            <div>
              <p className="font-medium text-slate-700">Email</p>
              <p className="text-slate-600 dark:text-slate-300">{row.email ?? '-'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-medium text-slate-700">Rôle</p>
                <p className="text-slate-600 dark:text-slate-300 capitalize">{row.role}</p>
              </div>
              <div>
                <p className="font-medium text-slate-700">Département</p>
                <p className="text-slate-600 dark:text-slate-300">{row.department ?? '-'}</p>
              </div>
            </div>
            {row.job_title && (
              <div>
                <p className="font-medium text-slate-700">Fonction</p>
                <p className="text-slate-600 dark:text-slate-300">{row.job_title}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-medium text-slate-700">Actif</p>
                <p className="text-slate-600 dark:text-slate-300">{row.is_active ? 'Oui' : 'Non'}</p>
              </div>
            </div>
            <div>
              <p className="font-medium text-slate-700">Entreprise</p>
              <p className="text-slate-600 dark:text-slate-300">{row.companyName ?? '-'}</p>
            </div>
            <div>
              <p className="font-medium text-slate-700">Modules</p>
              <p className="text-slate-600 dark:text-slate-300">
                {row.modules.length ? row.modules.join(', ') : '-'}
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}



