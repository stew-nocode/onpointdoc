'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/ui/dialog';

type Props = { featureId: string; trigger: React.ReactNode };

export function ViewFeatureDialog({ featureId, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [row, setRow] = useState<{ name: string; submoduleName?: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      const supabase = createSupabaseBrowserClient();
      const { data: f } = await supabase.from('features').select('name, submodule_id').eq('id', featureId).single();
      const { data: subs } = await supabase.from('submodules').select('id, name');
      setRow({
        name: (f as any)?.name ?? '',
        submoduleName: (subs ?? []).find((s: any) => s.id === (f as any)?.submodule_id)?.name
      });
      setLoading(false);
    })();
  }, [open, featureId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Détails de la fonctionnalité</DialogTitle>
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
              <p className="font-medium text-slate-700">Sous-module</p>
              <p className="text-slate-600 dark:text-slate-300">{row.submoduleName ?? '-'}</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


