'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/ui/dialog';
import { departmentUpdateSchema } from '@/lib/validators/department';
import { updateDepartment } from '@/services/departments/client';
import { DepartmentProductsManager } from '@/components/departments/department-products-manager';
import { toast } from 'sonner';

type Props = { departmentId: string; trigger: React.ReactNode };

/**
 * Dialog d'édition d'un département.
 * Permet de modifier les informations d'un département (nom, code, description, couleur, statut)
 * et de gérer les produits associés.
 * @param departmentId - UUID du département à modifier
 * @param trigger - Élément React déclenchant l'ouverture du dialog
 */
export function EditDepartmentDialog({ departmentId, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [isActive, setIsActive] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase
        .from('departments')
        .select('name, code, description, color, is_active')
        .eq('id', departmentId)
        .single();
      if (data) {
        setName(data.name ?? '');
        setCode(data.code ?? '');
        setDescription(data.description ?? '');
        setColor(data.color ?? '#3B82F6');
        setIsActive(data.is_active ?? true);
      }
      setLoading(false);
    })();
  }, [open, departmentId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = departmentUpdateSchema.parse({
        id: departmentId,
        name,
        code,
        description: description || null,
        color: color || null,
        is_active: isActive
      });
      await updateDepartment(payload);
      toast.success('Département mis à jour');
      setOpen(false);
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
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Modifier le département</DialogTitle>
          <DialogDescription>Mise à jour des informations du département.</DialogDescription>
        </DialogHeader>
        {loading ? (
          <p className="py-6 text-sm text-slate-500">Chargement…</p>
        ) : (
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
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand dark:border-slate-600"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Département actif
              </label>
            </div>
            <div className="space-y-4 border-t border-slate-200 pt-4 dark:border-slate-700">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Produits associés</label>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Gérez les produits accessibles à ce département
                </p>
              </div>
              <DepartmentProductsManager departmentId={departmentId} />
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

