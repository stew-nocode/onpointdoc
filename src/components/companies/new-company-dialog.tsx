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
import { companyCreateSchema } from '@/lib/validators/company';
import { createCompanyWithSectors } from '@/services/companies';
import { toast } from 'sonner';

type NewCompanyDialogProps = {
  children: React.ReactNode;
};

export function NewCompanyDialog({ children }: NewCompanyDialogProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [countries, setCountries] = useState<Array<{ id: string; name: string }>>([]);
  const [countryId, setCountryId] = useState<string>('');

  const [sectors, setSectors] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedSectorIds, setSelectedSectorIds] = useState<string[]>([]);
  const [sectorToAdd, setSectorToAdd] = useState<string>('');
  const [contacts, setContacts] = useState<Array<{ id: string; label: string }>>([]);
  const [focalUserId, setFocalUserId] = useState<string>('');

  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const supabase = createSupabaseBrowserClient();
    supabase
      .from('countries')
      .select('id, name')
      .order('name', { ascending: true })
      .then(({ data }) => setCountries(data ?? []));
    supabase
      .from('sectors')
      .select('id, name')
      .order('name', { ascending: true })
      .then(({ data }) => setSectors(data ?? []));
    supabase
      .from('profiles')
      .select('id, full_name, email')
      .order('full_name', { ascending: true })
      .limit(200)
      .then(({ data }) =>
        setContacts(
          (data ?? []).map((p: any) => ({
            id: p.id as string,
            label: (p.full_name as string) || (p.email as string) || 'Utilisateur'
          }))
        )
      );
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = companyCreateSchema.parse({
        name,
        countryId,
        focalUserId,
        sectorIds: selectedSectorIds
      });
      await createCompanyWithSectors(payload);
      toast.success('Compagnie créée avec succès');
      setOpen(false);
      setName('');
      setCountryId('');
      setSelectedSectorIds([]);
      setFocalUserId('');
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
          <DialogTitle>Créer une compagnie</DialogTitle>
          <DialogDescription>Renseignez les informations de la compagnie.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">Nom</label>
              <input
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus-visible:outline-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                placeholder="Ex: Onpoint SA"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">Pays</label>
              <Combobox
                options={countries.map((c) => ({ value: c.id, label: c.name }))}
                value={countryId}
                onValueChange={setCountryId}
                placeholder="Sélectionner un pays"
                searchPlaceholder="Rechercher un pays..."
                emptyText="Aucun pays trouvé"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">Point focal</label>
            <Combobox
              options={contacts.map((c) => ({ value: c.id, label: c.label }))}
              value={focalUserId}
              onValueChange={setFocalUserId}
              placeholder="Sélectionner un contact"
              searchPlaceholder="Rechercher un contact..."
              emptyText="Aucun contact trouvé"
            />
            <p className="text-xs text-slate-500">Optionnel: personne de contact principale côté client.</p>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">Secteurs</label>
            <div className="flex gap-2">
              <select
                value={sectorToAdd}
                onChange={(e) => setSectorToAdd(e.target.value)}
                className="flex-1 rounded-lg border border-slate-200 px-2 py-2 text-sm focus-visible:outline-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="">-- Sélectionner un secteur --</option>
                {sectors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  if (!sectorToAdd) return;
                  setSelectedSectorIds((prev) => (prev.includes(sectorToAdd) ? prev : [...prev, sectorToAdd]));
                  setSectorToAdd('');
                }}
              >
                Ajouter
              </Button>
            </div>
            {selectedSectorIds.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {selectedSectorIds
                  .map((id) => sectors.find((s) => s.id === id))
                  .filter(Boolean)
                  .map((s) => (
                    <span
                      key={s!.id}
                      className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800"
                    >
                      {s!.name}
                      <button
                        type="button"
                        className="rounded p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700"
                        onClick={() =>
                          setSelectedSectorIds((prev) => prev.filter((v) => v !== s!.id))
                        }
                        aria-label={`Retirer ${s!.name}`}
                        title={`Retirer ${s!.name}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
              </div>
            )}
          </div>
          {error && <p className="text-sm text-status-danger">{error}</p>}
          <Button className="w-full" type="submit" disabled={saving}>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}


