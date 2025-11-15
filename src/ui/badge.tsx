import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-semibold uppercase tracking-wide',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900',
        info: 'border-transparent bg-status-info/15 text-status-info dark:bg-status-info/20 dark:text-status-info',
        warning:
          'border-transparent bg-status-warning/15 text-status-warning dark:bg-status-warning/20 dark:text-status-warning',
        success:
          'border-transparent bg-status-success/15 text-status-success dark:bg-status-success/20 dark:text-status-success',
        danger:
          'border-transparent bg-status-danger/15 text-status-danger dark:bg-status-danger/20 dark:text-status-danger',
        outline: 'text-slate-700 dark:text-slate-200'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

