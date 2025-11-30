'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { TicketForm } from '@/components/forms/ticket-form';
import { Button } from '@/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/ui/dialog';
import type { CreateTicketInput } from '@/lib/validators/ticket';
import type { Product, Module, Submodule, Feature } from '@/services/products';
import type { BasicProfile } from '@/services/users';
import type { BasicCompany } from '@/services/companies';

type CreateTicketDialogProps = {
  products: Product[];
  modules: Module[];
  submodules: Submodule[];
  features: Feature[];
  contacts: BasicProfile[];
  companies: BasicCompany[];
  onSubmit: (values: CreateTicketInput) => Promise<string | void>;
};

export const CreateTicketDialog = ({
  products,
  modules,
  submodules,
  features,
  contacts,
  companies,
  onSubmit
}: CreateTicketDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Gère la soumission du formulaire avec possibilité de continuer ou fermer
   * 
   * @param values - Valeurs du formulaire
   * @param files - Fichiers joints (optionnel)
   * @param shouldClose - Si true, ferme le dialog après création (défaut: true)
   */
  const handleSubmit = async (values: CreateTicketInput, files?: File[], shouldClose: boolean = true) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const id = await onSubmit(values);
      if (!id) {
        throw new Error('Aucun ID de ticket retourné');
      }
      
      // Upload attachments si présents
      if (files && files.length) {
        try {
          const { uploadTicketAttachments } = await import('@/services/tickets/attachments.client');
          await uploadTicketAttachments(id, files);
        } catch (uploadError: any) {
          console.error('Erreur lors de l\'upload des pièces jointes:', uploadError);
          // Ne pas bloquer la création du ticket si l'upload échoue
          toast.warning('Ticket créé mais erreur lors de l\'upload des pièces jointes');
        }
      }
      
      // Afficher un toast avec message adapté selon le mode
      if (shouldClose) {
        toast.success('Ticket créé avec succès');
      } else {
        toast.success('Ticket créé avec succès. Le formulaire a été réinitialisé pour créer un autre ticket.', {
          duration: 4000
        });
      }
      
      // Fermer le dialog uniquement si shouldClose est true
      if (shouldClose) {
        setOpen(false);
      }
      // ✅ Plus besoin de router.refresh() - revalidatePath est appelé dans la Server Action
    } catch (error: any) {
      console.error('Erreur lors de la création du ticket:', error);
      const errorMessage = error?.message ?? 'Erreur lors de la création du ticket';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Créer un ticket</Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw]">
        <DialogHeader>
          <DialogTitle>Créer un nouveau ticket</DialogTitle>
          <DialogDescription>
            Remplissez le formulaire pour créer un ticket Assistance, BUG ou REQUÊTE.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <div className="rounded-lg border border-status-danger/50 bg-status-danger/10 p-3 text-sm text-status-danger">
            {error}
          </div>
        )}
        <TicketForm
          onSubmit={(values, files) => handleSubmit(values, files, true)}
          onSubmitAndContinue={(values, files) => handleSubmit(values, files, false)}
          products={products}
          modules={modules}
          submodules={submodules}
          features={features}
          contacts={contacts}
          companies={companies}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
};

