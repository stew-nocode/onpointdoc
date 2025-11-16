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

type ViewCompanyDialogProps = {
  companyId: string;
  trigger: React.ReactNode;
};

export function ViewCompanyDialog({ companyId, trigger }: ViewCompanyDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [row, setRow] = useState<{
    name: string;
    created_at: string;
    country_id: string | null;
    focal_user_id: string | null;
    sectors: string[];
    countryName?: string;
    focalName?: string;
  } | null>(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      const supabase = createSupabaseBrowserClient();
      const { data: company } = await supabase
        .from('companies')
        .select('name, created_at, country_id, focal_user_id')
        .eq('id', companyId)
        .single();
      const { data: links } = await supabase
        .from('company_sector_link')
        .select('sector:sector_id ( name )')
        .eq('company_id', companyId);
      const { data: countries } = await supabase.from('countries').select('id, name');
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, email');

      const countryName =
        (countries ?? []).find((c: any) => c.id === company?.country_id)?.name ?? undefined;
      const focalName =
        (profiles ?? [])
          .map((p: any) => ({
            id: p.id as string,
            label: (p.full_name as string) || (p.email as string) || 'Utilisateur'
          }))
          .find((p) => p.id === company?.focal_user_id)?.label ?? undefined;

      setRow({
        name: (company?.name as string) ?? '',
        created_at: (company?.created_at as string) ?? '',
        country_id: (company?.country_id as string) ?? null,
        focal_user_id: (company?.focal_user_id as string) ?? null,
        sectors: (links ?? []).map((l: any) => l.sector?.name).filter(Boolean) as string[],
        countryName,
        focalName
      });
      setLoading(false);
    })();
  }, [open, companyId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Détails de la compagnie</DialogTitle>
          <DialogDescription>Informations en lecture seule.</DialogDescription>
        </DialogHeader>
        {loading || !row ? (
          <p className="py-6 text-sm text-slate-500">Chargement…</p>
        ) : (
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium text-slate-700">Nom</p>
              <p className="text-slate-600 dark:text-slate-300">{row.name}</p>
            </div>
            <div>
              <p className="font-medium text-slate-700">Pays</p>
              <p className="text-slate-600 dark:text-slate-300">{row.countryName ?? '-'}</p>
            </div>
            <div>
              <p className="font-medium text-slate-700">Point focal</p>
              <p className="text-slate-600 dark:text-slate-300">{row.focalName ?? '-'}</p>
            </div>
            <div>
              <p className="font-medium text-slate-700">Secteurs</p>
              <p className="text-slate-600 dark:text-slate-300">
                {row.sectors.length ? row.sectors.join(', ') : '-'}
              </p>
            </div>
            <div>
              <p className="font-medium text-slate-700">Créée le</p>
              <p className="text-slate-600 dark:text-slate-300">
                {new Date(row.created_at).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


