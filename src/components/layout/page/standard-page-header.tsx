'use client';

import { ReactNode } from 'react';
import {
  Mail,
  Building2,
  Package,
  Layers,
  Sparkles,
  Users,
  Building,
  Ticket,
  Calendar,
  CheckSquare,
  RefreshCw
} from 'lucide-react';

/**
 * Mapping des noms d'icônes vers leurs composants Lucide
 * 
 * Permet de passer le nom de l'icône depuis un Server Component
 * et de l'importer dynamiquement dans ce Client Component
 */
const iconMap = {
  Mail,
  Building2,
  Package,
  Layers,
  Sparkles,
  Users,
  Building,
  Ticket,
  Calendar,
  CheckSquare,
  RefreshCw
} as const;

type IconName = keyof typeof iconMap;

type StandardPageHeaderProps = {
  /**
   * Nom de l'icône à afficher à côté du titre (optionnel)
   * Doit correspondre à une clé du mapping iconMap
   */
  icon?: IconName;
  
  /**
   * Titre principal de la page (H1)
   */
  title: string;
  
  /**
   * Description sous le titre (optionnel)
   */
  description?: string;
  
  /**
   * Actions à droite (boutons, etc.) (optionnel)
   */
  actions?: ReactNode;
};

/**
 * En-tête standardisé pour toutes les pages
 * 
 * Basé sur le pattern de la page marketing/email :
 * - Icône optionnelle à côté du titre (passée par nom string)
 * - Titre H1 avec style cohérent (text-3xl font-bold tracking-tight)
 * - Description optionnelle sous le titre
 * - Actions à droite (boutons de synchronisation, création, etc.)
 * 
 * @param icon - Nom de l'icône Lucide à afficher (ex: "Mail", "Ticket", "Calendar")
 * @param title - Titre principal de la page
 * @param description - Description optionnelle sous le titre
 * @param actions - Actions à droite (boutons, etc.)
 * 
 * @example
 * ```tsx
 * <StandardPageHeader
 *   icon="Mail"
 *   title="Email Marketing"
 *   description="Gestion des campagnes email Brevo"
 *   actions={
 *     <>
 *       <Button>Synchroniser</Button>
 *       <Button>Nouvelle campagne</Button>
 *     </>
 *   }
 * />
 * ```
 */
export function StandardPageHeader({
  icon,
  title,
  description,
  actions
}: StandardPageHeaderProps) {
  const IconComponent = icon ? iconMap[icon] : undefined;

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          {IconComponent && <IconComponent className="h-5 w-5" />}
          {title}
        </h1>
        {description && (
          <p className="text-sm text-slate-500 mt-0.5 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}

