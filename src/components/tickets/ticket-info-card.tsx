import { Badge } from '@/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { getStatusBadgeVariant } from '@/lib/utils/ticket-status';

type TicketInfoData = {
  id: string;
  ticket_type: string;
  status: string;
  priority: string;
  canal?: string | null;
  product?: { name: string } | null;
  module?: { name: string } | null;
  jira_issue_key?: string | null;
  created_at: string;
};

type TicketInfoCardProps = {
  ticket: TicketInfoData;
  isValidated: boolean;
};

/**
 * Carte d'informations du ticket (réutilisable)
 *
 * Affiche les métadonnées principales :
 * - Type, Statut, Priorité, Canal
 * - Produit, Module, Ticket JIRA
 * - Statut de validation
 * - Date de création
 *
 * Utilisé dans :
 * - TicketDetailTabs (mobile)
 * - Page de détails (desktop)
 */
export function TicketInfoCard({ ticket, isValidated }: TicketInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Type
          </label>
          <div className="mt-1">
            <Badge variant="info">{ticket.ticket_type}</Badge>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Statut
          </label>
          <div className="mt-1">
            <Badge variant={getStatusBadgeVariant(ticket.status)}>
              {ticket.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Priorité
          </label>
          <div className="mt-1">
            <Badge variant={ticket.priority === 'High' ? 'danger' : 'info'}>
              {ticket.priority}
            </Badge>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Canal
          </label>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {ticket.canal}
          </p>
        </div>

        {ticket.product && (
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Produit
            </label>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {ticket.product.name}
            </p>
          </div>
        )}

        {ticket.module && (
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Module
            </label>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {ticket.module.name}
            </p>
          </div>
        )}

        {ticket.jira_issue_key && (
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Ticket JIRA
            </label>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {ticket.jira_issue_key}
            </p>
          </div>
        )}

        {isValidated && (
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Statut de validation
            </label>
            <div className="mt-1">
              <Badge variant="success">Validé par un manager</Badge>
            </div>
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Créé le
          </label>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {new Date(ticket.created_at).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
