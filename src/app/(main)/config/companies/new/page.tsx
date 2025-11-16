'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';

export default function NewCompanyPage() {
  const [name, setName] = useState('');
  const [sectors, setSectors] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedSectorIds, setSelectedSectorIds] = useState<string[]>([]);
  const [sectorToAdd, setSectorToAdd] = useState<string>('');
  const [countries, setCountries] = useState<Array<{ id: string; name: string }>>([]);
  const [countryId, setCountryId] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase
      .from('sectors')
      .select('id, name')
      .order('name', { ascending: true })
      .then(({ data }) => setSectors(data ?? []));
    supabase
      .from('countries')
      .select('id, name')
      .order('name', { ascending: true })
      .then(({ data }) => setCountries(data ?? []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: company, error: insertErr } = await supabase
        .from('companies')
        .insert({ name, country_id: countryId || null })
        .select('id')
        .single();
      if (insertErr || !company) {
        setError(insertErr.message);
        return;
      }
      if (selectedSectorIds.length) {
        const rows = selectedSectorIds.map((sectorId) => ({
          company_id: company.id,
          sector_id: sectorId
        }));
        const { error: linkErr } = await supabase.from('company_sector_link').insert(rows);
        if (linkErr) {
          setError(linkErr.message);
          return;
        }
      }
      router.replace('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? 'Erreur inattendue');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Créer une compagnie</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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
              <select
                value={countryId}
                onChange={(e) => setCountryId(e.target.value)}
                className="rounded-lg border border-slate-200 px-2 py-2 text-sm focus-visible:outline-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="">-- Sélectionner un pays --</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
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
                    setSelectedSectorIds((prev) =>
                      prev.includes(sectorToAdd) ? prev : [...prev, sectorToAdd]
                    );
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
        </CardContent>
      </Card>
    </div>
  );
}


