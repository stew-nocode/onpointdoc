/**
 * Dialog pour créer un nouveau contact (client externe)
 * 
 * Utilise les hooks personnalisés pour charger les données (companies)
 * Séparant la logique métier de la présentation selon les principes Clean Code
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/ui/dialog';
import { Toggle } from '@/ui/toggle';
import { Combobox } from '@/ui/combobox';
import { contactCreateSchema } from '@/lib/validators/user';
import { createContact } from '@/services/contacts';
import { toast } from 'sonner';
import { useCompanies } from '@/hooks';

type Props = { children: React.ReactNode };

/**
 * Dialog pour créer un nouveau contact (client externe)
 * 
 * @param children - Trigger pour ouvrir le dialog
 */
export function NewContactDialog({ children }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Formulaire
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [companyId, setCompanyId] = useState<string>('');
  const [isActive, setIsActive] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Charger les entreprises avec le hook personnalisé (uniquement quand le dialog est ouvert)
  const { companyOptions: companies, isLoading: isLoadingCompanies } = useCompanies({ enabled: open });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = contactCreateSchema.parse({
        fullName,
        email,
        password,
        jobTitle: jobTitle || undefined,
        companyId,
        isActive
      });
      await createContact(payload);
      toast.success('Contact créé avec succès');
      setOpen(false);
      setFullName('');
      setEmail('');
      setPassword('');
      setJobTitle('');
      setCompanyId('');
      setIsActive(true);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inattendue';
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
        {isLoadingCompanies ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-brand border-t-transparent" />
          </div>
        ) : (
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
              <label className="text-sm font-medium text-slate-700">Fonction</label>
              <input
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus-visible:outline-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Ex: Chef comptable, Comptable, Standard..."
              />
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
        )}
      </DialogContent>
    </Dialog>
  );
}


