'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger
} from '@/ui/dialog';

type Props = { moduleId: string; trigger: React.ReactNode };

export function ViewModuleDialog({ moduleId, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [row, setRow] = useState<{ name: string; product?: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      const supabase = createSupabaseBrowserClient();
      const { data: m } = await supabase.from('modules').select('name, product_id').eq('id', moduleId).single();
      const { data: p } = await supabase.from('products').select('id, name');
      setRow({
        name: (m as any)?.name ?? '',
        product: (p ?? []).find((x: any) => x.id === (m as any)?.product_id)?.name
      });
      setLoading(false);
    })();
  }, [open, moduleId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Détails du module</DialogTitle>
          <DialogDescription>Lecture seule.</DialogDescription>
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
              <p className="font-medium text-slate-700">Produit</p>
              <p className="text-slate-600 dark:text-slate-300">{row.product ?? '-'}</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


