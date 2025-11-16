import { unstable_noStore as noStore } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Button } from '@/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { NewFeatureDialog } from '@/components/features/new-feature-dialog';
import { ViewFeatureDialog } from '@/components/features/view-feature-dialog';
import { EditFeatureDialog } from '@/components/features/edit-feature-dialog';
import { DeleteFeatureButton } from '@/components/features/delete-feature-button';
import { Eye, Pencil, Trash2 } from 'lucide-react';

type Row = {
  id: string;
  name: string;
  submodule_id: string;
  created_at: string;
};

async function loadData(): Promise<{ rows: Row[]; submodules: Record<string, string> }> {
  noStore();
  const supabase = createSupabaseServerClient();
  const [{ data: feats, error: fErr }, { data: subs, error: sErr }] = await Promise.all([
    supabase.from('features').select('id, name, submodule_id, created_at').order('created_at', { ascending: false }),
    supabase.from('submodules').select('id, name').order('name', { ascending: true })
  ]);
  if (fErr || sErr) throw new Error(fErr?.message || sErr?.message || 'Load error');
  const subMap: Record<string, string> = {};
  for (const s of subs ?? []) subMap[(s as any).id] = (s as any).name;
  return { rows: (feats as any) ?? [], submodules: subMap };
}

export default async function FeaturesIndexPage() {
  const { rows, submodules } = await loadData();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Fonctionnalités</h1>
        <NewFeatureDialog>
          <Button>Nouvelle fonctionnalité</Button>
        </NewFeatureDialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Liste des fonctionnalités</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <tr>
                <th className="pb-2">Nom</th>
                <th className="pb-2">Sous-module</th>
                <th className="pb-2">Créée le</th>
                <th className="pb-2 w-[84px]" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-3 font-medium">{r.name}</td>
                  <td className="py-3">{submodules[r.submodule_id] ?? '-'}</td>
                  <td className="py-3">
                    {new Date(r.created_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="py-3 text-right w-[84px]">
                    <div className="flex justify-end gap-1.5">
                      <ViewFeatureDialog
                        featureId={r.id}
                        trigger={
                          <button
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md p-0 text-slate-600 hover:bg-slate-600/10 dark:text-slate-200 dark:hover:bg-slate-200/10"
                            aria-label="Voir"
                          >
                            <Eye className="h-3 w-3" />
                          </button>
                        }
                      />
                      <EditFeatureDialog
                        featureId={r.id}
                        trigger={
                          <button
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md p-0 text-slate-600 hover:bg-slate-600/10 dark:text-slate-200 dark:hover:bg-slate-200/10"
                            aria-label="Modifier"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        }
                      />
                      <DeleteFeatureButton
                        featureId={r.id}
                        featureName={r.name}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md p-0 text-slate-600 hover:bg-slate-600/10 dark:text-slate-200 dark:hover:bg-slate-200/10"
                      >
                        <Trash2 className="h-3 w-3" />
                      </DeleteFeatureButton>
                    </div>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    Aucune fonctionnalité.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}


