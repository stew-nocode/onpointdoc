import { unstable_noStore as noStore } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Button } from '@/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { NewDepartmentDialogLazy } from '@/components/departments/new-department-dialog-lazy';
import { DepartmentsTableClient, type DepartmentRow } from '@/components/departments/departments-table-client';
import { StandardPageHeader } from '@/components/layout/page';

async function loadDepartments(): Promise<DepartmentRow[]> {
  noStore();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('departments')
    .select('id, name, code, description, color, is_active, created_at')
    .order('name', { ascending: true });
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as DepartmentRow[];
}

export default async function DepartmentsIndexPage() {
  const departments = await loadDepartments();

  return (
    <div className="space-y-6">
      <StandardPageHeader
        icon="Building2"
        title="Départements"
        description="Gérez les départements de l'organisation"
        actions={
          <NewDepartmentDialogLazy>
            <Button>Nouveau département</Button>
          </NewDepartmentDialogLazy>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Liste des départements</CardTitle>
        </CardHeader>
        <CardContent>
          <DepartmentsTableClient rows={departments} />
        </CardContent>
      </Card>
    </div>
  );
}

