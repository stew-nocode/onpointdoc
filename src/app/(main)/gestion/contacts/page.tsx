import { unstable_noStore as noStore } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Button } from '@/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { NewContactDialog } from '@/components/users/new-contact-dialog';

type Row = {
  id: string;
  email: string | null;
  full_name: string | null;
  company_id: string | null;
  is_active: boolean | null;
};

async function loadContacts(): Promise<{ rows: Row[]; companies: Record<string, string> }> {
  noStore();
  const supabase = createSupabaseServerClient();
  const [{ data: contacts, error: cErr }, { data: companies, error: pErr }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, email, full_name, company_id, is_active')
      .order('full_name', { ascending: true })
      .limit(200),
    supabase.from('companies').select('id, name').order('name', { ascending: true })
  ]);
  if (cErr || pErr) throw new Error(cErr?.message || pErr?.message || 'Load error');
  const map: Record<string, string> = {};
  for (const c of companies ?? []) map[(c as any).id] = (c as any).name;
  return { rows: (contacts as any) ?? [], companies: map };
}

export default async function ContactsPage() {
  const { rows, companies } = await loadContacts();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Contacts</h1>
        <NewContactDialog>
          <Button>Nouveau contact</Button>
        </NewContactDialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Liste des contacts (internes et externes)</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <tr>
                <th className="pb-2">Nom</th>
                <th className="pb-2">Email</th>
                <th className="pb-2">Entreprise</th>
                <th className="pb-2">Actif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-3 font-medium">{u.full_name ?? '-'}</td>
                  <td className="py-3">{u.email ?? '-'}</td>
                  <td className="py-3">{(u.company_id && companies[u.company_id]) ?? '-'}</td>
                  <td className="py-3">{u.is_active ? 'Oui' : 'Non'}</td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    Aucun contact.
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


