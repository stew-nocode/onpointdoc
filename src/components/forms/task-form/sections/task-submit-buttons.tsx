/**
 * Boutons de soumission du formulaire de tâche
 * 
 * Composant atomique pour respecter les principes Clean Code (< 100 lignes)
 * 
 * Pattern identique à ActivitySubmitButtons avec labels adaptés
 */

'use client';

import { Button } from '@/ui/button';

type TaskSubmitButtonsProps = {
  isSubmitting: boolean;
  onSubmitAndContinue?: () => void;
};

/**
 * Boutons de soumission du formulaire de tâche
 * 
 * @param isSubmitting - Indique si le formulaire est en cours de soumission
 * @param onSubmitAndContinue - Fonction pour soumettre et continuer
 */
export function TaskSubmitButtons({ isSubmitting, onSubmitAndContinue }: TaskSubmitButtonsProps) {
  return (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-4 border-t">
      {onSubmitAndContinue && (
        <Button
          type="button"
          variant="outline"
          onClick={onSubmitAndContinue}
          disabled={isSubmitting}
        >
          Créer et continuer
        </Button>
      )}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Création...' : 'Créer la tâche'}
      </Button>
    </div>
  );
}
