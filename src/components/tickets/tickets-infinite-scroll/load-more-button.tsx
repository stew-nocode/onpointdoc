'use client';

/**
 * Bouton "Voir plus" pour charger plus de tickets
 * 
 * Composant dédié respectant le principe SRP (Single Responsibility Principle).
 * Gère uniquement l'affichage et le clic du bouton de chargement.
 */

import { Loader2 } from 'lucide-react';
import { Button } from '@/ui/button';

type LoadMoreButtonProps = {
  /**
   * Callback appelé lors du clic sur le bouton
   */
  onLoadMore: () => void;

  /**
   * Indique si le chargement est en cours
   */
  isLoading: boolean;

  /**
   * Indique s'il reste des tickets à charger
   */
  hasMore: boolean;

  /**
   * Texte du bouton (optionnel)
   * @default "Voir plus"
   */
  label?: string;

  /**
   * Classe CSS additionnelle (optionnel)
   */
  className?: string;
};

/**
 * Bouton pour charger plus de tickets
 * 
 * Affiche un spinner de chargement pendant le chargement et se désactive
 * automatiquement si aucun ticket ne reste à charger.
 */
export function LoadMoreButton({
  onLoadMore,
  isLoading,
  hasMore,
  label = 'Voir plus',
  className
}: LoadMoreButtonProps) {
  // Ne pas afficher le bouton s'il n'y a plus de tickets
  if (!hasMore) {
    return null;
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // CRITIQUE : Trouver et sauvegarder l'ID du dernier ticket visible AVANT le clic
    // On va chercher le dernier élément <tr> visible dans le viewport
    const allTicketRows = document.querySelectorAll<HTMLElement>('tr[id]');
    let lastVisibleTicketId: string | null = null;
    
    // Parcourir depuis la fin pour trouver le dernier ticket visible
    for (let i = allTicketRows.length - 1; i >= 0; i--) {
      const row = allTicketRows[i];
      const rect = row.getBoundingClientRect();
      // Ticket visible si dans le viewport (même partiellement)
      if (rect.top >= 0 && rect.top <= window.innerHeight) {
        lastVisibleTicketId = row.id;
        break;
      }
    }
    
    // Si aucun ticket visible trouvé, prendre le dernier ticket de la liste
    if (!lastVisibleTicketId && allTicketRows.length > 0) {
      lastVisibleTicketId = allTicketRows[allTicketRows.length - 1].id;
    }
    
    // Sauvegarder l'ID du ticket dans sessionStorage
    if (lastVisibleTicketId) {
      sessionStorage.setItem('tickets-scroll-ticket-id', lastVisibleTicketId);
      if (process.env.NODE_ENV === 'development') {
        console.log('[DEBUG] ID du dernier ticket visible sauvegardé:', lastVisibleTicketId);
      }
    }
    
    onLoadMore();
  };

  return (
    <div className={`flex justify-center py-6 ${className || ''}`}>
      <Button
        onClick={handleClick}
        disabled={isLoading}
        variant="outline"
        size="lg"
        className="min-w-[120px]"
        aria-label={isLoading ? 'Chargement en cours...' : label}
        type="button"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>Chargement...</span>
          </>
        ) : (
          <span>{label}</span>
        )}
      </Button>
    </div>
  );
}

