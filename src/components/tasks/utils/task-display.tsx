/**
 * Utilitaires pour l'affichage des tâches
 * 
 * Pattern similaire à activity-display.tsx pour cohérence
 * 
 * Fonctions utilitaires pour :
 * - Formater les dates
 * - Obtenir les couleurs de badges pour les statuts de tâches
 * - Surligner le texte de recherche
 * - Obtenir les initiales des utilisateurs
 * - Obtenir les classes de couleur d'avatar
 */

import React from 'react';
import { Calendar } from 'lucide-react';
import type { TaskStatus } from '@/types/task-with-relations';

/**
 * Variant de badge pour le statut de tâche
 */
export function getTaskStatusBadgeVariant(status: TaskStatus): 'success' | 'danger' | 'warning' | 'info' | 'secondary' {
  switch (status) {
    case 'Termine':
      return 'success';
    case 'Annule':
      return 'danger';
    case 'En_cours':
      return 'info';
    case 'Bloque':
      return 'warning';
    case 'A_faire':
      return 'secondary';
    default:
      return 'secondary';
  }
}

/**
 * Formate une date ISO en format français court (JJ/MM/YYYY)
 */
export function formatDateShort(dateISO: string | null | undefined): string {
  if (!dateISO) return '-';
  
  try {
    return new Date(dateISO).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return '-';
  }
}

/**
 * Formate une date ISO en format français complet avec heure
 */
export function formatDateTimeFull(dateISO: string | null | undefined): string {
  if (!dateISO) return '-';
  
  try {
    return new Date(dateISO).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '-';
  }
}

/**
 * Surligne le terme de recherche dans un texte
 * 
 * @param text - Texte à surligner
 * @param search - Terme de recherche
 * @returns Élément React avec le texte surligné
 */
export function highlightText(text: string, search: string): React.ReactNode {
  if (!search || !text) return text;
  
  const regex = new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  
  return (
    <>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <mark key={index} className="bg-yellow-200 dark:bg-yellow-900/50 px-0.5 rounded">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

/**
 * Extrait les initiales d'un nom complet
 * 
 * @param fullName - Nom complet (ex: "Jean Dupont")
 * @returns Initiales (ex: "JD")
 */
export function getUserInitials(fullName: string | null | undefined): string {
  if (!fullName) return '?';
  
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Génère une classe de couleur d'avatar basée sur le nom
 * Utilise une fonction de hachage simple pour générer une couleur stable
 * 
 * @param name - Nom pour générer la couleur
 * @returns Classe CSS pour la couleur de l'avatar
 */
export function getAvatarColorClass(name: string | null | undefined): string {
  if (!name) return 'bg-slate-500';
  
  // Fonction de hachage simple pour générer un index de couleur
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Palette de couleurs cohérente (similaire à activity-display.tsx)
  const colors = [
    'bg-blue-600',
    'bg-green-600',
    'bg-purple-600',
    'bg-pink-600',
    'bg-indigo-600',
    'bg-yellow-600',
    'bg-red-600',
    'bg-teal-600',
    'bg-orange-600',
    'bg-cyan-600',
  ];
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

/**
 * Vérifie si une date d'échéance est en retard
 * 
 * @param dueDate - Date d'échéance ISO string
 * @param status - Statut de la tâche
 * @returns true si la tâche est en retard, false sinon
 */
export function isTaskOverdue(dueDate: string | null | undefined, status: TaskStatus): boolean {
  if (!dueDate) return false;
  
  // Si la tâche est terminée ou annulée, elle n'est pas en retard
  if (status === 'Termine' || status === 'Annule') {
    return false;
  }
  
  try {
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    
    return due < today;
  } catch {
    return false;
  }
}
