import { unstable_noStore as noStore } from 'next/cache';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Edit } from 'lucide-react';

import { getTicketById } from '@/services/tickets/jira-transfer';
import { transferTicketAction } from '../actions';
import { loadTicketInteractions, loadTicketComments } from '@/services/tickets/comments';
import { loadTicketAttachments } from '@/services/tickets/attachments/crud';
import { getAdjacentTickets } from '@/services/tickets/navigation';
import { Button } from '@/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { TransferTicketButton } from '@/components/tickets/transfer-ticket-button';
import { ValidateTicketButton } from '@/components/tickets/validate-ticket-button';
import { TicketDescription } from '@/components/tickets/ticket-description';
import { TicketEditForm } from '@/components/tickets/ticket-edit-form';
import { TicketTimeline } from '@/components/tickets/ticket-timeline';
import { CommentsSectionClient } from '@/components/tickets/comments/comments-section-client';
import { TicketDetailTabs } from '@/components/tickets/ticket-detail-tabs';
import { TicketAttachments } from '@/components/tickets/ticket-attachments';
import { TicketActionsMenu } from '@/components/tickets/ticket-actions-menu';
import { TicketNavigationLink } from '@/components/tickets/ticket-navigation-link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ticketPermissions } from '@/lib/permissions/ticket-permissions';
import { mapTicketToFormData } from '@/lib/mappers/ticket-to-form';
import { TicketInfoCard } from '@/components/tickets/ticket-info-card';
import {
  listProducts,
  listModules,
  listSubmodules,
  listFeatures,
  listModulesForCurrentUser,
  listProductsForCurrentUserDepartment
} from '@/services/products';
import { listBasicProfiles } from '@/services/users/server';
import { listCompanies } from '@/services/companies/server';
import { listActiveDepartments } from '@/services/departments/server';

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

    const [allModules, submodules, features, contacts, companies, allowedModules, departments] = await Promise.all([
      listModules(),
      listSubmodules(),
      listFeatures(),
      listBasicProfiles(),
      listCompanies(),
      listModulesForCurrentUser(),
      listActiveDepartments()
    ]);

    const modules =
      allowedModules && allowedModules.length
        ? allModules.filter((m) => allowedModules.some((am) => am.id === m.id))
        : allModules;

    return { products, modules, submodules, features, contacts, companies, departments };
  } catch (error) {
    console.error('Erreur lors du chargement des données du formulaire:', error);
    return { products: [], modules: [], submodules: [], features: [], contacts: [], companies: [], departments: [] };
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

  // Parallel loading round 1: Load ticket, form data (if edit mode), role, and navigation
  const [ticket, formData, currentUserRole, adjacentTickets] = await Promise.all([
    loadTicket(id),
    isEditMode ? loadFormData() : Promise.resolve(null),
    getCurrentUserRole(),
    getAdjacentTickets(id)
  ]);

  if (!ticket) {
    notFound();
  }

  // Parallel loading round 2: Load interactions, comments, and attachments (only if not edit mode)
  const [interactions, comments, attachments] = !isEditMode
    ? await Promise.all([
        loadTicketInteractions(id, ticket.created_at, ticket.created_by as string | null),
        loadTicketComments(id),
        loadTicketAttachments(id)
      ])
    : [[], [], []];

  const canTransfer = ticketPermissions.canTransfer(ticket);
  const canValidate = ticketPermissions.canValidate(currentUserRole);
  const isValidated = Boolean(ticket.validated_by_manager);

  // Navigation helpers
  const hasPrevious = adjacentTickets.previous !== null;
  const hasNext = adjacentTickets.next !== null;

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
          ticketData={mapTicketToFormData(ticket)}
          products={formData.products}
          modules={formData.modules}
          submodules={formData.submodules}
          features={formData.features}
          contacts={formData.contacts}
          companies={formData.companies}
          departments={formData.departments || []}
        />
      </div>
    );
  }

  return (
    <TicketActionsMenu
      ticket={ticket}
      comments={comments}
      attachments={attachments}
      canEdit={true}
      canArchive={canValidate}
    >
      <div className="flex h-[calc(100vh-4rem)] flex-col gap-4">
        {/* En-tête avec titre, navigation et actions */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
        <div className="flex-1">
          <Link
            href="/gestion/tickets"
            className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            ← Retour à la liste
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{ticket.title}</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Navigation buttons */}
          <TicketNavigationLink
            href={hasPrevious ? `/gestion/tickets/${adjacentTickets.previous}` : '#'}
            disabled={!hasPrevious}
            direction="previous"
            ariaLabel="Ticket précédent"
          />
          <TicketNavigationLink
            href={hasNext ? `/gestion/tickets/${adjacentTickets.next}` : '#'}
            disabled={!hasNext}
            direction="next"
            ariaLabel="Ticket suivant"
          />

          {/* Edit button */}
          <Link href={`/gestion/tickets/${id}?edit=true`}>
            <Button variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Éditer
            </Button>
          </Link>

          {canTransfer && (
            <TransferTicketButton onTransfer={() => transferTicketAction(id)} ticketId={id} />
          )}
          {canValidate && (
            <ValidateTicketButton ticketId={id} isValidated={isValidated} />
          )}
        </div>
      </div>

      {/* Contenu principal : Tabs sur mobile, 2 colonnes sur desktop */}
      <div className="flex min-h-0 flex-1 gap-4 overflow-hidden">
        {/* Mobile/Tablet: Tabs */}
        <div className="lg:hidden w-full">
          <TicketDetailTabs
            ticket={ticket}
            interactions={interactions}
            comments={comments}
            attachments={attachments}
            isValidated={isValidated}
          />
        </div>

        {/* Desktop: 2-column layout */}
        <div className="hidden lg:flex lg:flex-1 lg:gap-4 lg:overflow-hidden">
          {/* Colonne gauche : Détails + Informations + Commentaires */}
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

                  {/* Affichage des pièces jointes */}
                  {attachments.length > 0 && (
                    <TicketAttachments ticketId={id} attachments={attachments} />
                  )}
                </CardContent>
              </Card>

              <TicketInfoCard ticket={ticket} isValidated={isValidated} />
            </div>

            {/* Section Commentaires */}
            <div id="commentaires">
              <CommentsSectionClient ticketId={id} initialComments={comments} />
            </div>
          </div>

          {/* Colonne droite : Timeline fixe avec scroll interne */}
          <div className="w-96 flex-shrink-0">
            <TicketTimeline interactions={interactions} ticketTitle={ticket.title} />
          </div>
        </div>
      </div>
    </div>
    </TicketActionsMenu>
  );
}
