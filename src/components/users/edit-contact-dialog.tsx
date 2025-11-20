/**
 * Dialog pour modifier un contact existant
 * 
 * Utilise les hooks personnalisés pour charger les données (companies, profile)
 * Séparant la logique métier de la présentation selon les principes Clean Code
 */

'use client';

import { useEffect, useState } from 'react';
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
import { Toggle } from '@/ui/toggle';
import { Combobox } from '@/ui/combobox';
import { contactUpdateSchema } from '@/lib/validators/user';
import { updateContact } from '@/services/contacts';
import { toast } from 'sonner';
import { useCompanies, useProfile } from '@/hooks';

type Props = {
  contactId: string;
  trigger: React.ReactNode;
};

/**
 * Dialog pour modifier un contact existant
 * 
 * @param contactId - ID du contact à modifier
 * @param trigger - Trigger pour ouvrir le dialog
 */
export function EditContactDialog({ contactId, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Formulaire
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [companyId, setCompanyId] = useState<string>('');
  const [isActive, setIsActive] = useState(true);

  // Charger les données avec les hooks personnalisés (uniquement quand le dialog est ouvert)
  const { companyOptions: companies, isLoading: isLoadingCompanies } = useCompanies({ enabled: open });
  const { profile, isLoading: isLoadingProfile } = useProfile(open ? contactId : null, { enabled: open });

  // Pré-remplir le formulaire quand le profil est chargé
  useEffect(() => {
    if (profile && open) {
      setFullName(profile.full_name ?? '');
      setEmail(profile.email ?? '');
      setJobTitle(profile.job_title ?? '');
      setCompanyId(profile.company_id ?? '');
      setIsActive(profile.is_active ?? true);
    }
  }, [profile, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = contactUpdateSchema.parse({
        id: contactId,
        fullName,
        email,
        jobTitle: jobTitle || undefined,
        companyId: companyId || undefined,
        isActive
      });
      await updateContact(payload);
      toast.success('Contact mis à jour');
      setOpen(false);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inattendue';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  const isLoading = isLoadingCompanies || isLoadingProfile;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Modifier le contact</DialogTitle>
          <DialogDescription>Mise à jour des informations du contact client.</DialogDescription>
        </DialogHeader>
        {isLoading ? (
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
            <Toggle checked={isActive} onChange={setIsActive} label="Actif" />
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
