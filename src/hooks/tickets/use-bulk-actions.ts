'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { BulkUpdateStatusInput, BulkReassignInput, BulkUpdatePriorityInput } from '@/lib/validators/bulk-actions';

/**
 * Résultat d'une action en masse
 */
export type BulkActionResult = {
  success: boolean;
  updatedCount: number;
  failedCount: number;
  errors?: string[];
};

/**
 * Hook pour gérer les actions en masse sur les tickets
 * 
 * @returns État et fonctions pour les actions en masse
 */
export function useBulkActions() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Met à jour le statut de plusieurs tickets en masse
   */
  const updateStatus = useCallback(
    async (payload: BulkUpdateStatusInput): Promise<BulkActionResult | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/tickets/bulk/status', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Erreur lors de la mise à jour du statut');
        }

        const result: BulkActionResult = await response.json();

        if (result.success) {
          toast.success(`${result.updatedCount} ticket(s) mis à jour avec succès`);
          if (result.failedCount > 0 && result.errors) {
            result.errors.forEach((err) => toast.warning(err));
          }
          router.refresh();
        } else {
          throw new Error('Erreur lors de la mise à jour');
        }

        return result;
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour du statut';
        setError(errorMessage);
        toast.error(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  /**
   * Réassigne plusieurs tickets en masse
   */
  const reassign = useCallback(
    async (payload: BulkReassignInput): Promise<BulkActionResult | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/tickets/bulk/reassign', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Erreur lors de la réassignation');
        }

        const result: BulkActionResult = await response.json();

        if (result.success) {
          toast.success(`${result.updatedCount} ticket(s) réassignés avec succès`);
          if (result.failedCount > 0 && result.errors) {
            result.errors.forEach((err) => toast.warning(err));
          }
          router.refresh();
        } else {
          throw new Error('Erreur lors de la réassignation');
        }

        return result;
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la réassignation';
        setError(errorMessage);
        toast.error(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  /**
   * Met à jour la priorité de plusieurs tickets en masse
   */
  const updatePriority = useCallback(
    async (payload: BulkUpdatePriorityInput): Promise<BulkActionResult | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/tickets/bulk/priority', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Erreur lors de la mise à jour de la priorité');
        }

        const result: BulkActionResult = await response.json();

        if (result.success) {
          toast.success(`${result.updatedCount} ticket(s) mis à jour avec succès`);
          if (result.failedCount > 0 && result.errors) {
            result.errors.forEach((err) => toast.warning(err));
          }
          router.refresh();
        } else {
          throw new Error('Erreur lors de la mise à jour de la priorité');
        }

        return result;
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour de la priorité';
        setError(errorMessage);
        toast.error(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  /**
   * Exporte plusieurs tickets en CSV
   */
  const exportToCSV = useCallback(async (ticketIds: string[]): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/tickets/bulk/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ticketIds, format: 'csv' })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur lors de l\'export');
      }

      // Télécharger le fichier CSV
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tickets-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(`${ticketIds.length} ticket(s) exportés avec succès`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'export';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    updateStatus,
    reassign,
    updatePriority,
    exportToCSV
  };
}

