'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/ui/dialog';
import { departmentCreateSchema } from '@/lib/validators/department';
import { createDepartment } from '@/services/departments/client';
import { toast } from 'sonner';

type Props = { children: React.ReactNode };

export function NewDepartmentDialog({ children }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = departmentCreateSchema.parse({
        name,
        code,
        description: description || null,
        color: color || null
      });
      await createDepartment(payload);
      toast.success('Département créé');
      setOpen(false);
      setName('');
      setCode('');
      setDescription('');
      setColor('#3B82F6');
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
          <DialogTitle>Créer un département</DialogTitle>
          <DialogDescription>Définissez les informations du nouveau département.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nom *</label>
              <input
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus-visible:outline-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Code *</label>
              <input
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus-visible:outline-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
                minLength={2}
                maxLength={10}
                placeholder="SUP, IT, MKT..."
              />
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
            <textarea
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus-visible:outline-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Couleur</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-20 cursor-pointer rounded border border-slate-200 dark:border-slate-700"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus-visible:outline-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                placeholder="#3B82F6"
                pattern="^#[0-9A-Fa-f]{6}$"
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

