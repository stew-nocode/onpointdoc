import { unstable_noStore as noStore } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Button } from '@/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { NewCompanyDialog } from '@/components/companies/new-company-dialog';
import { CompaniesTableClient, type CompanyRow } from '@/components/companies/companies-table-client';
import type { Country } from '@/types/country';
import type { BasicProfile } from '@/services/users';

async function loadCompanies(): Promise<CompanyRow[]> {
  noStore();
  const supabase = await createSupabaseServerClient();
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
  
  // Transform company_sector_link : Supabase retourne un tableau de tableaux
  // On doit le transformer en tableau simple d'objets { sector: { name: string } | null }
  const transformedData: CompanyRow[] = (data ?? []).map((row: {
    id: any;
    name: any;
    created_at: any;
    country_id: any;
    focal_user_id: any;
    company_sector_link: any;
  }) => {
    // Flatten et normaliser company_sector_link
    const normalizedLinks: Array<{ sector: { name: string } | null }> = [];
    if (Array.isArray(row.company_sector_link)) {
      for (const item of row.company_sector_link) {
        if (Array.isArray(item)) {
          // Si c'est un tableau, itérer sur chaque élément
          for (const nestedItem of item) {
            if (nestedItem && typeof nestedItem === 'object' && 'sector' in nestedItem) {
              normalizedLinks.push(nestedItem as { sector: { name: string } | null });
            }
          }
        } else if (item && typeof item === 'object' && 'sector' in item) {
          normalizedLinks.push(item as { sector: { name: string } | null });
        }
      }
    }
    
    return {
      id: row.id as string,
      name: row.name as string,
      created_at: row.created_at as string,
      country_id: row.country_id as string | null,
      focal_user_id: row.focal_user_id as string | null,
      company_sector_link: normalizedLinks
    };
  });
  return transformedData;
}

export default async function CompaniesIndexPage() {
  const companies = await loadCompanies();

  const supabase = await createSupabaseServerClient();
  const [{ data: countries }, { data: profiles }] = await Promise.all([
    supabase.from('countries').select('id, name').order('name', { ascending: true }),
    supabase.from('profiles').select('id, full_name, email').limit(500)
  ]);

  const countriesMap: Record<string, string> = {};
  (countries ?? [] as Country[]).forEach((c) => {
    countriesMap[c.id] = c.name;
  });

  const usersMap: Record<string, string> = {};
  (profiles ?? [] as BasicProfile[]).forEach((p) => {
    usersMap[p.id] = (p.full_name ?? p.email ?? 'Utilisateur');
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


