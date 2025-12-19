'use client';

import { useState } from 'react';
import { Button } from '@/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/ui/alert';

type TransferTicketButtonProps = {
  onTransfer: () => Promise<void>;
  ticketId: string;
};

export const TransferTicketButton = ({
  onTransfer,
  ticketId
}: TransferTicketButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTransfer = async () => {
    if (
      !confirm(
        'Êtes-vous sûr de vouloir transférer ce ticket vers JIRA ? Cette action changera le statut à "Transféré".'
      )
    ) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onTransfer();
      // ✅ Plus besoin de router.refresh() - revalidatePath est appelé dans la Server Action
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erreur lors du transfert'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handleTransfer}
        disabled={isLoading}
        variant="destructive"
        className="bg-status-danger hover:bg-status-danger/90"
      >
        {isLoading ? 'Transfert en cours...' : 'Transférer vers JIRA'}
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

