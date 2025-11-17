'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/ui/dialog';
import { Combobox } from '@/ui/combobox';
import { submoduleCreateSchema } from '@/lib/validators/product';
import { createSubmodule } from '@/services/products/client';
import { toast } from 'sonner';

type Props = { children: React.ReactNode };

export function NewSubmoduleDialog({ children }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [moduleId, setModuleId] = useState('');
  const [modules, setModules] = useState<Array<{ id: string; name: string }>>([]);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const supabase = createSupabaseBrowserClient();
    supabase.from('modules').select('id, name').order('name', { ascending: true }).then(({ data }) => {
      setModules(data ?? []);
    });
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = submoduleCreateSchema.parse({ name, moduleId });
      await createSubmodule(payload);
      toast.success('Sous-module créé');
      setOpen(false);
      setName('');
      setModuleId('');
      router.refresh();
    } catch (err: any) {
      const msg = err?.message ?? 'Erreur inattendue';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Créer un sous-module</DialogTitle>
          <DialogDescription>Associez-le à un module parent.</DialogDescription>
        </DialogHeader>
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
              <label className="text-sm font-medium text-slate-700">Module parent</label>
              <Combobox
                options={modules.map((m) => ({ value: m.id, label: m.name }))}
                value={moduleId}
                onValueChange={setModuleId}
                placeholder="Sélectionner un module"
                searchPlaceholder="Rechercher un module..."
                emptyText="Aucun module trouvé"
              />
            </div>
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


