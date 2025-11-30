/**
 * Section Boutons de Soumission du formulaire de ticket
 * 
 * Composant atomique pour respecter les principes Clean Code (< 100 lignes)
 */

'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/ui/button';

type TicketSubmitButtonsProps = {
  mode: 'create' | 'edit';
  isSubmitting: boolean;
  onSubmitAndContinue?: () => void;
};

/**
 * Section pour afficher les boutons de soumission
 * 
 * @param mode - Mode du formulaire (création ou édition)
 * @param isSubmitting - État de soumission
 * @param onSubmitAndContinue - Handler pour soumettre et continuer (mode création uniquement)
 */
export function TicketSubmitButtons({
  mode,
  isSubmitting,
  onSubmitAndContinue
}: TicketSubmitButtonsProps) {
  if (mode === 'create' && onSubmitAndContinue) {
    return (
      <div className="flex gap-2 w-full">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          disabled={isSubmitting}
          onClick={onSubmitAndContinue}
        >
          {isSubmitting ? (
            'Création...'
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Créer et continuer
            </>
          )}
        </Button>
        <Button className="flex-1" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Création...' : 'Créer le ticket'}
        </Button>
      </div>
    );
  }

  return (
    <Button className="w-full" disabled={isSubmitting} type="submit">
      {isSubmitting
        ? mode === 'edit'
          ? 'Enregistrement...'
          : 'Création...'
        : mode === 'edit'
          ? 'Enregistrer les modifications'
          : 'Créer le ticket'}
    </Button>
  );
}

