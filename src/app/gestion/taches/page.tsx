import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Button } from '@/ui/button';

const columns = ['Tâche', 'Assigné', 'Due date', 'Statut', 'Liens'];

export default function TachesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Tâches</p>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            To-do internes liées aux tickets
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Cycle : À faire → En cours → Terminé → Annulé → Bloqué
          </p>
        </div>
        <Button>Créer une tâche</Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Backlog rapide</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <tr>
                {columns.map((column) => (
                  <th key={column} className="pb-2">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-3 text-slate-500 dark:text-slate-400" colSpan={columns.length}>
                  Connectez Supabase pour afficher les tâches planifiées.
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

