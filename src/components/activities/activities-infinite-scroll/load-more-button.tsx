'use client';

/**
 * Composant bouton "Voir plus" pour charger plus d'activités
 * 
 * Pattern similaire à LoadMoreButton pour tickets
 * 
 * Gère :
 * - L'affichage du bouton avec état de chargement
 * - La sauvegarde de la position de scroll avant le chargement
 * - La restauration de la position après le chargement (gérée par le parent)
 */

import { Button } from '@/ui/button';
import { Loader2 } from 'lucide-react';

type LoadMoreButtonProps = {
  /**
   * Fonction appelée lors du clic sur le bouton
   */
  onLoadMore: () => Promise<void>;

  /**
   * Indique si un chargement est en cours
   */
  isLoading: boolean;

  /**
   * Indique s'il reste des activités à charger
   */
  hasMore: boolean;

  /**
   * Label du bouton
   */
  label?: string;
};

/**
 * Composant bouton "Voir plus" pour les activités
 * 
 * Sauvegarde la position de scroll avant le chargement pour restauration ultérieure.
 * 
 * @param props - Propriétés du composant
 */
export function LoadMoreButton({
  onLoadMore,
  isLoading,
  hasMore,
  label = 'Voir plus'
}: LoadMoreButtonProps) {
  const handleClick = async () => {
    // Sauvegarder l'ID de la dernière activité visible avant le chargement
    // pour restaurer la position après chargement
    const allActivityRows = document.querySelectorAll<HTMLElement>('tr[id]');
    let lastVisibleActivityId: string | null = null;
    
    // Trouver la dernière activité visible à l'écran
    for (let i = allActivityRows.length - 1; i >= 0; i--) {
      const row = allActivityRows[i];
      const rect = row.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        lastVisibleActivityId = row.id;
        break;
      }
    }
    
    // Si aucune activité visible, prendre la dernière de la liste
    if (!lastVisibleActivityId && allActivityRows.length > 0) {
      lastVisibleActivityId = allActivityRows[allActivityRows.length - 1].id;
    }
    
    // Sauvegarder l'ID dans sessionStorage pour restauration
    if (lastVisibleActivityId) {
      sessionStorage.setItem('activities-scroll-activity-id', lastVisibleActivityId);
    }
    
    // Charger plus d'activités
    await onLoadMore();
  };

  if (!hasMore) {
    return null;
  }

  return (
    <div className="flex justify-center py-6">
      <Button
        onClick={handleClick}
        disabled={isLoading}
        variant="outline"
        size="sm"
        className="min-w-[120px]"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Chargement...
          </>
        ) : (
          label
        )}
      </Button>
    </div>
  );
}
