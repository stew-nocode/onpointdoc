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

type EditCompanyDialogProps = {
  companyId: string;
  trigger: React.ReactNode;
};

export function EditCompanyDialog({ companyId, trigger }: EditCompanyDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
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
    (async () => {
      setLoading(true);
      const supabase = createSupabaseBrowserClient();
      const [{ data: countriesData }, { data: sectorsData }, { data: profilesData }] = await Promise.all([
        supabase.from('countries').select('id, name').order('name', { ascending: true }),
        supabase.from('sectors').select('id, name').order('name', { ascending: true }),
        supabase.from('profiles').select('id, full_name, email').order('full_name', { ascending: true })
      ]);
      setCountries(countriesData ?? []);
      setSectors(sectorsData ?? []);
      setContacts(
        (profilesData ?? []).map((p: any) => ({
          id: p.id as string,
          label: (p.full_name as string) || (p.email as string) || 'Utilisateur'
        }))
      );

      // Charger la compagnie et ses secteurs
      const { data: company } = await supabase
        .from('companies')
        .select('name, country_id, focal_user_id')
        .eq('id', companyId)
        .single();
      setName((company?.name as string) ?? '');
      setCountryId((company?.country_id as string) ?? '');
      setFocalUserId((company?.focal_user_id as string) ?? '');

      const { data: links } = await supabase
        .from('company_sector_link')
        .select('sector_id')
        .eq('company_id', companyId);
      setSelectedSectorIds((links ?? []).map((l: any) => l.sector_id as string));
      setLoading(false);
    })();
  }, [open, companyId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: updErr } = await supabase
        .from('companies')
        .update({ name, country_id: countryId || null, focal_user_id: focalUserId || null })
        .eq('id', companyId);
      if (updErr) {
        setError(updErr.message);
        return;
      }
      // Remplacer les liaisons
      await supabase.from('company_sector_link').delete().eq('company_id', companyId);
      if (selectedSectorIds.length) {
        const rows = selectedSectorIds.map((sectorId) => ({
          company_id: companyId,
          sector_id: sectorId
        }));
        const { error: linkErr } = await supabase.from('company_sector_link').insert(rows);
        if (linkErr) {
          setError(linkErr.message);
          return;
        }
      }
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? 'Erreur inattendue');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Modifier la compagnie</DialogTitle>
          <DialogDescription>Mettre à jour les informations de la compagnie.</DialogDescription>
        </DialogHeader>
        {loading ? (
          <p className="py-6 text-sm text-slate-500">Chargement…</p>
        ) : (
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
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}


