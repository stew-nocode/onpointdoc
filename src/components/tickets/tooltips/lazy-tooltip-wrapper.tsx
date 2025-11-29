'use client';

/**
 * Wrapper pour Tooltip avec lazy loading des données
 * 
 * Principe Clean Code - Niveau Senior :
 * - SRP : Une seule responsabilité (gérer l'état open/close du tooltip)
 * - Encapsule la logique de contrôle du tooltip
 * - Passe l'état isOpen au contenu pour le lazy loading
 * 
 * ✅ OPTIMISÉ : Le contenu ne charge les données que quand isOpen = true
 */

import React, { useState } from 'react';
import { Tooltip, TooltipTrigger } from '@/ui/tooltip';

type LazyTooltipWrapperProps = {
  /**
   * Contenu à afficher dans le trigger (généralement un bouton ou élément interactif)
   */
  trigger: React.ReactNode;

  /**
   * Contenu du tooltip (doit accepter un prop isOpen optionnel)
   */
  content: React.ReactElement<{ isOpen?: boolean }>;
};

/**
 * Wrapper de Tooltip qui gère l'état ouvert/fermé et le passe au contenu
 * 
 * Permet au contenu (comme UserStatsTooltip ou TicketStatsTooltip) de charger
 * les données seulement quand le tooltip est ouvert (lazy loading).
 */
export function LazyTooltipWrapper({ trigger, content }: LazyTooltipWrapperProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Tooltip open={isOpen} onOpenChange={setIsOpen}>
      <TooltipTrigger asChild>{trigger}</TooltipTrigger>
      {/* ✅ CRITIQUE : Ne rendre le contenu QUE si le tooltip est ouvert */}
      {/* Cela évite le montage du composant et donc le déclenchement du useEffect */}
      {isOpen && React.cloneElement(content, { isOpen })}
    </Tooltip>
  );
}

