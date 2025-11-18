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
import { Toggle } from '@/ui/toggle';
import { Combobox } from '@/ui/combobox';
import { contactUpdateSchema } from '@/lib/validators/user';
import { updateContact } from '@/services/contacts';
import { toast } from 'sonner';

type Props = {
  contactId: string;
  trigger: React.ReactNode;
};

export function EditContactDialog({ contactId, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [companyId, setCompanyId] = useState<string>('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      const supabase = createSupabaseBrowserClient();
      
      // Charger les entreprises
      const { data: companiesData } = await supabase
        .from('companies')
        .select('id, name')
        .order('name', { ascending: true });
      setCompanies(companiesData ?? []);

      // Charger les données du contact
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email, job_title, is_active, company_id')
        .eq('id', contactId)
        .single();
      
      setFullName((profile?.full_name as string) ?? '');
      setEmail((profile?.email as string) ?? '');
      setJobTitle((profile?.job_title as string) ?? '');
      setCompanyId((profile?.company_id as string) ?? '');
      setIsActive((profile?.is_active as boolean) ?? true);
      
      setLoading(false);
    })();
  }, [open, contactId]);

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
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Modifier le contact</DialogTitle>
          <DialogDescription>Mise à jour des informations du contact client.</DialogDescription>
        </DialogHeader>
        {loading ? (
          <p className="py-6 text-sm text-slate-500">Chargement…</p>
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

