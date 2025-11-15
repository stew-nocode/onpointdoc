import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Button } from '@/ui/button';

const statuses = [
  { label: 'Brouillon', color: 'bg-status-neutral/20 text-slate-600' },
  { label: 'Planifiée', color: 'bg-status-info/20 text-status-info' },
  { label: 'En cours', color: 'bg-status-warning/20 text-status-warning' },
  { label: 'Terminée', color: 'bg-status-success/20 text-status-success' }
];

export default function ActivitesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Activités
          </p>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Planification & comptes rendus
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Cycle de vie : Brouillon → Planifiée → En cours → Terminé → Annulé
          </p>
        </div>
        <Button>Créer une activité</Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Statuts disponibles</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {statuses.map((status) => (
            <span
              key={status.label}
              className={`rounded-full px-4 py-1 text-xs font-semibold uppercase ${status.color}`}
            >
              {status.label}
            </span>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Liaisons clés</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <p>• Une activité peut être liée à plusieurs tickets (table ticket_activity_link).</p>
          <p>• Les participants internes/externes sont gérés via activity_participants.</p>
          <p>• Les comptes rendus utilisent du texte riche + pièces jointes Supabase Storage.</p>
        </CardContent>
      </Card>
    </div>
  );
}

