'use client';

/**
 * Utilitaires pour l'affichage des tickets
 * 
 * Fonctions réutilisables pour le rendu des tickets dans les tableaux
 * Séparant la logique de présentation selon les principes Clean Code
 */

import React from 'react';
import { Bug, FileText, HelpCircle, AlertCircle } from 'lucide-react';

/**
 * Met en surbrillance les termes recherchés dans un texte
 * 
 * @param text - Texte dans lequel rechercher
 * @param searchTerm - Terme à mettre en surbrillance
 * @returns Éléments React avec les termes en surbrillance
 * 
 * @example
 * highlightText("Mon ticket important", "ticket")
 * // Retourne: ["Mon ", <mark>ticket</mark>, " important"]
 */
export function highlightText(
  text: string,
  searchTerm?: string
): string | React.ReactNode[] {
  if (!searchTerm || !text) return text;

  const regex = new RegExp(
    `(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
    'gi'
  );
  const parts = text.split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark
        key={index}
        className="bg-yellow-200 dark:bg-yellow-900/50 px-0.5 rounded"
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
}

/**
 * Retourne l'icône correspondant au type de ticket
 * 
 * @param type - Type de ticket (BUG, REQ, ASSISTANCE)
 * @returns Composant d'icône React
 * 
 * @example
 * getTicketTypeIcon("BUG")
 * // Retourne: <Bug className="h-3.5 w-3.5 text-red-500" />
 */
export function getTicketTypeIcon(type: string): React.ReactNode {
  switch (type) {
    case 'BUG':
      return <Bug className="h-3.5 w-3.5 text-red-500" />;
    case 'REQ':
      return <FileText className="h-3.5 w-3.5 text-blue-500" />;
    case 'ASSISTANCE':
      return <HelpCircle className="h-3.5 w-3.5 text-amber-500" />;
    default:
      return <AlertCircle className="h-3.5 w-3.5 text-slate-400" />;
  }
}

/**
 * Retourne la classe CSS pour la couleur de priorité
 * 
 * @param priority - Priorité du ticket (Critical, High, Medium, Low)
 * @returns Classe CSS pour la couleur
 * 
 * @example
 * getPriorityColorClass("Critical")
 * // Retourne: "text-red-600 dark:text-red-400"
 */
export function getPriorityColorClass(priority: string): string {
  switch (priority?.toUpperCase()) {
    case 'CRITICAL':
      return 'text-red-600 dark:text-red-400';
    case 'HIGH':
      return 'text-orange-600 dark:text-orange-400';
    case 'MEDIUM':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'LOW':
      return 'text-slate-600 dark:text-slate-400';
    default:
      return 'text-slate-600 dark:text-slate-400';
  }
}

/**
 * Extrait les initiales d'un nom complet
 * 
 * @param name - Nom complet de l'utilisateur
 * @returns Initiales (max 2 caractères)
 * 
 * @example
 * getUserInitials("Jean Dupont")
 * // Retourne: "JD"
 */
export function getUserInitials(name: string): string {
  if (!name) return '';
  
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Retourne la classe CSS pour la couleur d'avatar basée sur le nom
 * 
 * Utilise une fonction de hachage simple basée sur le premier caractère
 * pour générer une couleur cohérente pour chaque utilisateur.
 * 
 * @param name - Nom de l'utilisateur
 * @returns Classe CSS pour la couleur d'avatar
 * 
 * @example
 * getAvatarColorClass("Jean Dupont")
 * // Retourne: "bg-blue-500" (couleur déterminée par le premier caractère)
 */
export function getAvatarColorClass(name: string): string {
  if (!name) return 'bg-slate-500';

  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-teal-500'
  ];

  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

