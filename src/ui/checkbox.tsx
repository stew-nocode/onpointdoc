'use client';

import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';

export type CheckboxProps = React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & {
  indeterminate?: boolean;
};

const Checkbox = React.forwardRef<React.ElementRef<typeof CheckboxPrimitive.Root>, CheckboxProps>(
  ({ className, indeterminate, ...props }, ref) => (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        'peer h-4 w-4 shrink-0 rounded-sm border border-slate-300 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-brand data-[state=checked]:text-brand-foreground data-[state=indeterminate]:bg-brand data-[state=indeterminate]:text-brand-foreground dark:border-slate-700 dark:ring-offset-slate-900 dark:focus-visible:ring-brand dark:data-[state=checked]:bg-brand dark:data-[state=indeterminate]:bg-brand',
        className
      )}
      checked={indeterminate ? 'indeterminate' : props.checked}
      {...props}
    >
      <CheckboxPrimitive.Indicator className={cn('flex items-center justify-center text-current')}>
        {indeterminate ? (
          <div className="h-2 w-2 bg-current" />
        ) : (
          <Check className="h-4 w-4" />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
);
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };

