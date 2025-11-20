/**
 * Dialog pour modifier une entreprise existante
 * 
 * Utilise les hooks personnalisés pour charger les données (countries, sectors, profiles, company)
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
import { Combobox } from '@/ui/combobox';
import { useCountries, useSectors, useProfiles, useCompany, useCompanySectors } from '@/hooks';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

type EditCompanyDialogProps = {
  companyId: string;
  trigger: React.ReactNode;
};

/**
 * Dialog pour modifier une entreprise existante
 * 
 * @param companyId - ID de l'entreprise à modifier
 * @param trigger - Trigger pour ouvrir le dialog
 */
export function EditCompanyDialog({ companyId, trigger }: EditCompanyDialogProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Formulaire
  const [name, setName] = useState('');
  const [countryId, setCountryId] = useState<string>('');
  const [selectedSectorIds, setSelectedSectorIds] = useState<string[]>([]);
  const [sectorToAdd, setSectorToAdd] = useState<string>('');
  const [focalUserId, setFocalUserId] = useState<string>('');

  // Charger les données avec les hooks personnalisés (uniquement quand le dialog est ouvert)
  const { countries, isLoading: isLoadingCountries } = useCountries({ enabled: open });
  const { sectors: sectorsData, isLoading: isLoadingSectors } = useSectors({ enabled: open });
  const { profileOptions: contacts, isLoading: isLoadingProfiles } = useProfiles({
    enabled: open,
    asOptions: true
  });
  const { company, isLoading: isLoadingCompany } = useCompany(open ? companyId : null, { enabled: open });
  const { sectorIds: assignedSectorIds, isLoading: isLoadingCompanySectors } = useCompanySectors(
    open ? companyId : null,
    { enabled: open }
  );

  // Pré-remplir le formulaire quand l'entreprise est chargée
  useEffect(() => {
    if (company && open) {
      setName(company.name);
      setCountryId(company.country_id ?? '');
      setFocalUserId(company.focal_user_id ?? '');
    }
  }, [company, open]);

  // Pré-remplir les secteurs assignés quand ils sont chargés
  useEffect(() => {
    if (assignedSectorIds.length > 0 && open) {
      setSelectedSectorIds(assignedSectorIds);
    }
  }, [assignedSectorIds, open]);

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
        throw new Error(updErr.message);
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
          throw new Error(linkErr.message);
        }
      }
      toast.success('Compagnie mise à jour');
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

  const isLoading =
    isLoadingCountries || isLoadingSectors || isLoadingProfiles || isLoadingCompany || isLoadingCompanySectors;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Modifier la compagnie</DialogTitle>
          <DialogDescription>Mettre à jour les informations de la compagnie.</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-brand border-t-transparent" />
          </div>
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
                  {sectorsData.map((s) => (
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
                    .map((id) => {
                      const sector = sectorsData.find((s) => s.id === id);
                      if (!sector) return null;
                      return (
                        <span
                          key={sector.id}
                          className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800"
                        >
                          {sector.name}
                          <button
                            type="button"
                            className="rounded p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700"
                            onClick={() =>
                              setSelectedSectorIds((prev) => prev.filter((v) => v !== sector.id))
                            }
                            aria-label={`Retirer ${sector.name}`}
                            title={`Retirer ${sector.name}`}
                          >
                            ×
                          </button>
                        </span>
                      );
                    })
                    .filter(Boolean)}
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
