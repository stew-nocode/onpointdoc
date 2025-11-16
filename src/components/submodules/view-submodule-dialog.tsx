'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/ui/dialog';

type Props = { submoduleId: string; trigger: React.ReactNode };

export function ViewSubmoduleDialog({ submoduleId, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [row, setRow] = useState<{ name: string; moduleName?: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      const supabase = createSupabaseBrowserClient();
      const { data: sm } = await supabase.from('submodules').select('name, module_id').eq('id', submoduleId).single();
      const { data: mods } = await supabase.from('modules').select('id, name');
      setRow({
        name: (sm as any)?.name ?? '',
        moduleName: (mods ?? []).find((m: any) => m.id === (sm as any)?.module_id)?.name
      });
      setLoading(false);
    })();
  }, [open, submoduleId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Détails du sous-module</DialogTitle>
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
              <p className="font-medium text-slate-700">Module parent</p>
              <p className="text-slate-600 dark:text-slate-300">{row.moduleName ?? '-'}</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


