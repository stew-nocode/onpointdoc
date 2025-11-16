'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/ui/dialog';

type Props = { children: React.ReactNode };

export function NewFeatureDialog({ children }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [submoduleId, setSubmoduleId] = useState('');
  const [submodules, setSubmodules] = useState<Array<{ id: string; name: string }>>([]);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const supabase = createSupabaseBrowserClient();
    supabase.from('submodules').select('id, name').order('name', { ascending: true }).then(({ data }) => {
      setSubmodules(data ?? []);
    });
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: insErr } = await supabase.from('features').insert({ name, submodule_id: submoduleId });
      if (insErr) {
        setError(insErr.message);
        return;
      }
      setOpen(false);
      setName('');
      setSubmoduleId('');
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? 'Erreur inattendue');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Créer une fonctionnalité</DialogTitle>
          <DialogDescription>Associez-la à un sous-module.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">Nom</label>
            <input
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus-visible:outline-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">Sous-module</label>
            <select
              className="rounded-lg border border-slate-200 px-2 py-2 text-sm focus-visible:outline-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              value={submoduleId}
              onChange={(e) => setSubmoduleId(e.target.value)}
              required
            >
              <option value="">-- Sélectionner un sous-module --</option>
              {submodules.map((sm) => (
                <option key={sm.id} value={sm.id}>
                  {sm.name}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="text-sm text-status-danger">{error}</p>}
          <Button className="w-full" type="submit" disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}


