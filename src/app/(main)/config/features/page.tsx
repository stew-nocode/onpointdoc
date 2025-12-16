import { unstable_noStore as noStore } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Button } from '@/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { NewFeatureDialogLazy } from '@/components/features/new-feature-dialog-lazy';
import { FeaturesTableClient, type FeatureRow } from '@/components/features/features-table-client';
import type { Submodule } from '@/types/submodule';
import type { Feature } from '@/types/feature';
import { StandardPageHeader } from '@/components/layout/page';

async function loadData(): Promise<{ rows: FeatureRow[]; submodules: Record<string, string> }> {
  noStore();
  const supabase = await createSupabaseServerClient();
  const [{ data: feats, error: fErr }, { data: subs, error: sErr }] = await Promise.all([
    supabase.from('features').select('id, name, submodule_id, created_at').order('created_at', { ascending: false }),
    supabase.from('submodules').select('id, name').order('name', { ascending: true })
  ]);
  if (fErr || sErr) throw new Error(fErr?.message || sErr?.message || 'Load error');
  const subMap: Record<string, string> = {};
  for (const s of (subs ?? []) as Submodule[]) {
    subMap[s.id] = s.name;
  }
  return { rows: (feats ?? []) as FeatureRow[], submodules: subMap };
}

export default async function FeaturesIndexPage() {
  const { rows, submodules } = await loadData();
  return (
    <div className="space-y-6">
      <StandardPageHeader
        icon="Sparkles"
        title="Fonctionnalités"
        description="Gérez les fonctionnalités des sous-modules"
        actions={
          <NewFeatureDialogLazy>
            <Button>Nouvelle fonctionnalité</Button>
          </NewFeatureDialogLazy>
        }
      />
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


