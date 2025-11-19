import { unstable_noStore as noStore } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Button } from '@/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { NewModuleDialog } from '@/components/modules/new-module-dialog';
import { ModulesTableClient, type ModuleRow } from '@/components/modules/modules-table-client';

async function loadModules(): Promise<{ rows: ModuleRow[]; products: Record<string, string> }> {
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
        <CardContent>
          <ModulesTableClient rows={rows} products={products} />
        </CardContent>
      </Card>
    </div>
  );
}


