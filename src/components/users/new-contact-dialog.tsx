'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/ui/dialog';
import { Toggle } from '@/ui/toggle';

type Props = { children: React.ReactNode };

export function NewContactDialog({ children }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyId, setCompanyId] = useState<string>('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!open) return;
    const supabase = createSupabaseBrowserClient();
    supabase.from('companies').select('id, name').order('name', { ascending: true }).then(({ data }) => {
      setCompanies(data ?? []);
    });
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const resp = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          password,
          role: 'client',
          companyId: companyId || null,
          isActive
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
      setCompanyId('');
      setIsActive(true);
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
          <DialogTitle>Créer un contact</DialogTitle>
          <DialogDescription>Compte client (externe) avec entreprise associée.</DialogDescription>
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
          <Toggle checked={isActive} onChange={setIsActive} label="Actif" />
          {error && <p className="text-sm text-status-danger">{error}</p>}
          <Button className="w-full" type="submit" disabled={saving}>
            {saving ? 'Création…' : 'Créer'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}


