import { unstable_noStore as noStore } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Button } from '@/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Eye, Pencil, Trash2, UserPlus } from 'lucide-react';
import { NewUserDialog } from '@/components/users/new-user-dialog';
import { EditUserDialog } from '@/components/users/edit-user-dialog';
import { ViewUserDialog } from '@/components/users/view-user-dialog';
import { DeleteUserButton } from '@/components/users/delete-user-button';

type Row = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  department: string | null;
  is_active: boolean | null;
  company_id: string | null;
};

async function loadUsers(): Promise<Row[]> {
  noStore();
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, department, is_active, company_id')
    .order('full_name', { ascending: true })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data as any) ?? [];
}

export default async function UsersIndexPage() {
  const users = await loadUsers();
  // Map company_id -> company name
  const supabase = createSupabaseServerClient();
  const { data: companies } = await supabase.from('companies').select('id, name').order('name', { ascending: true });
  const companyIdToName = new Map<string, string>((companies ?? []).map((c: any) => [c.id as string, c.name as string]));
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
        <CardContent className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <tr>
                <th className="pb-2">Nom</th>
                <th className="pb-2">Email</th>
                <th className="pb-2">Rôle</th>
                <th className="pb-2">Département</th>
                <th className="pb-2">Entreprise</th>
                <th className="pb-2">Actif</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-3 font-medium">{u.full_name ?? '-'}</td>
                  <td className="py-3">{u.email ?? '-'}</td>
                  <td className="py-3 capitalize">{u.role}</td>
                  <td className="py-3">{u.department ?? '-'}</td>
                  <td className="py-3">{(u.company_id && companyIdToName.get(u.company_id)) ?? '-'}</td>
                  <td className="py-3">{u.is_active ? 'Oui' : 'Non'}</td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <ViewUserDialog
                        userId={u.id}
                        trigger={
                          <button
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md p-0 text-slate-600 hover:bg-slate-600/10 dark:text-slate-200 dark:hover:bg-slate-200/10"
                            aria-label="Voir"
                          >
                            <Eye className="h-3 w-3" />
                          </button>
                        }
                      />
                      <EditUserDialog
                        userId={u.id}
                        trigger={
                          <button
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md p-0 text-slate-600 hover:bg-slate-600/10 dark:text-slate-200 dark:hover:bg-slate-200/10"
                            aria-label="Modifier"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        }
                      />
                      <DeleteUserButton
                        userId={u.id}
                        userName={u.full_name ?? u.email ?? 'Utilisateur'}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md p-0 text-slate-600 hover:bg-slate-600/10 dark:text-slate-200 dark:hover:bg-slate-200/10"
                      >
                        <Trash2 className="h-3 w-3" />
                      </DeleteUserButton>
                    </div>
                  </td>
                </tr>
              ))}
              {!users.length && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    Aucun utilisateur.
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


