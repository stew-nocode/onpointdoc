import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Badge } from '@/ui/badge';
import type { CompanyWithRelations } from '@/types/company-with-relations';

type CompanyInfoCardProps = {
  company: CompanyWithRelations;
};

/**
 * Carte d'informations de l'entreprise (réutilisable)
 *
 * Affiche les métadonnées principales :
 * - Nom, Pays, Point focal
 * - Secteurs
 * - Statistiques (utilisateurs, tickets)
 * - Date de création
 *
 * Pattern identique à TicketInfoCard pour cohérence
 */
export function CompanyInfoCard({ company }: CompanyInfoCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Informations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-2">
        {company.country && (
          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Pays
            </label>
            <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
              {company.country.name}
            </p>
          </div>
        )}

        {company.focal_user && (
          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Point focal
            </label>
            <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
              {company.focal_user.full_name}
            </p>
          </div>
        )}

        {company.sectors && company.sectors.length > 0 && (
          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Secteurs
            </label>
            <div className="mt-0.5 flex flex-wrap gap-1.5">
              {company.sectors
                .filter((sector): sector is NonNullable<typeof sector> => sector !== null && sector.name !== null)
                .map((sector) => (
                  <Badge key={sector.id} variant="default">
                    {sector.name}
                  </Badge>
                ))}
            </div>
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Utilisateurs
          </label>
          <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
            {company.users_count}
          </p>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Tickets totaux
          </label>
          <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
            {company.tickets_count}
          </p>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Tickets ouverts
          </label>
          <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
            {company.open_tickets_count}
          </p>
        </div>

        {company.assistance_duration_minutes > 0 && (
          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Durée totale assistances
            </label>
            <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
              {company.assistance_duration_minutes} minutes
            </p>
          </div>
        )}

        {company.jira_company_id && (
          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              ID JIRA
            </label>
            <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
              {company.jira_company_id}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

