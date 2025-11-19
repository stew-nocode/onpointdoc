import { unstable_noStore as noStore } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Button } from '@/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { NewCompanyDialog } from '@/components/companies/new-company-dialog';
import { CompaniesTableClient, type CompanyRow } from '@/components/companies/companies-table-client';

async function loadCompanies(): Promise<CompanyRow[]> {
  noStore();
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('companies')
    .select(
      `
      id,
      name,
      created_at,
      country_id,
      focal_user_id,
      company_sector_link ( sector:sector_id ( name ) )
    `
    )
    .order('created_at', { ascending: false });
  if (error) {
    throw new Error(error.message);
  }
  return (data as any) ?? [];
}

export default async function CompaniesIndexPage() {
  const companies = await loadCompanies();

  const supabase = createSupabaseServerClient();
  const [{ data: countries }, { data: profiles }] = await Promise.all([
    supabase.from('countries').select('id, name').order('name', { ascending: true }),
    supabase.from('profiles').select('id, full_name, email').limit(500)
  ]);

  const countriesMap: Record<string, string> = {};
  (countries ?? []).forEach((c: any) => {
    countriesMap[c.id] = c.name;
  });

  const usersMap: Record<string, string> = {};
  (profiles ?? []).forEach((p: any) => {
    usersMap[p.id] = (p.full_name as string) ?? (p.email as string) ?? 'Utilisateur';
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Compagnies</h1>
        <NewCompanyDialog>
          <Button>Nouvelle compagnie</Button>
        </NewCompanyDialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des compagnies</CardTitle>
        </CardHeader>
        <CardContent>
          <CompaniesTableClient rows={companies} countries={countriesMap} users={usersMap} />
        </CardContent>
      </Card>
    </div>
  );
}


