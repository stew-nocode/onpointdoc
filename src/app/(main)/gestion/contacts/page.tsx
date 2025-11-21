import { unstable_noStore as noStore } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Button } from '@/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { NewContactDialogLazy } from '@/components/users/new-contact-dialog-lazy';
import { ContactsPageClient } from '@/components/users/contacts-page-client';
import type { ContactRow } from '@/components/users/contacts-table';
import type { Company } from '@/types/company';

async function loadContacts(): Promise<{ rows: ContactRow[]; companies: Record<string, string> }> {
  noStore();
  const supabase = await createSupabaseServerClient();
  const [{ data: contacts, error: cErr }, { data: companies, error: pErr }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, email, full_name, company_id, is_active, role')
      .order('full_name', { ascending: true })
      .limit(200),
    supabase.from('companies').select('id, name').order('name', { ascending: true })
  ]);
  if (cErr || pErr) throw new Error(cErr?.message || pErr?.message || 'Load error');
  const map: Record<string, string> = {};
  for (const c of (companies ?? []) as Company[]) {
    map[c.id] = c.name;
  }
  return { rows: (contacts ?? []) as ContactRow[], companies: map };
}

export default async function ContactsPage() {
  const { rows, companies } = await loadContacts();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Contacts
          </p>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Gestion des contacts (internes et externes)
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Points focaux clients et utilisateurs internes associés aux entreprises.
          </p>
        </div>
        <NewContactDialogLazy>
          <Button>Nouveau contact</Button>
        </NewContactDialogLazy>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Liste des contacts (internes et externes)</CardTitle>
        </CardHeader>
        <CardContent>
          <ContactsPageClient rows={rows} companies={companies} />
        </CardContent>
      </Card>
    </div>
  );
}


