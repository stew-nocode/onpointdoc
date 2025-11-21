import { unstable_noStore as noStore } from 'next/cache';
import { notFound } from 'next/navigation';
import Link from 'next/link';

import { getTicketById, transferTicketToJira } from '@/services/tickets/jira-transfer';
import { loadTicketInteractions } from '@/services/tickets/comments';
import { Badge } from '@/ui/badge';
import { Button } from '@/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { TransferTicketButton } from '@/components/tickets/transfer-ticket-button';
import { ValidateTicketButton } from '@/components/tickets/validate-ticket-button';
import { TicketDescription } from '@/components/tickets/ticket-description';
import { TicketEditForm } from '@/components/tickets/ticket-edit-form';
import { TicketTimeline } from '@/components/tickets/ticket-timeline';
import { getStatusBadgeVariant } from '@/lib/utils/ticket-status';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  listProducts,
  listModules,
  listSubmodules,
  listFeatures,
  listModulesForCurrentUser,
  listProductsForCurrentUserDepartment
} from '@/services/products';
import { listBasicProfiles } from '@/services/users/server';

async function loadTicket(id: string) {
  noStore();
  try {
    return await getTicketById(id);
  } catch (error) {
    console.error('Erreur lors du chargement du ticket:', error);
    return null;
  }
}

async function loadFormData() {
  noStore();
  try {
    const departmentProducts = await listProductsForCurrentUserDepartment();
    const products = departmentProducts.length > 0 ? departmentProducts : await listProducts();
    
    const [allModules, submodules, features, contacts, allowedModules] = await Promise.all([
      listModules(),
      listSubmodules(),
      listFeatures(),
      listBasicProfiles(),
      listModulesForCurrentUser()
    ]);

    const modules =
      allowedModules && allowedModules.length
        ? allModules.filter((m) => allowedModules.some((am) => am.id === m.id))
        : allModules;

    return { products, modules, submodules, features, contacts };
  } catch (error) {
    console.error('Erreur lors du chargement des données du formulaire:', error);
    return { products: [], modules: [], submodules: [], features: [], contacts: [] };
  }
}

async function getCurrentUserRole() {
  noStore();
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('auth_uid', user.id)
      .single();

    return profile?.role ?? null;
  } catch {
    return null;
  }
}

type TicketDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
};

export default async function TicketDetailPage({
  params,
  searchParams
}: TicketDetailPageProps) {
  const { id } = await params;
  const { edit } = await searchParams;
  const isEditMode = edit === 'true';
  
  const [ticket, formData, currentUserRole] = await Promise.all([
    loadTicket(id),
    isEditMode ? loadFormData() : Promise.resolve(null),
    getCurrentUserRole()
  ]);

  // Charger les interactions uniquement si le ticket existe et n'est pas en mode édition
  const interactions = ticket && !isEditMode
    ? await loadTicketInteractions(
        id,
        ticket.created_at,
        ticket.created_by as string | null
      )
    : [];

  if (!ticket) {
    notFound();
  }

  async function handleTransfer() {
    'use server';
    try {
      await transferTicketToJira(id);
    } catch (error) {
      throw error;
    }
  }

  const canTransfer =
    ticket.ticket_type === 'ASSISTANCE' && ticket.status === 'En_cours';

  // Vérifier si l'utilisateur est un manager ou un admin (pour le bouton de validation)
  const canValidate =
    currentUserRole === 'manager' ||
    currentUserRole?.includes('manager') ||
    currentUserRole === 'admin';
  
  const isValidated = Boolean(ticket.validated_by_manager);

  // Si mode édition, afficher le formulaire d'édition
  if (isEditMode && formData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/gestion/tickets"
              className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              ← Retour à la liste
            </Link>
            <h1 className="mt-2 text-2xl font-bold">Édition : {ticket.title}</h1>
          </div>
        </div>
        <TicketEditForm
          ticketId={id}
          ticketData={{
            title: String(ticket.title ?? ''),
            description: String(ticket.description ?? ''),
            ticket_type: (ticket.ticket_type ?? 'ASSISTANCE') as 'BUG' | 'REQ' | 'ASSISTANCE',
            status: String(ticket.status ?? 'Nouveau'),
            canal: (ticket.canal ?? 'Whatsapp') as 'Whatsapp' | 'Email' | 'Appel' | 'Autre',
            priority: (ticket.priority ?? 'Medium') as 'Low' | 'Medium' | 'High' | 'Critical',
            customer_context: ticket.customer_context ? String(ticket.customer_context) : null,
            contact_user_id: ticket.contact_user_id ? String(ticket.contact_user_id) : null,
            bug_type: ticket.bug_type ? String(ticket.bug_type) : null,
            product_id: ticket.product_id ? String(ticket.product_id) : null,
            module_id: ticket.module_id ? String(ticket.module_id) : null,
            submodule_id: ticket.submodule_id ? String(ticket.submodule_id) : null,
            feature_id: ticket.feature_id ? String(ticket.feature_id) : null
          }}
          products={formData.products}
          modules={formData.modules}
          submodules={formData.submodules}
          features={formData.features}
          contacts={formData.contacts}
        />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-4">
      {/* En-tête avec titre et actions */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
        <div>
          <Link
            href="/gestion/tickets"
            className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            ← Retour à la liste
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{ticket.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          {canTransfer && (
            <TransferTicketButton onTransfer={handleTransfer} ticketId={id} />
          )}
          {canValidate && (
            <ValidateTicketButton ticketId={id} isValidated={isValidated} />
          )}
        </div>
      </div>

      {/* Contenu principal : Infos en haut, Timeline à droite avec scroll interne */}
      <div className="flex min-h-0 flex-1 gap-4 overflow-hidden">
        {/* Colonne gauche : Détails + Informations en haut */}
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Détails du ticket</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Description
                  </label>
                  <TicketDescription description={ticket.description} />
                </div>

                {ticket.customer_context && (
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Contexte client
                    </label>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      {ticket.customer_context}
                    </p>
                  </div>
                )}

                {ticket.duration_minutes && (
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Durée de l&apos;assistance
                    </label>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      {ticket.duration_minutes} minutes
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

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
          </div>
        </div>

        {/* Colonne droite : Timeline fixe avec scroll interne */}
        <div className="hidden lg:block w-96 flex-shrink-0">
          <TicketTimeline interactions={interactions} ticketTitle={ticket.title} />
        </div>
      </div>
    </div>
  );
}




