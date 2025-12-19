import { unstable_noStore as noStore } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Button } from '@/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { NewUserDialogLazy } from '@/components/users/new-user-dialog-lazy';
import { UsersTableClient, type UserRow } from '@/components/users/users-table-client';
import type { Company } from '@/types/company';
import { StandardPageHeader } from '@/components/layout/page';

async function loadUsers(): Promise<UserRow[]> {
  noStore();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, department, is_active, company_id')
    .neq('role', 'client')
    .order('full_name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as UserRow[];
}

export default async function UsersIndexPage() {
  const users = await loadUsers();
  const supabase = await createSupabaseServerClient();
  const { data: companies } = await supabase.from('companies').select('id, name').order('name', { ascending: true });
  const companiesMap: Record<string, string> = {};
  (companies ?? [] as Company[]).forEach((c) => {
    companiesMap[c.id] = c.name;
  });

  return (
    <div className="space-y-6">
      <StandardPageHeader
        icon="Users"
        title="Utilisateurs"
        description="Gérez les utilisateurs de l'application"
        actions={
          <NewUserDialogLazy>
            <Button>Nouvel utilisateur</Button>
          </NewUserDialogLazy>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Liste des utilisateurs</CardTitle>
        </CardHeader>
        <CardContent>
          <UsersTableClient rows={users} companies={companiesMap} />
        </CardContent>
      </Card>
    </div>
  );
}


