'use client';

/**
 * Composant client pour l'édition d'un ticket
 * 
 * Charge les données du ticket et affiche le formulaire d'édition
 * Utilise TicketForm en mode édition avec les valeurs initiales du ticket
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { TicketForm } from '@/components/forms/ticket-form';
import { Button } from '@/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import type { CreateTicketInput } from '@/lib/validators/ticket';
import type { Product, Module, Submodule, Feature } from '@/services/products';
import type { BasicProfile } from '@/services/users';
import type { BasicCompany } from '@/services/companies';
import type { BasicDepartment } from '@/components/forms/ticket-form/sections';
import { updateTicketAction } from '@/app/(main)/gestion/tickets/actions';

type TicketEditFormProps = {
  ticketId: string;
  ticketData: {
    title: string;
    description: string;
    ticket_type: 'BUG' | 'REQ' | 'ASSISTANCE';
    status: string;
    canal: string;
    priority: string;
    customer_context: string | null;
    contact_user_id: string | null;
    company_id: string | null;
    bug_type: string | null;
    product_id: string | null;
    module_id: string | null;
    submodule_id: string | null;
    feature_id: string | null;
  };
  products: Product[];
  modules: Module[];
  submodules: Submodule[];
  features: Feature[];
  contacts: BasicProfile[];
  companies: BasicCompany[];
  departments: BasicDepartment[];
};

/**
 * Formulaire d'édition de ticket
 * 
 * @param ticketId - ID du ticket à éditer
 * @param ticketData - Données du ticket à éditer
 * @param products - Liste des produits
 * @param modules - Liste des modules
 * @param submodules - Liste des sous-modules
 * @param features - Liste des fonctionnalités
 * @param contacts - Liste des contacts
 * @param companies - Liste des entreprises
 */
export function TicketEditForm({
  ticketId,
  ticketData,
  products,
  modules,
  submodules,
  features,
  contacts,
  companies,
  departments
}: TicketEditFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = () => {
    router.push(`/gestion/tickets/${ticketId}`);
  };

  /**
   * Gère la soumission du formulaire d'édition
   * 
   * Principe Clean Code :
   * - SRP : Une seule responsabilité (mettre à jour un ticket)
   * - Utilise directement la Server Action (pas d'API route intermédiaire)
   * - Pas de router.refresh() (revalidatePath dans la Server Action)
   * 
   * @param values - Valeurs du formulaire
   * @param files - Fichiers à uploader (optionnel)
   */
  const handleSubmit = async (values: CreateTicketInput, files?: File[]) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // ✅ Utiliser la Server Action directement (revalidatePath inclus)
      await updateTicketAction({
        id: ticketId,
        title: values.title,
        description: values.description,
        type: values.type,
        channel: values.channel,
        productId: values.productId || null,
        moduleId: values.moduleId || null,
        submoduleId: values.submoduleId || null,
        featureId: values.featureId || null,
        priority: values.priority,
        customerContext: values.customerContext || null,
        contactUserId: values.contactUserId || null,
        companyId: values.companyId || null,
        bug_type: values.bug_type || null,
        status: values.status || undefined
      });

      // Upload des fichiers si présents (optionnel pour l'édition)
      if (files && files.length) {
        try {
          const { uploadTicketAttachments } = await import('@/services/tickets/attachments.client');
          await uploadTicketAttachments(ticketId, files);
        } catch (uploadError) {
          console.error('Erreur lors de l\'upload des pièces jointes:', uploadError);
          toast.warning('Ticket mis à jour mais erreur lors de l\'upload des pièces jointes');
        }
      }

      toast.success('Ticket mis à jour avec succès');
      
      // ✅ Plus besoin de router.refresh() - revalidatePath est appelé dans la Server Action
      // Rediriger vers la page de détail du ticket
      router.push(`/gestion/tickets/${ticketId}`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour du ticket';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Préparer les valeurs initiales pour le formulaire
  const initialValues: Partial<CreateTicketInput> = {
    title: ticketData.title,
    description: ticketData.description,
    type: ticketData.ticket_type,
    channel: ticketData.canal as CreateTicketInput['channel'],
    priority: ticketData.priority as CreateTicketInput['priority'],
    customerContext: ticketData.customer_context ?? '',
    contactUserId: ticketData.contact_user_id ?? '',
    companyId: ticketData.company_id ?? '',
    bug_type: ticketData.bug_type as CreateTicketInput['bug_type'] | null,
    productId: ticketData.product_id ?? '',
    moduleId: ticketData.module_id ?? '',
    submoduleId: ticketData.submodule_id ?? '',
    featureId: ticketData.feature_id ?? '',
    status: ticketData.status as CreateTicketInput['status']
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Édition du ticket</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
            <p className="font-medium">Erreur</p>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        )}
        <TicketForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          products={products}
          modules={modules}
          submodules={submodules}
          features={features}
          contacts={contacts}
          companies={companies}
          departments={departments}
          initialValues={initialValues}
          mode="edit"
        />
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="secondary" onClick={handleCancel} disabled={isSubmitting}>
            Annuler
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

