'use client';

import * as React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return <RadioGroupPrimitive.Root className={cn('grid gap-2', className)} {...props} ref={ref} />;
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
 * Props pour le composant RadioCard
 */
type RadioCardProps = {
  /** Valeur unique de l'option */
  value: string;
  /** Libellé affiché à côté de l'icône */
  label: string;
  /** Icône optionnelle affichée avant le libellé */
  icon?: React.ReactNode;
  /** Classes CSS additionnelles */
  className?: string;
};

/**
 * Composant RadioCard pour les choix avec icônes.
 * Affiche une carte cliquable avec une icône et un libellé.
 * 
 * @param props - Les propriétés du composant
 * @returns Un élément RadioGroup.Item stylisé comme une carte
 */
export function RadioCard({ value, label, icon, className }: RadioCardProps) {
  return (
    <RadioGroupPrimitive.Item
      value={value}
      id={value}
      className={cn(
        'group relative flex w-full min-w-0 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-slate-200 bg-white px-3 py-2.5 transition-all hover:border-brand hover:bg-brand/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 data-[state=checked]:border-brand data-[state=checked]:bg-brand data-[state=checked]:text-white dark:border-slate-700 dark:bg-slate-900 dark:hover:border-brand dark:hover:bg-brand/20 dark:data-[state=checked]:border-brand dark:data-[state=checked]:bg-brand dark:data-[state=checked]:text-white',
        className
      )}
    >
      {icon && (
        <div className="flex-shrink-0 text-slate-600 group-data-[state=checked]:text-white dark:text-slate-300 dark:group-data-[state=checked]:text-white">
          {icon}
        </div>
      )}
      <label htmlFor={value} className="cursor-pointer text-sm font-medium text-slate-700 group-data-[state=checked]:text-white dark:text-slate-200 dark:group-data-[state=checked]:text-white">
        {label}
      </label>
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, RadioGroupItem };

