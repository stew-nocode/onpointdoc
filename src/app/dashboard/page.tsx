import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Badge } from '@/ui/badge';

const metrics = [
  { label: 'MTTR global', value: '38h', trend: '+5h vs semaine -1', trendVariant: 'warning' },
  { label: 'Tickets ouverts', value: '126', trend: '-12% vs semaine -1', trendVariant: 'success' },
  { label: 'Activités planifiées', value: '18', trend: '+3 ateliers', trendVariant: 'info' },
  { label: 'Tâches en retard', value: '7', trend: '+2', trendVariant: 'danger' }
] as const;

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Vue Direction
        </p>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Pilotage stratégique</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          KPIs clés : MTTR, flux tickets, charge de travail et santé produit OBC / SNI / Credit Factory.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="space-y-2">
              <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-300">
                {metric.label}
              </CardTitle>
              <div className="text-3xl font-semibold text-slate-900 dark:text-white">{metric.value}</div>
            </CardHeader>
            <CardContent>
              <Badge variant={metric.trendVariant as never}>{metric.trend}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Roadmap intégrations N8N ↔ JIRA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <p>
            • Webhooks JIRA pour statuts, commentaires et assignations <span className="font-semibold">(en cours)</span>
          </p>
          <p>• Bouton Transférer Assistance → flux IT (prêt pour tests)</p>
          <p>• Mapping statuts JIRA ↔ Supabase (à finaliser par produit)</p>
        </CardContent>
      </Card>
    </div>
  );
}

