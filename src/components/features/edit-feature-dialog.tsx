'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/ui/dialog';
import { Combobox } from '@/ui/combobox';

type Props = { featureId: string; trigger: React.ReactNode };

export function EditFeatureDialog({ featureId, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [submoduleId, setSubmoduleId] = useState('');
  const [submodules, setSubmodules] = useState<Array<{ id: string; name: string }>>([]);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      const supabase = createSupabaseBrowserClient();
      const [{ data: f }, { data: subs }] = await Promise.all([
        supabase.from('features').select('name, submodule_id').eq('id', featureId).single(),
        supabase.from('submodules').select('id, name').order('name', { ascending: true })
      ]);
      setName((f as any)?.name ?? '');
      setSubmoduleId((f as any)?.submodule_id ?? '');
      setSubmodules(subs ?? []);
      setLoading(false);
    })();
  }, [open, featureId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: updErr } = await supabase.from('features').update({ name, submodule_id: submoduleId }).eq('id', featureId);
      if (updErr) {
        setError(updErr.message);
        return;
      }
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? 'Erreur inattendue');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Modifier la fonctionnalité</DialogTitle>
          <DialogDescription>Mise à jour du nom et du sous-module.</DialogDescription>
        </DialogHeader>
        {loading ? (
          <p className="py-6 text-sm text-slate-500">Chargement…</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
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
                <Combobox
                  options={submodules.map((sm) => ({ value: sm.id, label: sm.name }))}
                  value={submoduleId}
                  onValueChange={setSubmoduleId}
                  placeholder="Sélectionner un sous-module"
                  searchPlaceholder="Rechercher un sous-module..."
                  emptyText="Aucun sous-module trouvé"
                />
              </div>
            </div>
            {error && <p className="text-sm text-status-danger">{error}</p>}
            <Button className="w-full" type="submit" disabled={saving}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}


