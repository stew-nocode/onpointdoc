/**
 * Dialog pour créer une activité à partir d'un ticket
 * 
 * Réutilise ActivityForm avec pré-remplissage du ticket sélectionné
 * Respecte les principes Clean Code
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ActivityForm } from '@/components/forms/activity-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog';
import type { CreateActivityInput } from '@/lib/validators/activity';
import type { BasicProfile } from '@/services/users';

type CreateActivityFromTicketDialogProps = {
  /**
   * ID du ticket à partir duquel créer l'activité
   */
  ticketId: string;
  
  
  /**
   * Liste des participants disponibles
   */
  participants: BasicProfile[];
  
  /**
   * Fonction de soumission du formulaire
   */
  onSubmit: (values: CreateActivityInput) => Promise<string | void>;
  
  /**
   * État contrôlé : ouverture du dialog
   */
  open: boolean;
  
  /**
   * Callback pour changer l'état d'ouverture
   */
  onOpenChange: (open: boolean) => void;
};

/**
 * Dialog pour créer une activité à partir d'un ticket
 * 
 * Pré-remplit automatiquement :
 * - linkedTicketIds avec l'ID du ticket
 * 
 * Masque la section de sélection des tickets car le ticket est déjà pré-rempli.
 * 
 * @param ticketId - ID du ticket source
 * @param participants - Liste des participants disponibles
 * @param onSubmit - Fonction de soumission
 * @param open - État d'ouverture contrôlé
 * @param onOpenChange - Callback pour changer l'état
 */
export const CreateActivityFromTicketDialog = ({
  ticketId,
  participants,
  onSubmit,
  open,
  onOpenChange
}: CreateActivityFromTicketDialogProps) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Gère la soumission du formulaire
   * 
   * @param values - Valeurs du formulaire
   * @param shouldClose - Si true, ferme le dialog après création (défaut: true)
   */
  const handleSubmit = async (values: CreateActivityInput, shouldClose: boolean = true) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const id = await onSubmit(values);
      if (!id) {
        throw new Error('Aucun ID d\'activité retourné');
      }
      
      // Afficher un toast avec message adapté selon le mode
      if (shouldClose) {
        toast.success('Activité créée avec succès');
      } else {
        toast.success('Activité créée avec succès. Le formulaire a été réinitialisé pour créer une autre activité.', {
          duration: 4000
        });
      }
      
      // Fermer le dialog uniquement si shouldClose est true
      if (shouldClose) {
        onOpenChange(false);
      }
      // Plus besoin de router.refresh() - revalidatePath est appelé dans la Server Action
    } catch (error: any) {
      console.error('Erreur lors de la création de l\'activité:', error);
      const errorMessage = error?.message ?? 'Erreur lors de la création de l\'activité';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pré-remplir uniquement les tickets liés (pas le titre)
  const initialValues: Partial<CreateActivityInput> = {
    linkedTicketIds: [ticketId]
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw]">
        <DialogHeader>
          <DialogTitle>Créer une activité à partir de ce ticket</DialogTitle>
          <DialogDescription>
            Remplissez le formulaire pour créer une activité liée au ticket. Le ticket sera automatiquement associé à l'activité.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <div className="rounded-lg border border-status-danger/50 bg-status-danger/10 p-3 text-sm text-status-danger">
            {error}
          </div>
        )}
        <ActivityForm
          onSubmit={(values) => handleSubmit(values, true)}
          onSubmitAndContinue={(values) => handleSubmit(values, false)}
          participants={participants}
          isSubmitting={isSubmitting}
          initialValues={initialValues}
          hideTicketsSection={true}
        />
      </DialogContent>
    </Dialog>
  );
};


