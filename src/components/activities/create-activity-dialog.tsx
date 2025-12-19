'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ActivityForm } from '@/components/forms/activity-form';
import { Button } from '@/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/ui/dialog';
import type { CreateActivityInput } from '@/lib/validators/activity';
import type { BasicProfile } from '@/services/users';

type CreateActivityDialogProps = {
  participants: BasicProfile[];
  onSubmit: (values: CreateActivityInput) => Promise<string | void>;
};

export const CreateActivityDialog = ({
  participants,
  onSubmit
}: CreateActivityDialogProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Gère la soumission du formulaire avec possibilité de continuer ou fermer
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
        setOpen(false);
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Créer une activité</Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw]">
        <DialogHeader>
          <DialogTitle>Créer une nouvelle activité</DialogTitle>
          <DialogDescription>
            Remplissez le formulaire pour créer une activité (revue, atelier, brainstorming, etc.).
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
        />
      </DialogContent>
    </Dialog>
  );
};
