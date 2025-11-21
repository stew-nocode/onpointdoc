'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/ui/alert';
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

type ValidateTicketButtonProps = {
  ticketId: string;
  isValidated?: boolean;
};

/**
 * Bouton pour valider un ticket en tant que manager
 * 
 * Met à jour le champ validated_by_manager = true (non bloquant, pour reporting)
 * Visible uniquement pour les managers
 */
export const ValidateTicketButton = ({
  ticketId,
  isValidated = false
}: ValidateTicketButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleValidate = async () => {
    if (isValidated) {
      toast.info('Ce ticket est déjà validé');
      return;
    }

    if (
      !confirm(
        'Êtes-vous sûr de vouloir valider ce ticket ? Cette action marquera le ticket comme validé par un manager (non bloquant, pour reporting uniquement).'
      )
    ) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/tickets/${ticketId}/validate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erreur inconnue' }));
        throw new Error(errorData.message || `Erreur ${response.status}`);
      }

      toast.success('Ticket validé avec succès');
      router.refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la validation';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidated) {
    return (
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-status-success" />
        <span className="text-sm text-slate-600 dark:text-slate-400">Validé par un manager</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleValidate}
        disabled={isLoading}
        variant="default"
        className="bg-status-success hover:bg-status-success/90"
      >
        {isLoading ? 'Validation en cours...' : 'Valider'}
      </Button>
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

