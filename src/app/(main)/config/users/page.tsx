import { unstable_noStore as noStore } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Button } from '@/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { UserPlus } from 'lucide-react';
import { NewUserDialog } from '@/components/users/new-user-dialog';
import { UsersTableClient, type UserRow } from '@/components/users/users-table-client';

async function loadUsers(): Promise<UserRow[]> {
  noStore();
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, department, is_active, company_id')
    .neq('role', 'client')
    .order('full_name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data as any) ?? [];
}

export default async function UsersIndexPage() {
  const users = await loadUsers();
  const supabase = createSupabaseServerClient();
  const { data: companies } = await supabase.from('companies').select('id, name').order('name', { ascending: true });
  const companiesMap: Record<string, string> = {};
  (companies ?? []).forEach((c: any) => {
    companiesMap[c.id] = c.name;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Utilisateurs</h1>
        <NewUserDialog>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Nouvel utilisateur
          </Button>
        </NewUserDialog>
      </div>
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


