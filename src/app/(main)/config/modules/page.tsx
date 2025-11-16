import { unstable_noStore as noStore } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Button } from '@/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { NewModuleDialog } from '@/components/modules/new-module-dialog';
import { ViewModuleDialog } from '@/components/modules/view-module-dialog';
import { EditModuleDialog } from '@/components/modules/edit-module-dialog';
import { DeleteModuleButton } from '@/components/modules/delete-module-button';
import { Eye, Pencil, Trash2 } from 'lucide-react';

type Row = {
  id: string;
  name: string;
  product_id: string;
  created_at: string;
};

async function loadModules(): Promise<{ rows: Row[]; products: Record<string, string> }> {
  noStore();
  const supabase = createSupabaseServerClient();
  const [{ data: modules, error: mErr }, { data: products, error: pErr }] = await Promise.all([
    supabase.from('modules').select('id, name, product_id, created_at').order('created_at', { ascending: false }),
    supabase.from('products').select('id, name').order('name', { ascending: true })
  ]);
  if (mErr || pErr) {
    throw new Error(mErr?.message || pErr?.message || 'Load error');
  }
  const map: Record<string, string> = {};
  for (const p of products ?? []) map[(p as any).id] = (p as any).name;
  return { rows: (modules as any) ?? [], products: map };
}

export default async function ModulesIndexPage() {
  const { rows, products } = await loadModules();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Modules</h1>
        <NewModuleDialog>
          <Button>Nouveau module</Button>
        </NewModuleDialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Liste des modules</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <tr>
                <th className="pb-2">Nom</th>
                <th className="pb-2">Produit</th>
                <th className="pb-2">Créé le</th>
                <th className="pb-2 w-[84px]" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-3 font-medium">{r.name}</td>
                  <td className="py-3">{products[r.product_id] ?? '-'}</td>
                  <td className="py-3">
                    {new Date(r.created_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="py-3 text-right w-[84px]">
                    <div className="flex justify-end gap-1.5">
                      <ViewModuleDialog
                        moduleId={r.id}
                        trigger={
                          <button
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md p-0 text-slate-600 hover:bg-slate-600/10 dark:text-slate-200 dark:hover:bg-slate-200/10"
                            aria-label="Voir"
                          >
                            <Eye className="h-3 w-3" />
                          </button>
                        }
                      />
                      <EditModuleDialog
                        moduleId={r.id}
                        trigger={
                          <button
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md p-0 text-slate-600 hover:bg-slate-600/10 dark:text-slate-200 dark:hover:bg-slate-200/10"
                            aria-label="Modifier"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        }
                      />
                      <DeleteModuleButton
                        moduleId={r.id}
                        moduleName={r.name}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md p-0 text-slate-600 hover:bg-slate-600/10 dark:text-slate-200 dark:hover:bg-slate-200/10"
                      >
                        <Trash2 className="h-3 w-3" />
                      </DeleteModuleButton>
                    </div>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    Aucun module.
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


