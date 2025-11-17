'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/ui/dialog';
import { Toggle } from '@/ui/toggle';
import { Combobox } from '@/ui/combobox';
import { contactCreateSchema } from '@/lib/validators/user';
import { createContact } from '@/services/contacts';
import { toast } from 'sonner';

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
  const [showPassword, setShowPassword] = useState(false);

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
      const payload = contactCreateSchema.parse({
        fullName,
        email,
        password,
        companyId,
        isActive
      });
      await createContact(payload);
      toast.success('Contact créé avec succès');
      setOpen(false);
      setFullName('');
      setEmail('');
      setPassword('');
      setCompanyId('');
      setIsActive(true);
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
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Créer un contact</DialogTitle>
          <DialogDescription>Compte client (externe) avec entreprise associée.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
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
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">Mot de passe (temporaire)</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 pr-10 text-sm focus-visible:outline-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">Entreprise</label>
              <Combobox
                options={companies.map((c) => ({ value: c.id, label: c.name }))}
                value={companyId}
                onValueChange={setCompanyId}
                placeholder="Sélectionner une entreprise"
                searchPlaceholder="Rechercher une entreprise..."
                emptyText="Aucune entreprise trouvée"
              />
            </div>
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


