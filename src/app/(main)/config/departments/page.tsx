import { unstable_noStore as noStore } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Button } from '@/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { NewDepartmentDialog } from '@/components/departments/new-department-dialog';
import { DepartmentsTableClient, type DepartmentRow } from '@/components/departments/departments-table-client';

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Départements</h1>
        <NewDepartmentDialog>
          <Button>Nouveau département</Button>
        </NewDepartmentDialog>
      </div>

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

