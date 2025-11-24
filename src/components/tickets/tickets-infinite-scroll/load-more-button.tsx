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

  return (
    <div className={`flex justify-center py-6 ${className || ''}`}>
      <Button
        onClick={onLoadMore}
        disabled={isLoading}
        variant="outline"
        size="lg"
        className="min-w-[120px]"
        aria-label={isLoading ? 'Chargement en cours...' : label}
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

