import { unstable_noStore as noStore } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Button } from '@/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { NewSubmoduleDialog } from '@/components/submodules/new-submodule-dialog';
import { SubmodulesTableClient, type SubmoduleRow } from '@/components/submodules/submodules-table-client';

async function loadData(): Promise<{ rows: SubmoduleRow[]; modules: Record<string, string> }> {
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
        <CardContent>
          <SubmodulesTableClient rows={rows} modules={modules} />
        </CardContent>
      </Card>
    </div>
  );
}


