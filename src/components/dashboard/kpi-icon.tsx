/**
 * Composant pour afficher une icône KPI résolue
 * Utilise un composant séparé pour éviter la création de composant pendant le render
 */

'use client';

import { createElement, useMemo } from 'react';
import { type LucideIcon } from 'lucide-react';
import { getIconById, type IconId } from '@/lib/utils/icon-map';
import { cn } from '@/lib/utils';

type KPIIconProps = {
  icon: LucideIcon | IconId;
  variant: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
};

const iconStyles = {
  default: 'text-slate-600 dark:text-slate-400',
  success: 'text-green-600 dark:text-green-400',
  warning: 'text-orange-600 dark:text-orange-400',
  danger: 'text-red-600 dark:text-red-400',
  info: 'text-blue-600 dark:text-blue-400'
};

/**
 * Composant d'icône KPI
 * Résout l'icône en fonction du type (string ou composant)
 * Utilise useMemo pour éviter la création de composant pendant le render
 */
export function KPIIcon({ icon, variant, className }: KPIIconProps) {
  const resolvedIcon = useMemo<LucideIcon | undefined>(() => {
    if (typeof icon === 'string') {
      return getIconById(icon);
    }
    return icon;
  }, [icon]);

  if (!resolvedIcon) {
    return null;
  }

  return createElement(resolvedIcon, {
    className: cn('h-3 w-3', iconStyles[variant], className)
  });
}

