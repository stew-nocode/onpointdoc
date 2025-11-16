'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/ui/dialog';

type Props = { submoduleId: string; trigger: React.ReactNode };

export function EditSubmoduleDialog({ submoduleId, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [moduleId, setModuleId] = useState('');
  const [modules, setModules] = useState<Array<{ id: string; name: string }>>([]);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      const supabase = createSupabaseBrowserClient();
      const [{ data: sm }, { data: mods }] = await Promise.all([
        supabase.from('submodules').select('name, module_id').eq('id', submoduleId).single(),
        supabase.from('modules').select('id, name').order('name', { ascending: true })
      ]);
      setName((sm as any)?.name ?? '');
      setModuleId((sm as any)?.module_id ?? '');
      setModules(mods ?? []);
      setLoading(false);
    })();
  }, [open, submoduleId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: updErr } = await supabase.from('submodules').update({ name, module_id: moduleId }).eq('id', submoduleId);
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
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Modifier le sous-module</DialogTitle>
          <DialogDescription>Mise à jour du nom et du module parent.</DialogDescription>
        </DialogHeader>
        {loading ? (
          <p className="py-6 text-sm text-slate-500">Chargement…</p>
        ) : (
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
              <label className="text-sm font-medium text-slate-700">Module parent</label>
              <select
                className="rounded-lg border border-slate-200 px-2 py-2 text-sm focus-visible:outline-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                value={moduleId}
                onChange={(e) => setModuleId(e.target.value)}
                required
              >
                <option value="">-- Sélectionner un module --</option>
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
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


