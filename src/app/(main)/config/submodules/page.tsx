import { unstable_noStore as noStore } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Button } from '@/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { NewSubmoduleDialogLazy } from '@/components/submodules/new-submodule-dialog-lazy';
import { SubmodulesTableClient, type SubmoduleRow } from '@/components/submodules/submodules-table-client';
import type { Module } from '@/types/module';
import type { Submodule } from '@/types/submodule';
import { StandardPageHeader } from '@/components/layout/page';

async function loadData(): Promise<{ rows: SubmoduleRow[]; modules: Record<string, string> }> {
  noStore();
  const supabase = await createSupabaseServerClient();
  const [{ data: subs, error: sErr }, { data: mods, error: mErr }] = await Promise.all([
    supabase.from('submodules').select('id, name, module_id, created_at').order('created_at', { ascending: false }),
    supabase.from('modules').select('id, name').order('name', { ascending: true })
  ]);
  if (sErr || mErr) {
    throw new Error(sErr?.message || mErr?.message || 'Load error');
  }
  const modsMap: Record<string, string> = {};
  for (const m of (mods ?? []) as Module[]) {
    modsMap[m.id] = m.name;
  }
  return { rows: (subs ?? []) as SubmoduleRow[], modules: modsMap };
}

export default async function SubmodulesIndexPage() {
  const { rows, modules } = await loadData();
  return (
    <div className="space-y-6">
      <StandardPageHeader
        icon="Layers"
        title="Sous-modules"
        description="Gérez les sous-modules des modules"
        actions={
          <NewSubmoduleDialogLazy>
            <Button>Nouveau sous-module</Button>
          </NewSubmoduleDialogLazy>
        }
      />
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


