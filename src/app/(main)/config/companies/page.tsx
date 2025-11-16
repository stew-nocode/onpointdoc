import { unstable_noStore as noStore } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Button } from '@/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { EditCompanyDialog } from '@/components/companies/edit-company-dialog';
import { ViewCompanyDialog } from '@/components/companies/view-company-dialog';
import { DeleteCompanyButton } from '@/components/companies/delete-company-button';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { NewCompanyDialog } from '@/components/companies/new-company-dialog';

type CompanyRow = {
  id: string;
  name: string;
  created_at: string;
  country_id: string | null;
  focal_user_id: string | null;
  company_sector_link: Array<{ sector: { name: string } | null }>;
};

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
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) {
    throw new Error(error.message);
  }
  return (data as any) ?? [];
}

export default async function CompaniesIndexPage() {
  const companies = await loadCompanies();

  // Charger tous les pays pour mapper country_id -> name
  const supabase = createSupabaseServerClient();
  const { data: countries } = await supabase
    .from('countries')
    .select('id, name')
    .order('name', { ascending: true });
  const countryIdToName = new Map<string, string>(
    (countries ?? []).map((c: any) => [c.id as string, (c.name as string) ?? ''])
  );
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .limit(500);
  const userIdToName = new Map<string, string>(
    (profiles ?? []).map((p: any) => [
      p.id as string,
      ((p.full_name as string) ?? (p.email as string) ?? 'Utilisateur') as string
    ])
  );

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
        <CardContent className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <tr>
                <th className="pb-2">Nom</th>
                <th className="pb-2">Pays</th>
                <th className="pb-2">Point focal</th>
                <th className="pb-2">Secteurs</th>
                <th className="pb-2">Créée le</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {companies.map((c) => {
                const sectors =
                  c.company_sector_link?.map((l) => l.sector?.name).filter(Boolean).join(', ') || '-';
                return (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 font-medium">{c.name}</td>
                    <td className="py-3">{(c.country_id && countryIdToName.get(c.country_id)) ?? '-'}</td>
                    <td className="py-3">{(c.focal_user_id && userIdToName.get(c.focal_user_id)) ?? '-'}</td>
                    <td className="py-3">{sectors}</td>
                    <td className="py-3">
                      {new Date(c.created_at).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <ViewCompanyDialog
                          companyId={c.id}
                          trigger={
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label="Voir"
                              className="h-7 w-7 p-0 text-slate-600 hover:bg-slate-600/10 dark:text-slate-200 dark:hover:bg-slate-200/10"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          }
                        />
                        <EditCompanyDialog
                          companyId={c.id}
                          trigger={
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label="Modifier"
                              className="h-7 w-7 p-0 text-slate-600 hover:bg-slate-600/10 dark:text-slate-200 dark:hover:bg-slate-200/10"
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          }
                        />
                        <DeleteCompanyButton
                          companyId={c.id}
                          companyName={c.name}
                          className="h-7 w-7 p-0 text-slate-600 hover:bg-slate-600/10 dark:text-slate-200 dark:hover:bg-slate-200/10"
                        >
                          <Trash2 className="h-3 w-3" />
                        </DeleteCompanyButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!companies.length && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    Aucune compagnie enregistrée.
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


