/**
 * Hook pour révéler progressivement un texte (style chat IA)
 * 
 * Révèle le texte mot par mot ou par groupes de mots pour un effet fluide
 * sans effet de frappe caractère par caractère
 */

import { useState, useEffect, useCallback } from 'react';

type UseTextRevealOptions = {
  /** Texte complet à révéler */
  text: string | null;
  /** Vitesse de révélation en millisecondes par unité */
  speed?: number;
  /** Unité de révélation : 'word' (mot par mot) ou 'sentence' (phrase par phrase) */
  unit?: 'word' | 'sentence';
  /** Callback appelé quand la révélation est terminée */
  onComplete?: () => void;
  /** Démarrer automatiquement quand le texte change */
  autoStart?: boolean;
};

type UseTextRevealResult = {
  /** Texte révélé progressivement */
  revealedText: string;
  /** Indique si la révélation est en cours */
  isRevealing: boolean;
  /** Indique si la révélation est terminée */
  isComplete: boolean;
  /** Démarrer la révélation */
  start: () => void;
  /** Arrêter la révélation */
  stop: () => void;
  /** Réinitialiser */
  reset: () => void;
  /** Afficher tout le texte immédiatement */
  showAll: () => void;
};

/**
 * Hook pour révéler progressivement un texte
 * 
 * @param options - Options de configuration
 * @returns État et méthodes pour gérer la révélation
 * 
 * @example
 * const { revealedText, isRevealing, start } = useTextReveal({
 *   text: 'Hello world',
 *   speed: 50,
 *   unit: 'word'
 * });
 */
export function useTextReveal(
  options: UseTextRevealOptions
): UseTextRevealResult {
  const {
    text,
    speed = 50,
    unit = 'word',
    onComplete,
    autoStart = true
  } = options;

  const [revealedText, setRevealedText] = useState('');
  const [isRevealing, setIsRevealing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [fullText, setFullText] = useState<string | null>(null);

  // Découper le texte en unités (mots ou phrases)
  const splitText = useCallback((input: string): string[] => {
    if (unit === 'word') {
      // Découper en mots en préservant les espaces et retours à la ligne
      return input.split(/(\s+|\n+)/).filter(part => part.length > 0);
    } else {
      // Découper en phrases
      return input.split(/([.!?]+\s*|\n\n+)/).filter(part => part.trim().length > 0);
    }
  }, [unit]);

  /**
   * Termine la révélation et met à jour l'état
   */
  const finishReveal = useCallback(() => {
    setIsRevealing(false);
    setIsComplete(true);
    setRevealedText(fullText || '');
    onComplete?.();
  }, [fullText, onComplete]);

  /**
   * Ajoute une partie au texte révélé
   * 
   * @param currentText - Le texte actuel
   * @param part - La partie à ajouter
   * @returns Le nouveau texte
   */
  const addPartToRevealed = useCallback((currentText: string, part: string): string => {
    return currentText + part;
  }, []);

  /**
   * Fonction récursive pour révéler progressivement les parties du texte
   * 
   * @param parts - Tableau des parties à révéler
   * @param currentIndex - Index de la partie actuelle
   * @param currentText - Texte actuellement révélé
   */
  const revealNext = useCallback((
    parts: string[],
    currentIndex: number,
    currentText: string
  ) => {
    if (currentIndex >= parts.length) {
      finishReveal();
      return;
    }

    // Ajouter la partie actuelle
    const newText = addPartToRevealed(currentText, parts[currentIndex]);
    setRevealedText(newText);

    const nextIndex = currentIndex + 1;

    // Continuer avec la prochaine partie ou terminer
    if (nextIndex < parts.length) {
      setTimeout(() => revealNext(parts, nextIndex, newText), speed);
    } else {
      finishReveal();
    }
  }, [speed, finishReveal, addPartToRevealed]);

  // Démarrer la révélation
  const start = useCallback(() => {
    if (!fullText) return;

    setIsRevealing(true);
    setIsComplete(false);
    setRevealedText('');

    const parts = splitText(fullText);
    revealNext(parts, 0, '');
  }, [fullText, splitText, revealNext]);

  // Arrêter la révélation
  const stop = useCallback(() => {
    setIsRevealing(false);
  }, []);

  // Réinitialiser
  const reset = useCallback(() => {
    setIsRevealing(false);
    setIsComplete(false);
    setRevealedText('');
    setFullText(null);
  }, []);

  // Afficher tout immédiatement
  const showAll = useCallback(() => {
    if (!fullText) return;
    setIsRevealing(false);
    setIsComplete(true);
    setRevealedText(fullText);
    onComplete?.();
  }, [fullText, onComplete]);

  // Mettre à jour le texte complet quand il change
  useEffect(() => {
    if (text !== null && text !== fullText) {
      setFullText(text);
      setIsComplete(false);
      setIsRevealing(false);
      setRevealedText(''); // Réinitialiser pour démarrer une nouvelle révélation
      
      if (autoStart && text) {
        // Démarrer après un petit délai pour permettre le rendu
        const timer = setTimeout(() => {
          start();
        }, 100);
        return () => clearTimeout(timer);
      }
    } else if (text === null && fullText !== null) {
      // Si le texte devient null, réinitialiser
      reset();
    }
  }, [text, fullText, autoStart, start, reset]);

  return {
    revealedText,
    isRevealing,
    isComplete,
    start,
    stop,
    reset,
    showAll
  };
}

