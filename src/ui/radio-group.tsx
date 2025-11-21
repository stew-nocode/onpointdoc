'use client';

import * as React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return <RadioGroupPrimitive.Root className={cn('grid gap-1.5', className)} {...props} ref={ref} />;
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        'aspect-square h-4 w-4 rounded-full border border-slate-300 text-brand ring-offset-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:ring-offset-slate-950 dark:focus-visible:ring-brand',
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className="h-2.5 w-2.5 fill-current text-current" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

/**
 * Variantes disponibles pour le composant RadioCard
 */
type RadioCardVariant = 'default' | 'compact';

/**
 * Props pour le composant RadioCard
 */
type RadioCardProps = {
  /** Valeur unique de l'option */
  value: string;
  /** Libellé affiché à côté de l'icône */
  label: string;
  /** Icône optionnelle affichée avant le libellé */
  icon?: React.ReactNode;
  /** Variante d'affichage : 'default' (horizontal) ou 'compact' (vertical, ~1/3 de la taille) */
  variant?: RadioCardVariant;
  /** Classes CSS additionnelles */
  className?: string;
};

/**
 * Classes CSS communes à toutes les variantes de RadioCard
 */
const RADIO_CARD_BASE_CLASSES =
  'group relative cursor-pointer rounded-lg border-2 border-slate-200 bg-white transition-all hover:border-brand hover:bg-brand/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 data-[state=checked]:border-brand data-[state=checked]:bg-brand data-[state=checked]:text-white dark:border-slate-700 dark:bg-slate-900 dark:hover:border-brand dark:hover:bg-brand/20 dark:data-[state=checked]:border-brand dark:data-[state=checked]:bg-brand dark:data-[state=checked]:text-white';

/**
 * Classes CSS pour la variante 'default' (layout horizontal)
 */
const RADIO_CARD_DEFAULT_CLASSES =
  'flex w-full min-w-0 items-center justify-center gap-1.5 px-2 py-1.5';

/**
 * Classes CSS pour la variante 'compact' (layout vertical, ~1/3 de la taille)
 */
const RADIO_CARD_COMPACT_CLASSES =
  'flex flex-col items-center justify-center gap-0.5 min-w-[2.5rem] h-10 px-1 py-1';

/**
 * Classes CSS pour l'icône selon la variante
 */
const getIconClasses = (variant: RadioCardVariant): string => {
  const baseClasses =
    'flex-shrink-0 text-slate-600 group-data-[state=checked]:text-white dark:text-slate-300 dark:group-data-[state=checked]:text-white';
  const sizeClasses = variant === 'compact' ? '[&>svg]:h-3 [&>svg]:w-3' : '[&>svg]:h-3.5 [&>svg]:w-3.5';
  return `${baseClasses} ${sizeClasses}`;
};

/**
 * Classes CSS pour le label selon la variante
 */
const getLabelClasses = (variant: RadioCardVariant): string => {
  const baseClasses =
    'cursor-pointer font-medium text-slate-700 group-data-[state=checked]:text-white dark:text-slate-200 dark:group-data-[state=checked]:text-white';
  const sizeClasses = variant === 'compact' ? 'text-[10px] text-center leading-tight' : 'text-sm';
  return `${baseClasses} ${sizeClasses}`;
};

/**
 * Composant RadioCard pour les choix avec icônes.
 * Affiche une carte cliquable avec une icône et un libellé.
 * 
 * @param value - Valeur unique de l'option
 * @param label - Libellé affiché
 * @param icon - Icône optionnelle
 * @param variant - Variante d'affichage ('default' ou 'compact')
 * @param className - Classes CSS additionnelles
 * @returns Un élément RadioGroup.Item stylisé comme une carte
 * 
 * @example
 * // Variante par défaut (horizontal)
 * <RadioCard value="BUG" label="BUG" icon={<Bug />} />
 * 
 * @example
 * // Variante compacte (vertical, ~1/3 de la taille)
 * <RadioCard value="BUG" label="BUG" icon={<Bug />} variant="compact" />
 */
export function RadioCard({
  value,
  label,
  icon,
  variant = 'default',
  className
}: RadioCardProps) {
  const layoutClasses =
    variant === 'compact' ? RADIO_CARD_COMPACT_CLASSES : RADIO_CARD_DEFAULT_CLASSES;
  const iconClasses = getIconClasses(variant);
  const labelClasses = getLabelClasses(variant);

  return (
    <RadioGroupPrimitive.Item
      value={value}
      id={value}
      className={cn(RADIO_CARD_BASE_CLASSES, layoutClasses, className)}
    >
      {icon && <div className={iconClasses}>{icon}</div>}
      <label htmlFor={value} className={labelClasses}>
        {label}
      </label>
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, RadioGroupItem };

