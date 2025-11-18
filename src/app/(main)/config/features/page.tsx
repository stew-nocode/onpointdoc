import { unstable_noStore as noStore } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Button } from '@/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { NewFeatureDialog } from '@/components/features/new-feature-dialog';
import { FeaturesTableClient, type FeatureRow } from '@/components/features/features-table-client';

async function loadData(): Promise<{ rows: FeatureRow[]; submodules: Record<string, string> }> {
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
        <CardContent>
          <FeaturesTableClient rows={rows} submodules={submodules} />
        </CardContent>
      </Card>
    </div>
  );
}


