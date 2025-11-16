import { unstable_noStore as noStore } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Button } from '@/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { NewSubmoduleDialog } from '@/components/submodules/new-submodule-dialog';
import { ViewSubmoduleDialog } from '@/components/submodules/view-submodule-dialog';
import { EditSubmoduleDialog } from '@/components/submodules/edit-submodule-dialog';
import { DeleteSubmoduleButton } from '@/components/submodules/delete-submodule-button';
import { Eye, Pencil, Trash2 } from 'lucide-react';

type Row = {
  id: string;
  name: string;
  module_id: string;
  created_at: string;
};

async function loadData(): Promise<{ rows: Row[]; modules: Record<string, string> }> {
  noStore();
  const supabase = createSupabaseServerClient();
  const [{ data: subs, error: sErr }, { data: mods, error: mErr }] = await Promise.all([
    supabase.from('submodules').select('id, name, module_id, created_at').order('created_at', { ascending: false }),
    supabase.from('modules').select('id, name').order('name', { ascending: true })
  ]);
  if (sErr || mErr) {
    throw new Error(sErr?.message || mErr?.message || 'Load error');
  }
  const modsMap: Record<string, string> = {};
  for (const m of mods ?? []) modsMap[(m as any).id] = (m as any).name;
  return { rows: (subs as any) ?? [], modules: modsMap };
}

export default async function SubmodulesIndexPage() {
  const { rows, modules } = await loadData();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Sous-modules</h1>
        <NewSubmoduleDialog>
          <Button>Nouveau sous-module</Button>
        </NewSubmoduleDialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Liste des sous-modules</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <tr>
                <th className="pb-2">Nom</th>
                <th className="pb-2">Module parent</th>
                <th className="pb-2">Créé le</th>
                <th className="pb-2 w-[84px]" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-3 font-medium">{r.name}</td>
                  <td className="py-3">{modules[r.module_id] ?? '-'}</td>
                  <td className="py-3">
                    {new Date(r.created_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="py-3 text-right w-[84px]">
                    <div className="flex justify-end gap-1.5">
                      <ViewSubmoduleDialog
                        submoduleId={r.id}
                        trigger={
                          <button
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md p-0 text-slate-600 hover:bg-slate-600/10 dark:text-slate-200 dark:hover:bg-slate-200/10"
                            aria-label="Voir"
                          >
                            <Eye className="h-3 w-3" />
                          </button>
                        }
                      />
                      <EditSubmoduleDialog
                        submoduleId={r.id}
                        trigger={
                          <button
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md p-0 text-slate-600 hover:bg-slate-600/10 dark:text-slate-200 dark:hover:bg-slate-200/10"
                            aria-label="Modifier"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        }
                      />
                      <DeleteSubmoduleButton
                        submoduleId={r.id}
                        submoduleName={r.name}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md p-0 text-slate-600 hover:bg-slate-600/10 dark:text-slate-200 dark:hover:bg-slate-200/10"
                      >
                        <Trash2 className="h-3 w-3" />
                      </DeleteSubmoduleButton>
                    </div>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    Aucun sous-module.
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


