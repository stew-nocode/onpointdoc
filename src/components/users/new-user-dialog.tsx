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

type Props = { children: React.ReactNode };

export function NewUserDialog({ children }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [modules, setModules] = useState<Array<{ id: string; name: string }>>([]);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'agent' | 'manager' | 'admin' | 'director' | 'client'>('agent');
  const [companyId, setCompanyId] = useState<string>('');
  const [isActive, setIsActive] = useState(true);
  const [moduleToAdd, setModuleToAdd] = useState<string>('');
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    const supabase = createSupabaseBrowserClient();
    supabase.from('companies').select('id, name').order('name', { ascending: true }).then(({ data }) => {
      setCompanies(data ?? []);
    });
    supabase.from('modules').select('id, name').order('name', { ascending: true }).then(({ data }) => {
      setModules(data ?? []);
    });
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      // Appel API server pour créer compte Auth + profil
      const resp = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          password,
          role,
          companyId: companyId || null,
          isActive,
          moduleIds: selectedModuleIds
        })
      });
      if (!resp.ok) {
        const msg = await resp.text();
        setError(msg || 'Erreur lors de la création');
        return;
      }
      setOpen(false);
      setFullName('');
      setEmail('');
      setPassword('');
      setRole('agent');
      setCompanyId('');
      setIsActive(true);
      setSelectedModuleIds([]);
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
          <DialogTitle>Créer un utilisateur</DialogTitle>
          <DialogDescription>Compte Auth + profil + affectations modules.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">Nom complet</label>
            <input
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus-visible:outline-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus-visible:outline-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">Mot de passe (temporaire)</label>
            <input
              type="password"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus-visible:outline-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">Rôle</label>
            <select
              className="rounded-lg border border-slate-200 px-2 py-2 text-sm focus-visible:outline-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
            >
              {['agent', 'manager', 'admin', 'director', 'client'].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">Entreprise</label>
            <select
              className="rounded-lg border border-slate-200 px-2 py-2 text-sm focus-visible:outline-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
            >
              <option value="">-- Aucune --</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">Affectations modules</label>
            <div className="flex gap-2">
              <select
                value={moduleToAdd}
                onChange={(e) => setModuleToAdd(e.target.value)}
                className="flex-1 rounded-lg border border-slate-200 px-2 py-2 text-sm focus-visible:outline-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="">-- Sélectionner un module --</option>
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  if (!moduleToAdd) return;
                  setSelectedModuleIds((prev) => (prev.includes(moduleToAdd) ? prev : [...prev, moduleToAdd]));
                  setModuleToAdd('');
                }}
              >
                Ajouter
              </Button>
            </div>
            {selectedModuleIds.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {selectedModuleIds
                  .map((id) => modules.find((m) => m.id === id))
                  .filter(Boolean)
                  .map((m) => (
                    <span
                      key={m!.id}
                      className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800"
                    >
                      {m!.name}
                      <button
                        type="button"
                        className="rounded p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700"
                        onClick={() => setSelectedModuleIds((prev) => prev.filter((v) => v !== m!.id))}
                      >
                        ×
                      </button>
                    </span>
                  ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input id="isActive" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            <label htmlFor="isActive" className="text-sm text-slate-700">
              Actif
            </label>
          </div>
          {error && <p className="text-sm text-status-danger">{error}</p>}
          <Button className="w-full" type="submit" disabled={saving}>
            {saving ? 'Création…' : 'Créer'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}


